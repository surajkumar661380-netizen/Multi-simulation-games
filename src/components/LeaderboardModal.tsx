/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trophy, Medal, Clock, Target, Share2, Filter, Globe, Crown } from 'lucide-react';
import { SimulatorCategoryId, GameState } from '../types/simulator';
import { SIMULATOR_CATEGORIES } from '../utils/constants';
import { getLeaderboardForLevel, shareChallenge } from '../utils/cloudSync';
import { sound } from '../utils/audio';

interface LeaderboardModalProps {
  gameState: GameState;
  onClose: () => void;
  defaultCategoryId?: SimulatorCategoryId;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  gameState,
  onClose,
  defaultCategoryId = 'flight'
}) => {
  const [activeCategory, setActiveCategory] = useState<SimulatorCategoryId>(defaultCategoryId);
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(1);
  const [shareStatus, setShareStatus] = useState<string>('');

  const currentLevelId = `${activeCategory}_${activeLevelNumber}`;
  const userProgress = gameState.levelProgress[currentLevelId];

  const category = SIMULATOR_CATEGORIES.find(c => c.id === activeCategory);
  const levelConfig = category?.levels.find(l => l.levelNumber === activeLevelNumber);

  const leaderboardEntries = getLeaderboardForLevel(
    activeCategory,
    currentLevelId,
    gameState.profile,
    userProgress?.highScore,
    userProgress?.bestTimeSeconds,
    userProgress?.bestAccuracyPercent
  );

  const handleShareTopScore = async () => {
    sound.playClick();
    if (!userProgress || !userProgress.completed) {
      setShareStatus('Complete this level first to share your score!');
      setTimeout(() => setShareStatus(''), 3000);
      return;
    }

    const res = await shareChallenge({
      categoryName: category?.name || 'SimuVerse',
      levelTitle: levelConfig?.title || 'Scenario',
      score: userProgress.highScore,
      stars: userProgress.stars,
      timeSeconds: userProgress.bestTimeSeconds,
      pilotName: gameState.profile.callsign
    });

    if (res.shared) {
      setShareStatus('Challenge link copied to clipboard!');
      setTimeout(() => setShareStatus(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl shadow-black space-y-6 flex flex-col max-h-[90vh]">
        {/* Modal Top Header in Gold & Black */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-400/30">
              <Crown className="w-6 h-6 text-amber-400 fill-amber-400/20" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Global Pilot Leaderboards
                </span>
              </h2>
              <p className="text-xs text-amber-200/60">Verified simulator rankings across all categories and scenarios</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-amber-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-amber-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black rounded-xl border border-amber-500/30 overflow-x-auto">
          {SIMULATOR_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setActiveCategory(cat.id);
                setActiveLevelNumber(1);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black shadow-md'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Level Selector Buttons */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(lvlNum => (
              <button
                key={lvlNum}
                onClick={() => {
                  sound.playClick();
                  setActiveLevelNumber(lvlNum);
                }}
                className={`py-1 px-3 rounded-md font-mono transition-colors ${
                  activeLevelNumber === lvlNum
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-400 font-bold'
                    : 'text-amber-200/60 hover:text-white bg-black border border-amber-900/40'
                }`}
              >
                Level 0{lvlNum}
              </button>
            ))}
          </div>

          <button
            onClick={handleShareTopScore}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-bold"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Challenge Friends</span>
          </button>
        </div>

        {shareStatus && (
          <div className="p-2 text-xs font-mono text-center text-amber-300 bg-amber-950/40 border border-amber-500/40 rounded-lg">
            {shareStatus}
          </div>
        )}

        {/* Rankings Table in Pure Gold & Black */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {leaderboardEntries.map((entry, index) => {
            const isUser = entry.isCurrentUser;
            return (
              <div
                key={entry.id || index}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all ${
                  isUser
                    ? 'bg-amber-950/30 border-amber-400/80 text-amber-100 ring-1 ring-amber-400/50'
                    : 'bg-black border-amber-500/20 text-amber-100/90'
                }`}
              >
                {/* Rank & Pilot Name */}
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center font-bold">
                    {entry.rank === 1 ? (
                      <span className="text-amber-400 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">🥇</span>
                    ) : entry.rank === 2 ? (
                      <span className="text-amber-200 text-sm">🥈</span>
                    ) : entry.rank === 3 ? (
                      <span className="text-amber-600 text-sm">🥉</span>
                    ) : (
                      <span className="text-amber-500/60">#{entry.rank}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{entry.pilotName}</span>
                      {isUser && (
                        <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-sans font-extrabold text-[10px] rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-500/60">{entry.date}</span>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="flex items-center gap-5 text-right">
                  <div className="hidden sm:block text-amber-200/60">
                    <span className="text-amber-500/60 text-[10px] block">TIME</span>
                    <span>{entry.timeSeconds}s</span>
                  </div>

                  <div className="hidden sm:block text-amber-200/60">
                    <span className="text-amber-500/60 text-[10px] block">PRECISION</span>
                    <span>{entry.accuracy}%</span>
                  </div>

                  <div>
                    <span className="text-amber-500/60 text-[10px] block">SCORE</span>
                    <span className="text-amber-400 font-extrabold text-sm tabular-nums">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-200/60">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Real-time global synchronization active</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 transition-colors font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
