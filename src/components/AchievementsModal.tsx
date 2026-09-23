/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award, CheckCircle2, Lock, Flame, Plane, Car, Sprout, Building2, Crown } from 'lucide-react';
import { GameState, SimulatorCategoryId } from '../types/simulator';
import { ACHIEVEMENTS } from '../utils/constants';
import { sound } from '../utils/audio';

interface AchievementsModalProps {
  gameState: GameState;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  gameState,
  onClose
}) => {
  const unlockedCount = Object.keys(gameState.achievements).length;
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const getCategoryIcon = (cat?: SimulatorCategoryId | 'all') => {
    switch (cat) {
      case 'flight':
        return <Plane className="w-3.5 h-3.5 text-amber-400" />;
      case 'driving':
        return <Car className="w-3.5 h-3.5 text-yellow-400" />;
      case 'farming':
        return <Sprout className="w-3.5 h-3.5 text-amber-300" />;
      case 'city':
        return <Building2 className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-950 border border-amber-500/40 rounded-2xl p-6 shadow-2xl shadow-black space-y-6 flex flex-col max-h-[90vh]">
        {/* Header in Pure Gold & Black */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  Simulator Pilot Achievements
                </span>
              </h2>
              <p className="text-xs text-amber-200/60">Career milestones, flight mastery, drift records, and civic feats</p>
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

        {/* Golden Progression Overview Bar */}
        <div className="p-4 rounded-xl bg-black border border-amber-500/30 space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-200/60">Total Unlocked ({unlockedCount} / {totalCount})</span>
            <span className="text-amber-400 font-mono font-extrabold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-900/30">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements Grid in Pure Gold & Black */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = Boolean(gameState.achievements[ach.id]);
            const unlockedAt = gameState.achievements[ach.id];

            return (
              <div
                key={ach.id}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-black border-amber-500/30 text-amber-100'
                    : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isUnlocked
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-500/40 shadow-sm'
                        : 'bg-neutral-900 text-neutral-700 border border-neutral-800'
                    }`}
                  >
                    {isUnlocked ? <CheckCircle2 className="w-5 h-5 text-amber-400" /> : <Lock className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ach.title}</span>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400/80 font-mono">
                        {getCategoryIcon(ach.category)}
                        <span className="uppercase">{ach.category || 'Career'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-amber-200/60">{ach.description}</p>
                    {isUnlocked && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold block">
                        Unlocked on {new Date(unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono text-xs text-amber-400 font-extrabold">
                  +{ach.points} XP
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 transition-colors font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
