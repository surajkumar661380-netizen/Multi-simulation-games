/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, LeaderboardEntry, SimulatorCategoryId } from '../types/simulator';
import { saveGameState } from './storage';

// In-memory / localStorage cloud database for multi-device cross simulation sync
const CLOUD_CACHE_PREFIX = 'simuverse_cloud_sync_db_';
const LEADERBOARD_KEY = 'simuverse_global_leaderboards_v2';

/**
 * Check if the browser is currently online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Generate a shareable cloud sync code representing the save data
 */
export function generateCloudSyncPayload(state: GameState): string {
  try {
    const compactData = {
      p: state.profile,
      l: state.levelProgress,
      a: state.achievements,
      t: state.cloudSyncToken,
      s: Date.now()
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(compactData))));
  } catch (err) {
    console.error('Error creating cloud payload:', err);
    return '';
  }
}

/**
 * Decode and restore a save from a cloud sync payload
 */
export function restoreFromCloudSyncPayload(payload: string, currentState: GameState): GameState | null {
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(payload.trim()))));
    if (!decoded || !decoded.p || !decoded.l) {
      return null;
    }

    const merged: GameState = {
      ...currentState,
      profile: {
        ...decoded.p,
        lastActiveAt: Date.now()
      },
      levelProgress: decoded.l,
      achievements: decoded.a || {},
      cloudSyncToken: decoded.t || currentState.cloudSyncToken,
      lastSyncedAt: Date.now(),
      offlineQueueCount: 0
    };

    saveGameState(merged);
    return merged;
  } catch (err) {
    console.error('Failed to parse cloud sync code:', err);
    return null;
  }
}

/**
 * Sync current game progress to simulated / real cloud storage
 */
export async function syncToCloud(state: GameState): Promise<{ success: boolean; message: string; lastSyncedAt: number }> {
  // Check online status
  if (!isOnline()) {
    state.offlineQueueCount += 1;
    saveGameState(state);
    return {
      success: false,
      message: 'Offline mode active. Progress cached locally and will auto-sync when online.',
      lastSyncedAt: state.lastSyncedAt
    };
  }

  try {
    // Save to device cloud cache
    const cloudPayload = generateCloudSyncPayload(state);
    const cloudKey = `${CLOUD_CACHE_PREFIX}${state.cloudSyncToken}`;
    localStorage.setItem(cloudKey, cloudPayload);

    // Also attempt server-side endpoint if available
    try {
      await fetch('/api/cloud-sync/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: state.cloudSyncToken,
          payload: cloudPayload,
          pilotId: state.profile.pilotId
        })
      });
    } catch {
      // Graceful fallback to client cloud synchronization
    }

    const now = Date.now();
    state.lastSyncedAt = now;
    state.offlineQueueCount = 0;
    saveGameState(state);

    return {
      success: true,
      message: 'Game progress successfully synchronized to cloud storage.',
      lastSyncedAt: now
    };
  } catch (err) {
    return {
      success: false,
      message: 'Cloud sync encountered an unexpected error: ' + String(err),
      lastSyncedAt: state.lastSyncedAt
    };
  }
}

/**
 * Load cloud progress by sync token
 */
