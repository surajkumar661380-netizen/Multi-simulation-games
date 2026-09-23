/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, AlertTriangle, Flame, ShieldAlert, Flag, Award } from 'lucide-react';
import { LevelConfig, PerformanceReport } from '../../types/simulator';
import { sound } from '../../utils/audio';

interface DrivingSimulatorProps {
  level: LevelConfig;
  onExit: () => void;
  onComplete: (report: PerformanceReport) => void;
}

interface TrackCheckpoint {
  x: number;
  y: number;
  radius: number;
  cleared: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'cone' | 'puddle' | 'traffic';
  vx?: number;
}

export const DrivingSimulator: React.FC<DrivingSimulatorProps> = ({
  level,
  onExit,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dashboard HUD State
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [rpm, setRpm] = useState<number>(1000);
  const [gear, setGear] = useState<number>(1);
  const [driftPoints, setDriftPoints] = useState<number>(0);
  const [driftMultiplier, setDriftMultiplier] = useState<number>(1);
  const [isDrifting, setIsDrifting] = useState<boolean>(false);
  const [checkpointsCleared, setCheckpointsCleared] = useState<number>(0);
  const [conesHit, setConesHit] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [crashed, setCrashed] = useState<boolean>(false);

  // Mutable vehicle simulation state
  const simState = useRef({
    x: 400,
    y: 600,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    angularVelocity: 0,
    speed: 0,
    maxSpeed: level.levelNumber === 1 ? 120 : level.levelNumber === 2 ? 140 : 160,
    acceleration: 300,
    driftScore: 0,
    multiplier: 1,
    driftTimer: 0,
    checkpoints: [] as TrackCheckpoint[],
    obstacles: [] as Obstacle[],
    startTime: Date.now(),
    lastTime: Date.now(),
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
      handbrake: false
    },
    lapTime: 0,
    penaltyCount: 0,
    trafficOvertakes: 0
  });

  // Setup Track, Checkpoints, and Obstacles
  useEffect(() => {
    const state = simState.current;
    state.startTime = Date.now();
    state.lastTime = Date.now();

    state.checkpoints = [
      { x: 400, y: 350, radius: 60, cleared: false },
      { x: 450, y: 180, radius: 60, cleared: false },
      { x: 800, y: 180, radius: 60, cleared: false },
      { x: 1000, y: 350, radius: 60, cleared: false },
      { x: 850, y: 550, radius: 60, cleared: false },
      { x: 400, y: 580, radius: 60, cleared: false }
    ];

    const obs: Obstacle[] = [];
    if (level.levelNumber === 1) {
      obs.push({ x: 500, y: 180, radius: 15, type: 'cone' });
      obs.push({ x: 650, y: 180, radius: 15, type: 'cone' });
      obs.push({ x: 800, y: 180, radius: 15, type: 'cone' });
      obs.push({ x: 920, y: 400, radius: 15, type: 'cone' });
      obs.push({ x: 650, y: 550, radius: 15, type: 'cone' });
    } else if (level.levelNumber === 3) {
      obs.push({ x: 600, y: 180, radius: 35, type: 'puddle' });
      obs.push({ x: 950, y: 300, radius: 35, type: 'puddle' });
      obs.push({ x: 650, y: 560, radius: 35, type: 'puddle' });
      obs.push({ x: 550, y: 180, radius: 25, type: 'traffic', vx: 40 });
      obs.push({ x: 900, y: 400, radius: 25, type: 'traffic', vx: -30 });
      obs.push({ x: 700, y: 560, radius: 25, type: 'traffic', vx: 50 });
    }
    state.obstacles = obs;
  }, [level]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = simState.current.keys;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          k.up = true;
          break;
        case 's':
        case 'arrowdown':
          k.down = true;
          break;
        case 'a':
        case 'arrowleft':
          k.left = true;
          break;
        case 'd':
        case 'arrowright':
          k.right = true;
          break;
        case ' ':
          k.handbrake = true;
          sound.playTireSkid();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = simState.current.keys;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          k.up = false;
          break;
        case 's':
        case 'arrowdown':
          k.down = false;
          break;
        case 'a':
        case 'arrowleft':
          k.left = false;
          break;
        case 'd':
        case 'arrowright':
          k.right = false;
          break;
        case ' ':
          k.handbrake = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Vehicle Physics & Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      const dt = Math.min((now - simState.current.lastTime) / 1000, 0.1);
      simState.current.lastTime = now;

      const state = simState.current;
      const k = state.keys;

      if (!isPaused && !crashed) {
        let steerDir = 0;
        if (k.left) steerDir -= 1;
        if (k.right) steerDir += 1;

        const steerSpeed = (state.speed / state.maxSpeed) * 2.8;
        state.angle += steerDir * steerSpeed * dt;

        if (k.up) {
          state.speed = Math.min(state.maxSpeed, state.speed + state.acceleration * dt);
        } else if (k.down) {
          state.speed = Math.max(-40, state.speed - state.acceleration * 1.5 * dt);
        } else {
          state.speed *= 0.985;
        }

        const isHandbraking = k.handbrake;
        const slip = isHandbraking ? 0.88 : 0.96;

        const forwardX = Math.cos(state.angle);
        const forwardY = Math.sin(state.angle);

        state.vx = state.vx * slip + forwardX * state.speed * (1 - slip);
        state.vy = state.vy * slip + forwardY * state.speed * (1 - slip);

        state.x += state.vx * dt;
        state.y += state.vy * dt;

        const actualMoveAngle = Math.atan2(state.vy, state.vx);
        const angleDiff = Math.abs(state.angle - actualMoveAngle);
        const isDriftingNow = Math.abs(state.speed) > 45 && (isHandbraking || angleDiff > 0.4);

        setIsDrifting(isDriftingNow);

        if (isDriftingNow) {
          state.driftScore += Math.round(state.speed * state.multiplier * dt * 10);
          state.driftTimer += dt;
          if (state.driftTimer > 2) {
            state.multiplier = Math.min(4, state.multiplier + 1);
            state.driftTimer = 0;
          }
          setDriftPoints(state.driftScore);
          setDriftMultiplier(state.multiplier);
          if (Math.random() < 0.2) sound.playTireSkid();
        } else {
          state.multiplier = 1;
          state.driftTimer = 0;
        }

        sound.updateEngineSound(Math.abs(state.speed) / state.maxSpeed, 0.09);

        state.checkpoints.forEach((cp) => {
          if (!cp.cleared) {
            const dx = state.x - cp.x;
            const dy = state.y - cp.y;
            if (Math.sqrt(dx * dx + dy * dy) < cp.radius) {
              cp.cleared = true;
              sound.playObjectiveComplete();
              setCheckpointsCleared((prev) => prev + 1);
            }
          }
        });

        state.obstacles.forEach((obs) => {
          const dx = state.x - obs.x;
          const dy = state.y - obs.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < obs.radius + 15) {
            if (obs.type === 'cone') {
              state.penaltyCount += 1;
              setConesHit((prev) => prev + 1);
              state.speed *= 0.8;
              obs.x = -999;
              sound.playFailure();
            } else if (obs.type === 'puddle') {
              state.angle += (Math.random() - 0.5) * 0.8;
              sound.playTireSkid();
            } else if (obs.type === 'traffic') {
              setCrashed(true);
              sound.playFailure();
            }
          }
        });

        const currentMph = Math.round(Math.abs(state.speed));
        setSpeedMph(currentMph);
        const currentRpm = 1000 + Math.round((currentMph % 30) * 200 + (currentMph / 160) * 3000);
        setRpm(currentRpm);
        const currentGear = Math.min(6, Math.max(1, Math.ceil(currentMph / 25)));
        setGear(currentGear);

        const allCheckpoints = state.checkpoints.every((cp) => cp.cleared);
        if (allCheckpoints) {
          if (level.levelNumber === 2 && state.driftScore < 5000) {
            // Need more drift points
          } else {
            finishDrivingScenario(true);
            return;
          }
        }
      }

      // RENDER TRACK CANVAS IN PURE GOLD & BLACK
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Black Void / Dark Arena
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      // Asphalt Racing Circuit
      ctx.strokeStyle = '#171717';
      ctx.lineWidth = 140;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(400, 600);
      ctx.lineTo(400, 350);
      ctx.arcTo(400, 180, 800, 180, 140);
      ctx.lineTo(800, 180);
      ctx.arcTo(1000, 180, 1000, 350, 140);
      ctx.lineTo(1000, 350);
      ctx.arcTo(1000, 550, 850, 550, 140);
      ctx.lineTo(850, 550);
      ctx.arcTo(400, 600, 400, 350, 140);
      ctx.stroke();

      // Pure Golden Track Borders
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pure Golden Dashed Centerline
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Checkpoint Arcs in Pure Gold
      state.checkpoints.forEach((cp, idx) => {
        ctx.strokeStyle = cp.cleared ? 'rgba(234, 179, 8, 0.3)' : '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = cp.cleared ? 2 : 10;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, cp.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = cp.cleared ? '#fef08a' : '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`GATE 0${idx + 1}`, cp.x - 22, cp.y);
      });

      // Draw Obstacles
      state.obstacles.forEach((obs) => {
        if (obs.type === 'cone') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, obs.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'puddle') {
          ctx.fillStyle = 'rgba(217, 119, 6, 0.4)';
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y, obs.radius * 1.4, obs.radius, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'traffic') {
          ctx.save();
          ctx.translate(obs.x, obs.y);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-18, -10, 36, 20);
          ctx.fillStyle = '#000000';
          ctx.fillRect(-8, -8, 16, 16);
          ctx.restore();
        }
      });

      // Draw Player Sports Car in Pure Gold & Black
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.angle);

      // Gold flame/smoke if drifting
      if (isDrifting) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.beginPath();
        ctx.arc(-22, -12, 10 + Math.random() * 6, 0, Math.PI * 2);
        ctx.arc(-22, 12, 10 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden Car Body
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(-24, -13, 48, 26, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Black Racing Stripe
      ctx.fillStyle = '#000000';
      ctx.fillRect(-24, -4, 48, 8);

      // Black Glass Cockpit
      ctx.fillStyle = '#171717';
      ctx.beginPath();
      ctx.roundRect(-8, -9, 22, 18, 3);
      ctx.fill();

      // Golden Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(20, -11, 4, 6);
      ctx.fillRect(20, 5, 4, 6);

      // Red Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-24, -11, 3, 5);
      ctx.fillRect(-24, 6, 3, 5);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      sound.stopContinuous();
    };
  }, [isPaused, crashed, isDrifting]);

  const finishDrivingScenario = (success: boolean) => {
    sound.stopContinuous();
    const state = simState.current;
    const timeElapsed = Math.floor((Date.now() - state.startTime) / 1000);

    const timeDiff = level.parTimeSeconds - timeElapsed;
    const timeBonus = Math.max(0, timeDiff * 35);
    const accuracy = Math.max(20, 100 - state.penaltyCount * 15);
    const accuracyBonus = Math.round((accuracy / 100) * 1000);

    const total = level.baseScore + timeBonus + accuracyBonus + Math.round(state.driftScore * 0.4);

    let stars: 1 | 2 | 3 = 1;
    if (accuracy >= 85 && timeElapsed <= level.parTimeSeconds) {
      stars = 3;
    } else if (accuracy >= 65) {
      stars = 2;
    }

    sound.playVictoryFanfare(stars);

    onComplete({
      levelId: level.id,
      categoryId: level.categoryId,
      timeElapsedSeconds: timeElapsed,
      accuracyPercent: accuracy,
      tasksCompleted: state.checkpoints.length,
      totalTasks: state.checkpoints.length,
      rawScore: level.baseScore,
      timeBonus,
      accuracyBonus,
      totalScore: total,
      stars,
      newHighScore: true,
      unlockedNextLevel: true,
      unlockedAchievements: []
    });
  };

  const handleRestart = () => {
    sound.playClick();
    setCrashed(false);
    setIsPaused(false);
    const s = simState.current;
    s.x = 400;
    s.y = 600;
    s.vx = 0;
    s.vy = 0;
    s.speed = 0;
    s.angle = -Math.PI / 2;
    s.driftScore = 0;
    s.penaltyCount = 0;
    s.startTime = Date.now();
    s.checkpoints.forEach((cp) => (cp.cleared = false));
    setCheckpointsCleared(0);
    setConesHit(0);
    setDriftPoints(0);
  };

  return (
    <div className="relative w-full h-[88vh] max-h-[900px] flex flex-col bg-black rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-black select-none">
      {/* Top Banner in Pure Gold & Black */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/95 border-b border-amber-500/20 text-xs text-amber-200/80 font-mono z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              sound.stopContinuous();
              onExit();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 transition-colors font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Pits</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-amber-400 font-bold">{level.title}</span>
            <span aria-hidden="true" className="text-amber-700">·</span>
            <span className="text-amber-200/60">Scenario 0{level.levelNumber}</span>
          </div>
        </div>

        {/* Dashboard Gauges in Pure Gold */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-amber-500/60">SPEED:</span>
            <span className="font-extrabold text-amber-300 text-sm tabular-nums">{speedMph}</span>
            <span className="text-amber-500/60 text-[10px]">MPH</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-amber-500/60">GEAR:</span>
            <span className="font-extrabold text-amber-400 text-sm">{gear}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-500/60">DRIFT:</span>
            <span className="font-extrabold text-amber-400 text-sm tabular-nums">{driftPoints}</span>
            {driftMultiplier > 1 && (
              <span className="text-yellow-300 font-extrabold text-[10px] drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">{driftMultiplier}x</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-400"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleRestart}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track View */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover"
        />

        {/* Drift Combo Active Badge in Pure Gold */}
        {isDrifting && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-sm px-4 py-1.5 rounded-lg shadow-xl shadow-amber-500/30 animate-bounce">
            <Flame className="w-4 h-4 fill-current text-black" />
            <span>DRIFT MULTIPLIER {driftMultiplier}X</span>
          </div>
        )}

        {/* Crash Overlay */}
        {crashed && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">VEHICLE TOTALED</h3>
            <p className="text-sm text-amber-200/70 max-w-md">
              High speed collision with track barriers or traffic. Keep control through the apex.
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold rounded-xl text-sm transition-all"
            >
              Restart Lap
            </button>
          </div>
        )}
      </div>

      {/* Bottom Driver Pedals & Touch Controls in Pure Gold & Black */}
      <div className="bg-black border-t border-amber-500/20 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs z-20">
        {/* Tachometer RPM Bar */}
        <div className="flex flex-col gap-1.5 bg-neutral-950 p-2.5 rounded-xl border border-amber-500/20 font-mono">
          <div className="flex items-center justify-between text-amber-200/60">
            <span>TACHOMETER</span>
            <span className="text-amber-400 font-bold">{rpm} RPM</span>
          </div>
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-amber-900/30">
            <div
              className={`h-full transition-all duration-75 ${
                rpm > 6500 ? 'bg-amber-300 shadow-[0_0_8px_#fef08a]' : 'bg-gradient-to-r from-amber-600 to-yellow-400'
              }`}
              style={{ width: `${Math.min(100, (rpm / 8000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Steering Buttons */}
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-amber-500/20">
          <button
            onMouseDown={() => { simState.current.keys.left = true; }}
            onMouseUp={() => { simState.current.keys.left = false; }}
            onTouchStart={() => { simState.current.keys.left = true; }}
            onTouchEnd={() => { simState.current.keys.left = false; }}
            className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-black text-amber-200 border border-amber-500/30 font-bold rounded-lg text-center"
          >
            ◄ STEER
          </button>
          <button
            onMouseDown={() => { simState.current.keys.right = true; }}
            onMouseUp={() => { simState.current.keys.right = false; }}
            onTouchStart={() => { simState.current.keys.right = true; }}
            onTouchEnd={() => { simState.current.keys.right = false; }}
            className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-400 active:text-black text-amber-200 border border-amber-500/30 font-bold rounded-lg text-center"
          >
            STEER ►
          </button>
        </div>

        {/* Throttle & Brake Pedals */}
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-amber-500/20">
          <button
            onMouseDown={() => { simState.current.keys.down = true; }}
            onMouseUp={() => { simState.current.keys.down = false; }}
            onTouchStart={() => { simState.current.keys.down = true; }}
            onTouchEnd={() => { simState.current.keys.down = false; }}
            className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-600 text-amber-300 font-bold rounded-lg text-center border border-amber-500/30"
          >
            BRAKE
          </button>
          <button
            onMouseDown={() => { simState.current.keys.up = true; }}
            onMouseUp={() => { simState.current.keys.up = false; }}
            onTouchStart={() => { simState.current.keys.up = true; }}
            onTouchEnd={() => { simState.current.keys.up = false; }}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-black font-extrabold rounded-lg text-center shadow-md shadow-amber-500/20"
          >
            GAS
          </button>
        </div>

        {/* Handbrake Button */}
        <div className="flex items-center justify-center bg-neutral-950 p-2 rounded-xl border border-amber-500/20">
          <button
            onMouseDown={() => {
              simState.current.keys.handbrake = true;
              sound.playTireSkid();
            }}
            onMouseUp={() => { simState.current.keys.handbrake = false; }}
            onTouchStart={() => {
              simState.current.keys.handbrake = true;
              sound.playTireSkid();
            }}
            onTouchEnd={() => { simState.current.keys.handbrake = false; }}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-400 font-extrabold rounded-lg text-center shadow"
          >
            E-BRAKE (DRIFT)
          </button>
        </div>
      </div>
    </div>
  );
};
