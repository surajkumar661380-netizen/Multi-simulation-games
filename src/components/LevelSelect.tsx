/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Lock, Play, Star, Clock, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { SimulatorCategoryId, GameState, LevelConfig } from '../types/simulator';
import { SIMULATOR_CATEGORIES } from '../utils/constants';
import { isLevelUnlocked } from '../utils/storage';
import { sound } from '../utils/audio';

interface LevelSelectProps {
  categoryId: SimulatorCategoryId;
  gameState: GameState;
  onBack: () => void;
  onStartLevel: (level: LevelConfig) => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  categoryId,
  gameState,
  onBack,
  onStartLevel
}) => {
  const category = SIMULATOR_CATEGORIES.find(c => c.id === categoryId);

  if (!category) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb / Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="flex items-center gap-2 text-sm text-amber-200 hover:text-white bg-neutral-950 border border-amber-500/30 hover:border-amber-400 px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Categories</span>
          </button>

          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                {category.name}
              </span>
            </h1>
            <p className="text-xs text-amber-200/60">{category.tagline} · Progressive Scenarios</p>
          </div>
        </div>

        <div className="text-xs text-amber-400 font-mono flex items-center gap-3">
          <span>Complete prior levels with ≥1★ to unlock next tier</span>
        </div>
      </div>

      {/* Levels Cards Grid - Pure Golden with Black */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {category.levels.map(level => {
          const unlocked = isLevelUnlocked(gameState, categoryId, level.levelNumber);
          const progress = gameState.levelProgress[level.id];
          const isCompleted = progress && progress.completed;
          const stars = progress ? progress.stars : 0;

          return (
            <div
              key={level.id}
              className={`relative rounded-2xl flex flex-col justify-between p-6 transition-all duration-200 border ${
                unlocked
                  ? 'bg-gradient-to-b from-neutral-950 to-black border-amber-500/30 hover:border-amber-400 shadow-2xl shadow-black hover:shadow-amber-500/10'
                  : 'bg-black/60 border-neutral-900 opacity-60'
              }`}
            >
              {/* Level Number & Difficulty */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-amber-400 font-bold tracking-wider">
                      SCENARIO 0{level.levelNumber}
                    </span>
                    <h2 className="text-lg font-bold text-white leading-snug">{level.title}</h2>
                    <p className="text-xs text-amber-200/60">{level.subtitle}</p>
                  </div>

                  {unlocked ? (
                    <span
                      className={`text-xs px-2.5 py-1 rounded font-bold ${
                        level.difficulty === 'Novice'
                          ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                          : level.difficulty === 'Standard'
                          ? 'bg-yellow-950/50 text-yellow-300 border border-yellow-500/40'
                          : 'bg-amber-900/60 text-amber-200 border border-amber-400/60'
                      }`}
                    >
                      {level.difficulty}
                    </span>
                  ) : (
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-600">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Briefing */}
                <p className="text-xs text-amber-100/70 leading-relaxed min-h-[48px]">
                  {level.briefing}
                </p>

                {/* Key Objectives */}
                <div className="space-y-2 pt-2 border-t border-amber-500/20">
                  <span className="text-xs text-amber-300 font-medium">Mission Objectives:</span>
                  <ul className="space-y-1.5 text-xs text-amber-100/80">
                    {level.objectives.map(obj => (
                      <li key={obj.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{obj.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Performance Stats If Played */}
                {unlocked && isCompleted && (
                  <div className="p-3 rounded-lg bg-black border border-amber-500/30 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-200/60">Personal Best:</span>
                      <span className="text-amber-400 font-bold">{progress.highScore.toLocaleString()} pts</span>
                    </div>

                    <div className="flex items-center justify-between text-amber-200/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                        <span>{progress.bestTimeSeconds}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-amber-500/70" />
                        <span>{progress.bestAccuracyPercent}% accuracy</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action / Status */}
              <div className="pt-6 mt-4 border-t border-amber-500/20 space-y-3">
                {/* Stars Indicator */}
                {unlocked && (
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3].map(starNum => (
                      <Star
                        key={starNum}
                        className={`w-5 h-5 ${
                          starNum <= stars
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                            : 'text-neutral-800'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Launch Button or Locked Notice */}
                {unlocked ? (
                  <button
                    onClick={() => {
                      sound.playStart();
                      onStartLevel(level);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-sm text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20"
                  >
                    <Play className="w-4 h-4 fill-current text-black" />
                    <span>{isCompleted ? 'Fly Again' : 'Initialize Mission'}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono text-amber-700 bg-neutral-950 border border-neutral-900">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Locked · Pass Level 0{level.levelNumber - 1}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
