/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameState, LevelResult, SimulatorCategoryId } from '../types/simulator';
import { SIMULATOR_CATEGORIES } from './constants';

const STORAGE_KEY = 'simuverse_save_data_v2';

/**
 * Generate a random cool alphanumeric pilot ID and callsign
 */
function generateRandomCallsign(): string {
  const callsigns = ['Viper', 'Maverick', 'Falcon', 'TractorBoss', 'Skywalker', 'ApexDrifter', 'CivicArchitect', 'StratoPilot', 'Zenith', 'Turbine'];
  const prefix = callsigns[Math.floor(Math.random() * callsigns.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

function generateRandomPilotId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SIM-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create default initial state
 */
export function getInitialGameState(): GameState {
  const initialLevels: Record<string, LevelResult> = {};

  SIMULATOR_CATEGORIES.forEach(cat => {
    cat.levels.forEach(lvl => {
      initialLevels[lvl.id] = {
        completed: false,
        stars: 0,
        score: 0,
        highScore: 0,
        bestTimeSeconds: 0,
        bestAccuracyPercent: 0,
        timesPlayed: 0
      };
    });
  });

  const pilotId = generateRandomPilotId();
  const callsign = generateRandomCallsign();

  return {
    version: 2,
    profile: {
      pilotId,
      callsign,
      totalScore: 0,
      starsCount: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now()
    },
    levelProgress: initialLevels,
    achievements: {},
    cloudSyncToken: `CLOUD-${pilotId}-${Date.now().toString(36).toUpperCase()}`,
    lastSyncedAt: Date.now(),
    offlineQueueCount: 0,
    soundEnabled: true,
    musicEnabled: true
  };
}

/**
 * Load saved game state from localStorage
 */
export function loadGameState(): GameState {
  if (typeof window === 'undefined') {
    return getInitialGameState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialGameState();
      saveGameState(initial);
      return initial;
    }

    const parsed: GameState = JSON.parse(raw);

    // Ensure all current categories/levels exist in loaded save
    const defaultState = getInitialGameState();
    Object.keys(defaultState.levelProgress).forEach(lvlId => {
      if (!parsed.levelProgress[lvlId]) {
        parsed.levelProgress[lvlId] = defaultState.levelProgress[lvlId];
      }
    });

    if (!parsed.profile) parsed.profile = defaultState.profile;
    if (!parsed.achievements) parsed.achievements = {};
    if (!parsed.cloudSyncToken) parsed.cloudSyncToken = defaultState.cloudSyncToken;

    return parsed;
  } catch (err) {
    console.error('Error loading game state from localStorage:', err);
    return getInitialGameState();
  }
}

/**
 * Save game state to localStorage
 */
export function saveGameState(state: GameState): boolean {
  if (typeof window === 'undefined') return false;

  try {
    state.profile.lastActiveAt = Date.now();
    // Recalculate total score & stars
    let totalScore = 0;
    let totalStars = 0;
    Object.values(state.levelProgress).forEach(lvl => {
      totalScore += lvl.highScore || 0;
      totalStars += lvl.stars || 0;
    });
    state.profile.totalScore = totalScore;
    state.profile.starsCount = totalStars;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Error saving game state:', err);
    return false;
  }
}

/**
 * Helper to check if a specific level is unlocked
 */
export function isLevelUnlocked(state: GameState, categoryId: SimulatorCategoryId, levelNumber: number): boolean {
  // Level 1 is always unlocked
  if (levelNumber === 1) return true;

  // Previous level must be completed
  const prevLevelId = `${categoryId}_${levelNumber - 1}`;
  const prevProgress = state.levelProgress[prevLevelId];

  return Boolean(prevProgress && prevProgress.completed);
}

/**
 * Reset all progress back to factory default
 */
export function resetGameProgress(): GameState {
  const fresh = getInitialGameState();
  saveGameState(fresh);
  return fresh;
}