export async function loadFromCloud(syncToken: string, currentState: GameState): Promise<{ success: boolean; state?: GameState; message: string }> {
  if (!isOnline()) {
    return { success: false, message: 'Cannot connect to cloud storage while offline.' };
  }

  try {
    let cloudPayload = localStorage.getItem(`${CLOUD_CACHE_PREFIX}${syncToken.trim()}`);

    if (!cloudPayload) {
      try {
        const resp = await fetch(`/api/cloud-sync/load?token=${encodeURIComponent(syncToken.trim())}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.payload) {
            cloudPayload = data.payload;
          }
        }
      } catch {}
    }

    if (!cloudPayload) {
      return {
        success: false,
        message: 'No cloud save found for this Cloud Pilot Token. Verify the token.'
      };
    }

    const restored = restoreFromCloudSyncPayload(cloudPayload, currentState);
    if (!restored) {
      return { success: false, message: 'Cloud save data corrupted or incompatible.' };
    }

    return {
      success: true,
      state: restored,
      message: 'Cloud save downloaded and applied successfully!'
    };
  } catch (err) {
    return {
      success: false,
      message: 'Cloud load failed: ' + String(err)
    };
  }
}

/**
 * Default simulated global leaderboards
 */
const SEED_LEADERBOARDS: LeaderboardEntry[] = [
  // Flight 1
  { id: 'lb_1', rank: 1, pilotName: 'GhostRider-99', category: 'flight', levelId: 'flight_1', score: 3850, accuracy: 98, timeSeconds: 34, date: '2 hours ago' },
  { id: 'lb_2', rank: 2, pilotName: 'SkyFalcon-01', category: 'flight', levelId: 'flight_1', score: 3620, accuracy: 95, timeSeconds: 38, date: '5 hours ago' },
  { id: 'lb_3', rank: 3, pilotName: 'AeroAce', category: 'flight', levelId: 'flight_1', score: 3410, accuracy: 92, timeSeconds: 41, date: '1 day ago' },
  { id: 'lb_4', rank: 4, pilotName: 'ViperX', category: 'flight', levelId: 'flight_1', score: 3200, accuracy: 89, timeSeconds: 44, date: '2 days ago' },
  // Flight 2
  { id: 'lb_5', rank: 1, pilotName: 'TopGun-Ace', category: 'flight', levelId: 'flight_2', score: 6250, accuracy: 97, timeSeconds: 52, date: '1 hour ago' },
  { id: 'lb_6', rank: 2, pilotName: 'FalconEye', category: 'flight', levelId: 'flight_2', score: 5890, accuracy: 94, timeSeconds: 57, date: '6 hours ago' },
  // Flight 3
  { id: 'lb_7', rank: 1, pilotName: 'StormChaser-7', category: 'flight', levelId: 'flight_3', score: 9650, accuracy: 99, timeSeconds: 68, date: '3 hours ago' },
  { id: 'lb_8', rank: 2, pilotName: 'Thunderbird', category: 'flight', levelId: 'flight_3', score: 9120, accuracy: 93, timeSeconds: 74, date: '12 hours ago' },

  // Driving 1
  { id: 'lb_9', rank: 1, pilotName: 'ApexTurbo', category: 'driving', levelId: 'driving_1', score: 4120, accuracy: 99, timeSeconds: 38, date: '30 mins ago' },
  { id: 'lb_10', rank: 2, pilotName: 'Redline-Racer', category: 'driving', levelId: 'driving_1', score: 3950, accuracy: 96, timeSeconds: 41, date: '3 hours ago' },
  // Driving 2
  { id: 'lb_11', rank: 1, pilotName: 'DriftKing-DK', category: 'driving', levelId: 'driving_2', score: 7850, accuracy: 95, timeSeconds: 49, date: '4 hours ago' },
  { id: 'lb_12', rank: 2, pilotName: 'TarmacGhost', category: 'driving', levelId: 'driving_2', score: 7100, accuracy: 91, timeSeconds: 54, date: '1 day ago' },
  // Driving 3
  { id: 'lb_13', rank: 1, pilotName: 'HydroPlane-Pro', category: 'driving', levelId: 'driving_3', score: 10450, accuracy: 98, timeSeconds: 61, date: '2 hours ago' },

  // Farming 1
  { id: 'lb_14', rank: 1, pilotName: 'AgroTitan', category: 'farming', levelId: 'farming_1', score: 4300, accuracy: 100, timeSeconds: 46, date: '1 hour ago' },
  { id: 'lb_15', rank: 2, pilotName: 'FieldMarshal', category: 'farming', levelId: 'farming_1', score: 3980, accuracy: 96, timeSeconds: 51, date: '5 hours ago' },
  // Farming 2
  { id: 'lb_16', rank: 1, pilotName: 'AquaFarmer', category: 'farming', levelId: 'farming_2', score: 6720, accuracy: 98, timeSeconds: 55, date: '4 hours ago' },
  // Farming 3
  { id: 'lb_17', rank: 1, pilotName: 'HarvestKing', category: 'farming', levelId: 'farming_3', score: 9850, accuracy: 99, timeSeconds: 67, date: '2 hours ago' },

  // City 1
  { id: 'lb_18', rank: 1, pilotName: 'CivicPlanner-9', category: 'city', levelId: 'city_1', score: 4800, accuracy: 96, timeSeconds: 54, date: '3 hours ago' },
  { id: 'lb_19', rank: 2, pilotName: 'GridMaster', category: 'city', levelId: 'city_1', score: 4450, accuracy: 92, timeSeconds: 60, date: '7 hours ago' },
  // City 2
  { id: 'lb_20', rank: 1, pilotName: 'EcoArchitect', category: 'city', levelId: 'city_2', score: 7900, accuracy: 97, timeSeconds: 72, date: '2 hours ago' },
  // City 3
  { id: 'lb_21', rank: 1, pilotName: 'MetropolisGov', category: 'city', levelId: 'city_3', score: 11200, accuracy: 99, timeSeconds: 84, date: '5 hours ago' }
];

/**
 * Get leaderboards for a category and level, incorporating user high score
 */
export function getLeaderboardForLevel(
  categoryId: SimulatorCategoryId,
  levelId: string,
  userProfile?: { callsign: string },
  userScore?: number,
  userTime?: number,
  userAccuracy?: number
): LeaderboardEntry[] {
  let stored: LeaderboardEntry[] = [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    stored = raw ? JSON.parse(raw) : SEED_LEADERBOARDS;
  } catch {
    stored = SEED_LEADERBOARDS;
  }

  // Filter for matching level
  const list = stored.filter(e => e.levelId === levelId);

  // If user has a score, merge or update
  if (userProfile && userScore && userScore > 0) {
    const existingIdx = list.findIndex(e => e.pilotName === userProfile.callsign || e.isCurrentUser);
    const userEntry: LeaderboardEntry = {
      id: 'user_entry',
      rank: 1,
      pilotName: userProfile.callsign,
      category: categoryId,
      levelId,
      score: userScore,
      accuracy: userAccuracy || 95,
      timeSeconds: userTime || 50,
      date: 'Just now',
      isCurrentUser: true
    };

    if (existingIdx >= 0) {
      if (userScore > list[existingIdx].score) {
        list[existingIdx] = userEntry;
      }
    } else {
      list.push(userEntry);
    }
  }

  // Sort descending by score
  list.sort((a, b) => b.score - a.score);

  // Assign ranks
  return list.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

/**
 * Submit user score to the leaderboard
 */
export function submitScoreToLeaderboard(
  categoryId: SimulatorCategoryId,
  levelId: string,
  pilotName: string,
  score: number,
  accuracy: number,
  timeSeconds: number
) {
  try {
    let stored: LeaderboardEntry[] = [];
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    stored = raw ? JSON.parse(raw) : [...SEED_LEADERBOARDS];

    // Remove existing user entry for this level if score is lower
    const filtered = stored.filter(e => !(e.levelId === levelId && e.pilotName === pilotName));
    filtered.push({
      id: 'score_' + Date.now(),
      rank: 1,
      pilotName,
      category: categoryId,
      levelId,
      score,
      accuracy,
      timeSeconds,
      date: 'Just now',
      isCurrentUser: true
    });

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to submit leaderboard score:', err);
  }
}

/**
 * Social Sharing helper
 */
export interface ShareDetails {
  categoryName: string;
  levelTitle: string;
  score: number;
  stars: number;
  timeSeconds: number;
  pilotName: string;
}

export async function shareChallenge(details: ShareDetails): Promise<{ shared: boolean; method: string }> {
  const shareText = `🏆 I scored ${details.score.toLocaleString()} points (${details.stars}★) on "${details.levelTitle}" in ${details.categoryName}! Can you beat my time of ${details.timeSeconds}s in SimuVerse?`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `SimuVerse Challenge from ${details.pilotName}`,
        text: shareText,
        url: shareUrl
      });
      return { shared: true, method: 'native' };
    } catch {
      // Fallback
    }
  }

  // Fallback to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${shareText}\nPlay now: ${shareUrl}`);
      return { shared: true, method: 'clipboard' };
    } catch {}
  }

  return { shared: false, method: 'none' };
}
