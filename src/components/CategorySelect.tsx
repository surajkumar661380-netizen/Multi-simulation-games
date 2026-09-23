/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plane, Car, Sprout, Building2, ChevronRight, Star, Trophy, ShieldCheck, Flame, Compass, Sparkles } from 'lucide-react';
import { SimulatorCategoryId, GameState } from '../types/simulator';
import { SIMULATOR_CATEGORIES } from '../utils/constants';
import { sound } from '../utils/audio';

interface CategorySelectProps {
  gameState: GameState;
  onSelectCategory: (categoryId: SimulatorCategoryId) => void;
  onOpenAchievements: () => void;
  onOpenLeaderboard: () => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  gameState,
  onSelectCategory,
  onOpenAchievements,
  onOpenLeaderboard
}) => {
  const getCategoryIcon = (id: SimulatorCategoryId) => {
    switch (id) {
      case 'flight':
        return <Plane className="w-8 h-8 text-amber-400" />;
      case 'driving':
        return <Car className="w-8 h-8 text-yellow-400" />;
      case 'farming':
        return <Sprout className="w-8 h-8 text-amber-300" />;
      case 'city':
        return <Building2 className="w-8 h-8 text-amber-500" />;
    }
  };

  const getCategoryStats = (categoryId: SimulatorCategoryId) => {
    let starsEarned = 0;
    let completedLevels = 0;
    let categoryScore = 0;

    const cat = SIMULATOR_CATEGORIES.find(c => c.id === categoryId);
    if (cat) {
      cat.levels.forEach(lvl => {
        const prog = gameState.levelProgress[lvl.id];
        if (prog) {
          starsEarned += prog.stars || 0;
          if (prog.completed) completedLevels += 1;
          categoryScore += prog.highScore || 0;
        }
      });
    }

    const totalLevels = cat ? cat.levels.length : 3;
    const totalPossibleStars = totalLevels * 3;

    return {
      starsEarned,
      totalPossibleStars,
      completedLevels,
      totalLevels,
      categoryScore
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
      {/* Hero Simulation Hub Header - Pure Golden with Black */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-950 via-black to-black border border-amber-500/30 p-6 md:p-10 shadow-2xl shadow-black">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <span className="text-amber-300 font-bold">PILOT ID: {gameState.profile.pilotId}</span>
            <span aria-hidden="true" className="text-amber-700">·</span>
            <span className="text-amber-200">CALLSIGN: {gameState.profile.callsign}</span>
            <span aria-hidden="true" className="text-amber-700">·</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              GOLD TIER SYSTEM READY
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            High-Fidelity Multi-Genre{' '}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Simulator Studio
            </span>
          </h1>

          <p className="text-amber-100/70 text-sm sm:text-base leading-relaxed">
            Step into real physical simulations across four distinct disciplines: master aeronautical glide slopes, drift hairpins with tire slip dynamics, cultivate agricultural yields, and construct thriving metropolitan grids.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-amber-200/70">
            <div className="flex items-center gap-1.5 font-mono">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-amber-300 font-bold">{gameState.profile.starsCount}</span>
              <span>/ 36 Stars</span>
            </div>
            <span aria-hidden="true" className="text-amber-800">·</span>
            <div className="flex items-center gap-1.5 font-mono">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-bold">{gameState.profile.totalScore.toLocaleString()}</span>
              <span>Career Pts</span>
            </div>
            <span aria-hidden="true" className="text-amber-800">·</span>
            <div className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Offline & Cloud Active</span>
            </div>
          </div>
        </div>

        {/* Ambient Gold Atmospheric Glows */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Category Selection Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-amber-400">✦</span>
              <span>Select Simulator Category</span>
            </h2>
            <p className="text-xs text-amber-200/60">Each domain features 3 progressive levels with authentic flight, vehicle, agronomy, and urban mechanics.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="text-xs text-amber-300 hover:text-amber-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Global Rankings</span>
            </button>
            <span className="text-amber-800">|</span>
            <button
              onClick={() => {
                sound.playClick();
                onOpenAchievements();
              }}
              className="text-xs text-amber-300 hover:text-amber-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Badges</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SIMULATOR_CATEGORIES.map(cat => {
            const stats = getCategoryStats(cat.id);

            return (
              <div
                key={cat.id}
                onClick={() => {
                  sound.playStart();
                  onSelectCategory(cat.id);
                }}
                className="group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-b from-neutral-950 to-black hover:from-neutral-900 hover:to-black border border-amber-500/25 hover:border-amber-400 transition-all duration-200 p-6 flex flex-col justify-between shadow-xl shadow-black hover:shadow-amber-500/10 hover:-translate-y-0.5"
              >
                <div className="space-y-4">
                  {/* Top Category Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-lg bg-black border border-amber-500/30 group-hover:border-amber-400 group-hover:scale-105 transition-all shadow-inner">
                        {getCategoryIcon(cat.id)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-amber-200/60">{cat.tagline}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs text-amber-400 bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold">{stats.starsEarned} / {stats.totalPossibleStars}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-amber-100/70 leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Golden Level Progression Indicator Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-amber-200/70">
                      <span>Progression ({stats.completedLevels}/{stats.totalLevels} unlocked)</span>
                      <span className="font-mono text-amber-400 font-bold">{Math.round((stats.completedLevels / stats.totalLevels) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-amber-900/40">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        style={{ width: `${(stats.completedLevels / stats.totalLevels) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-5 mt-4 border-t border-amber-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-200/60 font-mono">
                    <span>High Score:</span>
                    <span className="text-amber-300 font-bold">{stats.categoryScore.toLocaleString()} pts</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all font-bold">
                    <span>Enter Cockpit</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Simulator Quick Features Section in Golden & Black */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-amber-500/20 text-xs text-amber-200/60">
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-amber-500/20 space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Progressive Level Unlocks</span>
          </div>
          <p>Complete prerequisite scenarios with passing scores to unlock advanced storm landings, mountain drifts, and megalopolis crisis levels.</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950/80 border border-amber-500/20 space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Cross-Device Cloud Sync & Offline</span>
          </div>
          <p>Seamlessly play offline anywhere with zero connection drops. Progress caches locally and auto-syncs when online.</p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950/80 border border-amber-500/20 space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboards & Friend Challenges</span>
          </div>
          <p>Climb global pilot rankings, earn 12 unique achievement badges, and share direct challenge links with your friends.</p>
        </div>
      </section>
    </div>
  );
};
