/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, SimulatorCategoryId, LevelConfig, PerformanceReport } from './types/simulator';
import { loadGameState, saveGameState } from './utils/storage';
import { restoreFromCloudSyncPayload, submitScoreToLeaderboard, syncToCloud } from './utils/cloudSync';
import { SIMULATOR_CATEGORIES } from './utils/constants';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { CategorySelect } from './components/CategorySelect';
import { LevelSelect } from './components/LevelSelect';
import { FlightSimulator } from './components/simulators/FlightSimulator';
import { DrivingSimulator } from './components/simulators/DrivingSimulator';
import { FarmingSimulator } from './components/simulators/FarmingSimulator';
import { CityBuildingSimulator } from './components/simulators/CityBuildingSimulator';

import { ScoreModal } from './components/ScoreModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AchievementsModal } from './components/AchievementsModal';

export default function App() {
  // Master Game State
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());

  // Navigation State
  const [activeView, setActiveView] = useState<'CATEGORIES' | 'LEVEL_SELECT' | 'PLAYING'>('CATEGORIES');
  const [selectedCategory, setSelectedCategory] = useState<SimulatorCategoryId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);

  // Modals
  const [scoreReport, setScoreReport] = useState<PerformanceReport | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);

  // Check for cross-device URL parameter sync on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const syncPayload = params.get('sync');
      if (syncPayload) {
        const restored = restoreFromCloudSyncPayload(syncPayload, gameState);
        if (restored) {
          setGameState(restored);
          // Clean URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, []);

  // Save to storage whenever state updates
  const handleUpdateState = useCallback((newState: GameState) => {
    setGameState(newState);
    saveGameState(newState);
  }, []);

  // Navigation Handlers
  const handleNavigateHome = () => {
    sound.stopContinuous();
    setActiveView('CATEGORIES');
    setSelectedCategory(null);
    setSelectedLevel(null);
    setScoreReport(null);
  };

  const handleSelectCategory = (catId: SimulatorCategoryId) => {
    setSelectedCategory(catId);
    setActiveView('LEVEL_SELECT');
  };

  const handleStartLevel = (level: LevelConfig) => {
    setSelectedLevel(level);
    setActiveView('PLAYING');
  };

  // Completion Handler
  const handleLevelComplete = (report: PerformanceReport) => {
    const prevResult = gameState.levelProgress[report.levelId] || {
      completed: false,
      stars: 0,
      score: 0,
      highScore: 0,
      bestTimeSeconds: 0,
      bestAccuracyPercent: 0,
      timesPlayed: 0
    };

    const isHighScore = report.totalScore > prevResult.highScore;
    const bestTime = prevResult.bestTimeSeconds === 0 ? report.timeElapsedSeconds : Math.min(prevResult.bestTimeSeconds, report.timeElapsedSeconds);
    const bestAcc = Math.max(prevResult.bestAccuracyPercent, report.accuracyPercent);
    const bestStars = Math.max(prevResult.stars, report.stars) as 1 | 2 | 3;

    // Check newly unlocked achievements
    const newlyUnlockedAchievements: string[] = [];
    const now = Date.now();
    const achievementsCopy = { ...gameState.achievements };

    // Scenario specific achievements
    if (report.categoryId === 'flight' && !achievementsCopy['first_flight']) {
      achievementsCopy['first_flight'] = now;
      newlyUnlockedAchievements.push('first_flight');
    }
    if (report.categoryId === 'driving' && !achievementsCopy['rookie_driver']) {
      achievementsCopy['rookie_driver'] = now;
      newlyUnlockedAchievements.push('rookie_driver');
    }
    if (report.categoryId === 'farming' && !achievementsCopy['first_harvest']) {
      achievementsCopy['first_harvest'] = now;
      newlyUnlockedAchievements.push('first_harvest');
    }
    if (report.categoryId === 'city' && !achievementsCopy['first_city']) {
      achievementsCopy['first_city'] = now;
      newlyUnlockedAchievements.push('first_city');
    }

    // 3-star ace
    if (report.stars === 3 && !achievementsCopy['three_star_ace']) {
      achievementsCopy['three_star_ace'] = now;
      newlyUnlockedAchievements.push('three_star_ace');
    }

    // High score master
    if (report.totalScore >= 8000 && !achievementsCopy['high_roller']) {
      achievementsCopy['high_roller'] = now;
      newlyUnlockedAchievements.push('high_roller');
    }

    const updatedState: GameState = {
      ...gameState,
      levelProgress: {
        ...gameState.levelProgress,
        [report.levelId]: {
          completed: true,
          stars: bestStars,
          score: report.totalScore,
          highScore: Math.max(prevResult.highScore, report.totalScore),
          bestTimeSeconds: bestTime,
          bestAccuracyPercent: bestAcc,
          timesPlayed: prevResult.timesPlayed + 1
        }
      },
      achievements: achievementsCopy
    };

    handleUpdateState(updatedState);

    // Submit score to global leaderboards
    submitScoreToLeaderboard(
      report.categoryId,
      report.levelId,
      gameState.profile.callsign,
      report.totalScore,
      report.accuracyPercent,
      report.timeElapsedSeconds
    );

    // Auto-sync in background if online
    syncToCloud(updatedState).catch(() => {});

    // Show score report modal
    setScoreReport(report);
  };

  const handleNextLevel = () => {
    if (!selectedCategory || !selectedLevel) return;

    const cat = SIMULATOR_CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat) return;

    const nextLvlNum = selectedLevel.levelNumber + 1;
    const nextLevel = cat.levels.find(l => l.levelNumber === nextLvlNum);

    setScoreReport(null);

    if (nextLevel) {
      setSelectedLevel(nextLevel);
      setActiveView('PLAYING');
    } else {
      // Completed all levels in category, go back to category selection
      setActiveView('CATEGORIES');
      setSelectedCategory(null);
      setSelectedLevel(null);
    }
  };

  const currentCategoryData = SIMULATOR_CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-amber-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Universal Top Bar */}
      <Header
        gameState={gameState}
        onUpdateState={handleUpdateState}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onNavigateHome={handleNavigateHome}
        activeCategoryName={currentCategoryData?.name}
        activeLevelTitle={selectedLevel?.title}
      />

      {/* Main Simulation Viewport */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {activeView === 'CATEGORIES' && (
          <CategorySelect
            gameState={gameState}
            onSelectCategory={handleSelectCategory}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />
        )}

        {activeView === 'LEVEL_SELECT' && selectedCategory && (
          <LevelSelect
            categoryId={selectedCategory}
            gameState={gameState}
            onBack={handleNavigateHome}
            onStartLevel={handleStartLevel}
          />
        )}

        {activeView === 'PLAYING' && selectedLevel && (
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 py-4 flex-1 flex flex-col justify-center">
            {selectedLevel.categoryId === 'flight' && (
              <FlightSimulator
                level={selectedLevel}
                onExit={() => {
                  sound.stopContinuous();
                  setActiveView('LEVEL_SELECT');
                }}
                onComplete={handleLevelComplete}
              />
            )}

            {selectedLevel.categoryId === 'driving' && (
              <DrivingSimulator
                level={selectedLevel}
                onExit={() => {
                  sound.stopContinuous();
                  setActiveView('LEVEL_SELECT');
                }}
                onComplete={handleLevelComplete}
              />
            )}

            {selectedLevel.categoryId === 'farming' && (
              <FarmingSimulator
                level={selectedLevel}
                onExit={() => {
                  sound.stopContinuous();
                  setActiveView('LEVEL_SELECT');
                }}
                onComplete={handleLevelComplete}
              />
            )}

            {selectedLevel.categoryId === 'city' && (
              <CityBuildingSimulator
                level={selectedLevel}
                onExit={() => {
                  sound.stopContinuous();
                  setActiveView('LEVEL_SELECT');
                }}
                onComplete={handleLevelComplete}
              />
            )}
          </div>
        )}
      </main>

      {/* Level Completion Score Modal */}
      {scoreReport && selectedLevel && (
        <ScoreModal
          report={scoreReport}
          levelConfig={selectedLevel}
          pilotName={gameState.profile.callsign}
          onNextLevel={handleNextLevel}
          onReplay={() => {
            setScoreReport(null);
            setActiveView('PLAYING');
          }}
          onOpenLeaderboard={() => {
            setScoreReport(null);
            setIsLeaderboardOpen(true);
          }}
          onClose={() => setScoreReport(null)}
        />
      )}

      {/* Global Leaderboards Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          gameState={gameState}
          defaultCategoryId={selectedCategory || 'flight'}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {/* Cloud Storage & Cross Device Sync Modal */}
      {isCloudSyncOpen && (
        <CloudSyncModal
          gameState={gameState}
          onUpdateState={handleUpdateState}
          onClose={() => setIsCloudSyncOpen(false)}
        />
      )}

      {/* Pilot Career Achievements Modal */}
      {isAchievementsOpen && (
        <AchievementsModal
          gameState={gameState}
          onClose={() => setIsAchievementsOpen(false)}
        />
      )}
    </div>
  );
}
