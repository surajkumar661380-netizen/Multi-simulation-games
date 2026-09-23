/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Cloud, Wifi, WifiOff, Trophy, Award, User, RefreshCw, Crown } from 'lucide-react';
import { GameState } from '../types/simulator';
import { sound } from '../utils/audio';
import { isOnline, syncToCloud } from '../utils/cloudSync';
import { saveGameState } from '../utils/storage';

interface HeaderProps {
  gameState: GameState;
  onUpdateState: (newState: GameState) => void;
  onOpenAchievements: () => void;
  onOpenLeaderboard: () => void;
  onOpenCloudSync: () => void;
  onNavigateHome: () => void;
  activeCategoryName?: string;
  activeLevelTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  gameState,
  onUpdateState,
  onOpenAchievements,
  onOpenLeaderboard,
  onOpenCloudSync,
  onNavigateHome,
  activeCategoryName,
  activeLevelTitle
}) => {
  const [onlineStatus, setOnlineStatus] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isEditingCallsign, setIsEditingCallsign] = useState<boolean>(false);
  const [tempCallsign, setTempCallsign] = useState<string>(gameState.profile.callsign);

  useEffect(() => {
    setOnlineStatus(isOnline());

    const handleOnline = () => {
      setOnlineStatus(true);
      if (gameState.offlineQueueCount > 0) {
        setIsSyncing(true);
        syncToCloud(gameState).finally(() => setIsSyncing(false));
      }
    };

    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [gameState]);

  const toggleSound = () => {
    const next = !gameState.soundEnabled;
    sound.setEnabled(next);
    const updated: GameState = { ...gameState, soundEnabled: next };
    onUpdateState(updated);
    saveGameState(updated);
    if (next) sound.playClick();
  };

  const handleManualSync = async () => {
    sound.playClick();
    setIsSyncing(true);
    await syncToCloud(gameState);
    setIsSyncing(false);
    onOpenCloudSync();
  };

  const handleSaveCallsign = () => {
    const trimmed = tempCallsign.trim();
    if (trimmed) {
      const updated: GameState = {
        ...gameState,
        profile: {
          ...gameState.profile,
          callsign: trimmed
        }
      };
      onUpdateState(updated);
      saveGameState(updated);
      sound.playClick();
    }
    setIsEditingCallsign(false);
  };

  const unlockedAchievementsCount = Object.keys(gameState.achievements).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-black/95 backdrop-blur-md border-b border-amber-500/20 px-4 lg:px-8 py-3 transition-colors shadow-lg shadow-black">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark in Pure Gold and Black */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              onNavigateHome();
            }}
            className="text-xl font-bold tracking-tight text-white hover:text-amber-400 transition-colors flex items-center gap-2 text-left group"
          >
            <span className="p-1 rounded bg-amber-500/10 border border-amber-400/40 text-amber-400 group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400/30" />
            </span>
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-extrabold tracking-wide">
              SimuVerse
            </span>
          </button>

          {activeCategoryName && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-amber-200/60 border-l border-amber-500/30 pl-3">
              <span className="text-amber-300/80">{activeCategoryName}</span>
              {activeLevelTitle && (
                <>
                  <span aria-hidden="true" className="text-amber-600">·</span>
                  <span className="text-amber-100 font-medium truncate max-w-[200px]">{activeLevelTitle}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Zone 2: Navigation in Pure Gold */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-amber-200/70">
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboards</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAchievements();
            }}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Achievements</span>
            <span className="text-xs text-amber-500/70 font-mono">({unlockedAchievementsCount}/12)</span>
          </button>

          <button
            onClick={handleManualSync}
            className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
          >
            <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-pulse text-amber-400' : 'text-amber-500/70'}`} />
            <span>Cloud Sync</span>
          </button>
        </nav>

        {/* Zone 3: Pilot Profile, Connectivity, Sound & Sync Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Online/Offline Status Indicator */}
          <button
            onClick={onOpenCloudSync}
            title={onlineStatus ? 'Online · Cloud Connected' : 'Offline Mode Active · Cached Locally'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors hover:bg-neutral-900 border border-amber-500/30 bg-black"
          >
            {onlineStatus ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline text-amber-400 font-bold">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-yellow-600" />
                <span className="hidden xl:inline text-yellow-600 font-bold">OFFLINE</span>
              </>
            )}
          </button>

          {/* Pilot Profile & Callsign */}
          <div className="relative">
            {isEditingCallsign ? (
              <div className="flex items-center gap-1 bg-black border border-amber-500/60 rounded-md p-0.5">
                <input
                  type="text"
                  value={tempCallsign}
                  onChange={(e) => setTempCallsign(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCallsign();
                    if (e.key === 'Escape') setIsEditingCallsign(false);
                  }}
                  autoFocus
                  maxLength={16}
                  className="w-24 px-1.5 py-0.5 text-xs bg-transparent text-amber-300 focus:outline-none font-mono"
                />
                <button
                  onClick={handleSaveCallsign}
                  className="px-2 py-0.5 text-xs bg-amber-500 hover:bg-amber-400 text-black rounded font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  setTempCallsign(gameState.profile.callsign);
                  setIsEditingCallsign(true);
                }}
                title="Click to edit Pilot Callsign"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-amber-200 hover:text-amber-100 bg-neutral-950 hover:bg-neutral-900 border border-amber-500/30 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-medium truncate max-w-[100px]">{gameState.profile.callsign}</span>
                <span className="hidden lg:inline text-amber-400/80 font-mono">★{gameState.profile.starsCount}</span>
              </button>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={gameState.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2 rounded-md text-amber-400 hover:text-amber-200 bg-neutral-950 hover:bg-neutral-900 border border-amber-500/30 transition-colors"
            aria-label="Toggle Sound"
          >
            {gameState.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-amber-800" />
            )}
          </button>

          {/* Pure Golden Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Synchronize to Cloud"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 rounded-md transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-black ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
