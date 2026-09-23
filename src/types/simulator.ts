/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SimulatorCategoryId = 'flight' | 'driving' | 'farming' | 'city';

export type DifficultyLevel = 'Novice' | 'Standard' | 'Expert' | 'Master';

export interface LevelObjective {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  unit?: string;
}

export interface LevelConfig {
  id: string; // e.g. 'flight_1'
  categoryId: SimulatorCategoryId;
  levelNumber: number;
  title: string;
  subtitle: string;
  briefing: string;
  difficulty: DifficultyLevel;
  parTimeSeconds: number;
  baseScore: number;
  objectives: {
    id: string;
    description: string;
    target: number;
    unit?: string;
  }[];
  tips: string[];
}

export interface LevelResult {
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  score: number;
  highScore: number;
  bestTimeSeconds: number;
  bestAccuracyPercent: number;
  timesPlayed: number;
  completedAt?: number;
}

export interface CategoryInfo {
  id: SimulatorCategoryId;
  name: string;
  tagline: string;
  description: string;
  accentColor: string; // e.g. 'cyan'
  accentHex: string;
  levels: LevelConfig[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category?: SimulatorCategoryId | 'all';
  icon: string;
  points?: number;
  unlockedAt?: number;
}

export interface UserProfile {
  pilotId: string;
  callsign: string;
  totalScore: number;
  starsCount: number;
  createdAt: number;
  lastActiveAt: number;
}

export interface GameState {
  version: number;
  profile: UserProfile;
  levelProgress: Record<string, LevelResult>;
  achievements: Record<string, number>; // achievementId -> unlockedAt timestamp
  cloudSyncToken: string;
  lastSyncedAt: number;
  offlineQueueCount: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  pilotName: string;
  category: SimulatorCategoryId;
  levelId: string;
  score: number;
  accuracy: number;
  timeSeconds: number;
  date: string;
  isCurrentUser?: boolean;
}

export interface PerformanceReport {
  levelId: string;
  categoryId: SimulatorCategoryId;
  timeElapsedSeconds: number;
  accuracyPercent: number;
  tasksCompleted: number;
  totalTasks: number;
  rawScore: number;
  timeBonus: number;
  accuracyBonus: number;
  totalScore: number;
  stars: 1 | 2 | 3;
  newHighScore: boolean;
  unlockedNextLevel: boolean;
  unlockedAchievements: Achievement[];
}
