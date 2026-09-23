/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, Trophy, Clock, Target, Share2, ArrowRight, RotateCcw, Check, Twitter, MessageCircle } from 'lucide-react';
import { PerformanceReport, LevelConfig } from '../types/simulator';
import { SIMULATOR_CATEGORIES } from '../utils/constants';
import { shareChallenge } from '../utils/cloudSync';
import { sound } from '../utils/audio';

interface ScoreModalProps {
  report: PerformanceReport;
  levelConfig: LevelConfig;
  pilotName: string;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLeaderboard: () => void;
  onClose: () => void;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  report,
  levelConfig,
  pilotName,
  onNextLevel,
  onReplay,
  onOpenLeaderboard,
  onClose
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const category = SIMULATOR_CATEGORIES.find(c => c.id === report.categoryId);
  const categoryName = category ? category.name : 'Simulator';

  const handleShare = async () => {
    sound.playClick();
    const res = await shareChallenge({
      categoryName,
      levelTitle: levelConfig.title,
      score: report.totalScore,
      stars: report.stars,
      timeSeconds: report.timeElapsedSeconds,
      pilotName
    });

    if (res.shared) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const shareText = encodeURIComponent(
    `🏆 I scored ${report.totalScore.toLocaleString()} points (${report.stars}★) on "${levelConfig.title}" in SimuVerse ${categoryName}! Can you beat my time?`
  );
  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-950 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black space-y-6">
        {/* Header Title & Scenario */}
        <div className="text-center space-y-1">
          <span className="text-xs font-mono text-amber-400 font-bold tracking-wider uppercase">
            {categoryName} · SCENARIO 0{levelConfig.levelNumber}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Mission Accomplished!
          </h2>
          <p className="text-xs text-amber-200/60">{levelConfig.title}</p>
        </div>

        {/* 3 Pure Gold Stars Display */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="relative">
              <Star
                className={`w-11 h-11 transition-all duration-300 ${
                  s <= report.stars
                    ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_14px_rgba(251,191,36,0.8)]'
                    : 'text-neutral-800'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Primary Score & Bonus Breakdown in Pure Gold */}
        <div className="bg-black border border-amber-500/30 rounded-xl p-4 space-y-3 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <span className="text-amber-200/70">Total Performance Score</span>
            <span className="text-xl font-extrabold text-amber-400 tabular-nums drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
              {report.totalScore.toLocaleString()} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-amber-200/50">Base Score:</span>
              <span>{report.rawScore.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200/50">Time Bonus:</span>
              <span className="text-amber-400 font-bold">+{report.timeBonus.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200/50">Accuracy Bonus:</span>
              <span className="text-amber-400 font-bold">+{report.accuracyBonus.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200/50">Duration:</span>
              <span>{report.timeElapsedSeconds}s</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-amber-200/70">
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Precision Rating:</span>
            </div>
            <span className="font-bold text-amber-300">{report.accuracyPercent}%</span>
          </div>
        </div>

        {/* Social Share & Challenge Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-amber-200/60">
            <span>Challenge Friends & Social Share:</span>
            {copiedLink && <span className="text-amber-400 font-mono font-bold">Link copied to clipboard!</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-amber-200 bg-neutral-900 hover:bg-neutral-800 transition-colors border border-amber-500/30"
            >
              {copiedLink ? <Check className="w-4 h-4 text-amber-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
              <span>{copiedLink ? 'Copied Challenge' : 'Share Challenge'}</span>
            </button>

            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 transition-colors"
              title="Share on X (Twitter)"
            >
              <Twitter className="w-4 h-4" />
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/30 transition-colors"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onReplay();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-amber-200 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Replay</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-950 border border-amber-500/40 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              sound.playStart();
              onNextLevel();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold text-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
          >
            <span>Next Mission</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
