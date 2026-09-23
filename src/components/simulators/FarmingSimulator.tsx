/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Sprout, Wheat, Droplets, Fuel, Warehouse, CheckCircle2, ChevronRight } from 'lucide-react';
import { LevelConfig, PerformanceReport } from '../../types/simulator';
import { sound } from '../../utils/audio';

interface FarmingSimulatorProps {
  level: LevelConfig;
  onExit: () => void;
  onComplete: (report: PerformanceReport) => void;
}

type PlotState = 'raw' | 'plowed' | 'seeded' | 'watered' | 'growing' | 'mature' | 'harvested';

interface FarmPlot {
  x: number;
  y: number;
  width: number;
  height: number;
  state: PlotState;
  moisture: number; // 0-100%
  growth: number; // 0-100%
  hasWeeds: boolean;
}

export const FarmingSimulator: React.FC<FarmingSimulatorProps> = ({
  level,
  onExit,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Agronomic Machinery State
  const [selectedTool, setSelectedTool] = useState<'plow' | 'seeder' | 'sprayer' | 'harvester'>('plow');
  const [fuelPercent, setFuelPercent] = useState<number>(100);
  const [grainHopper, setGrainHopper] = useState<number>(0); // 0-100%
  const [siloYieldBushels, setSiloYieldBushels] = useState<number>(0);
  const [plotsTilled, setPlotsTilled] = useState<number>(0);
  const [plotsSeeded, setPlotsSeeded] = useState<number>(0);
  const [plotsHarvested, setPlotsHarvested] = useState<number>(0);
  const [averageMoisture, setAverageMoisture] = useState<number>(85);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Mutable Simulation State
  const farmState = useRef({
    x: 400,
    y: 500,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 0,
    fuel: 100,
    hopperBushels: 0,
    siloBushels: 0,
    plots: [] as FarmPlot[],
    tool: 'plow' as 'plow' | 'seeder' | 'sprayer' | 'harvester',
    startTime: Date.now(),
    lastTime: Date.now(),
    keys: { up: false, down: false, left: false, right: false },
    totalPlots: 36
  });

  // Setup 6x6 Field Grid
  useEffect(() => {
    const state = farmState.current;
    state.startTime = Date.now();
    state.lastTime = Date.now();
    state.tool = level.levelNumber === 3 ? 'harvester' : level.levelNumber === 2 ? 'sprayer' : 'plow';
    setSelectedTool(state.tool);

    const plots: FarmPlot[] = [];
    const rows = 6;
    const cols = 6;
    const plotW = 90;
    const plotH = 65;
    const startX = 350;
    const startY = 140;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let initialPlotState: PlotState = 'raw';
        let initialMoisture = 60;
        let initialGrowth = 0;
        let weeds = false;

        if (level.levelNumber === 2) {
          // Crops sprouting, need water
          initialPlotState = 'seeded';
          initialMoisture = 45;
          initialGrowth = 40;
          weeds = Math.random() < 0.2;
        } else if (level.levelNumber === 3) {
          // Golden ripe harvest
          initialPlotState = 'mature';
          initialMoisture = 70;
          initialGrowth = 100;
        }

        plots.push({
          x: startX + c * (plotW + 8),
          y: startY + r * (plotH + 8),
          width: plotW,
          height: plotH,
          state: initialPlotState,
          moisture: initialMoisture,
          growth: initialGrowth,
          hasWeeds: weeds
        });
      }
    }

    state.plots = plots;
  }, [level]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = farmState.current.keys;
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
        case '1':
          setTool('plow');
          break;
        case '2':
          setTool('seeder');
          break;
        case '3':
          setTool('sprayer');
          break;
        case '4':
          setTool('harvester');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = farmState.current.keys;
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const setTool = (tool: 'plow' | 'seeder' | 'sprayer' | 'harvester') => {
    farmState.current.tool = tool;
    setSelectedTool(tool);
    sound.playClick();
  };

  // Main Farm Field Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      const dt = Math.min((now - farmState.current.lastTime) / 1000, 0.1);
      farmState.current.lastTime = now;

      const state = farmState.current;
      const k = state.keys;

      if (!isPaused && state.fuel > 0) {
        // Steering
        if (k.left) state.angle -= 2.2 * dt;
        if (k.right) state.angle += 2.2 * dt;

        // Tractor Drive
        const maxTractorSpeed = 140;
        if (k.up) {
          state.speed = Math.min(maxTractorSpeed, state.speed + 120 * dt);
          state.fuel = Math.max(0, state.fuel - 0.7 * dt);
        } else if (k.down) {
          state.speed = Math.max(-60, state.speed - 120 * dt);
          state.fuel = Math.max(0, state.fuel - 0.7 * dt);
        } else {
          state.speed *= 0.94;
        }

        setFuelPercent(Math.round(state.fuel));

        // Movement
        state.x += Math.cos(state.angle) * state.speed * dt;
        state.y += Math.sin(state.angle) * state.speed * dt;

        // Boundary constraints
        state.x = Math.max(80, Math.min(canvas.width - 80, state.x));
        state.y = Math.max(80, Math.min(canvas.height - 80, state.y));

        sound.updateEngineSound(Math.abs(state.speed) / maxTractorSpeed, 0.07);

        // Interaction with Farm Plots
        state.plots.forEach((plot) => {
          // Check if tractor rear implement is on plot
          const rearX = state.x - Math.cos(state.angle) * 20;
          const rearY = state.y - Math.sin(state.angle) * 20;

          const inside =
            rearX >= plot.x &&
            rearX <= plot.x + plot.width &&
            rearY >= plot.y &&
            rearY <= plot.y + plot.height;

          if (inside && Math.abs(state.speed) > 10) {
            if (state.tool === 'plow' && plot.state === 'raw') {
              plot.state = 'plowed';
              sound.playHarvestRustle();
            } else if (state.tool === 'seeder' && plot.state === 'plowed') {
              plot.state = 'seeded';
              sound.playClick();
            } else if (state.tool === 'sprayer') {
              plot.moisture = Math.min(100, plot.moisture + 25 * dt);
              plot.hasWeeds = false;
            } else if (state.tool === 'harvester' && plot.state === 'mature') {
              if (state.hopperBushels < 500) {
                plot.state = 'harvested';
                state.hopperBushels += 25;
                sound.playHarvestRustle();
              }
            }
          }

          // Natural crop growth cycle
          if (plot.state === 'seeded' && plot.moisture > 40) {
            plot.growth = Math.min(100, plot.growth + 2 * dt);
            if (plot.growth >= 100) {
              plot.state = 'mature';
            }
          }
        });

        // Silo Grain Unload Zone (Top-Left corner of farm)
        const inSiloZone = state.x < 240 && state.y < 240;
        if (inSiloZone && state.hopperBushels > 0) {
          const transfer = Math.min(state.hopperBushels, Math.round(180 * dt));
          state.hopperBushels -= transfer;
          state.siloBushels += transfer;
          sound.playConstruction();
          setSiloYieldBushels(state.siloBushels);
        }

        // Sync HUD
        const tilled = state.plots.filter((p) => p.state === 'plowed' || p.state === 'seeded' || p.state === 'mature' || p.state === 'harvested').length;
        const seeded = state.plots.filter((p) => p.state === 'seeded' || p.state === 'mature' || p.state === 'harvested').length;
        const harvested = state.plots.filter((p) => p.state === 'harvested').length;
        const avgM = Math.round(state.plots.reduce((acc, p) => acc + p.moisture, 0) / state.plots.length);

        setPlotsTilled(tilled);
        setPlotsSeeded(seeded);
        setPlotsHarvested(harvested);
        setAverageMoisture(avgM);
        setGrainHopper(Math.round((state.hopperBushels / 500) * 100));

        // Victory Conditions
        if (level.levelNumber === 1 && tilled >= 20 && seeded >= 20) {
          finishFarmingScenario(true);
          return;
        } else if (level.levelNumber === 2 && avgM >= 75 && seeded >= 24) {
          finishFarmingScenario(true);
          return;
        } else if (level.levelNumber === 3 && state.siloBushels >= 1000) {
          finishFarmingScenario(true);
          return;
        }
      }

      // RENDER FARM CANVAS
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Farm Grass Field Background
      ctx.fillStyle = '#1e3a1f';
      ctx.fillRect(0, 0, w, h);

      // Silo Complex & Unload Bay (Top-Left)
      ctx.fillStyle = '#334155';
      ctx.fillRect(40, 40, 160, 160);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(120, 120, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GRAIN ELEVATOR SILO', 120, 115);
      ctx.fillText(`[${state.siloBushels} BU]`, 120, 135);

      // Draw 36 Farm Plots
      state.plots.forEach((p) => {
        // Plot Soil Color by state
        if (p.state === 'raw') {
          ctx.fillStyle = '#451a03'; // dry clay earth
        } else if (p.state === 'plowed') {
          ctx.fillStyle = '#291508'; // rich dark furrow
        } else if (p.state === 'seeded') {
          ctx.fillStyle = '#1c1917';
        } else if (p.state === 'mature') {
          ctx.fillStyle = '#eab308'; // golden harvest
        } else {
          ctx.fillStyle = '#78716c'; // harvested stubble
        }

        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Furrow lines if plowed
        if (p.state === 'plowed' || p.state === 'seeded') {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = 2;
          for (let ly = p.y + 10; ly < p.y + p.height; ly += 12) {
            ctx.beginPath();
            ctx.moveTo(p.x + 4, ly);
            ctx.lineTo(p.x + p.width - 4, ly);
            ctx.stroke();
          }
        }

        // Golden wheat stalks if mature
        if (p.state === 'mature') {
          ctx.fillStyle = '#facc15';
          for (let wx = p.x + 8; wx < p.x + p.width - 8; wx += 14) {
            ctx.fillRect(wx, p.y + 10, 4, p.height - 20);
          }
        }

        // Weeds warning
        if (p.hasWeeds) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Plot Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
      });

      // Draw Tractor & Implement
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.angle);

      // Trailing Tool Implement
      ctx.fillStyle = '#475569';
      if (state.tool === 'plow') {
        ctx.fillRect(-34, -14, 14, 28);
      } else if (state.tool === 'seeder') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-36, -18, 16, 36);
      } else if (state.tool === 'sprayer') {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-36, -30, 8, 60);
      } else if (state.tool === 'harvester') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(20, -26, 12, 52); // Front harvesting header
      }

      // Main Tractor Body (John Deere green)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(-20, -12, 40, 24, 4);
      ctx.fill();

      // Tractor Cab Glass
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -9, 14, 18);

      // Big Rear Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -16, 16, 6);
      ctx.fillRect(-18, 10, 16, 6);

      // Front Wheels
      ctx.fillRect(10, -14, 10, 4);
      ctx.fillRect(10, 10, 10, 4);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      sound.stopContinuous();
    };
  }, [isPaused]);

  const finishFarmingScenario = (success: boolean) => {
    sound.stopContinuous();
    const state = farmState.current;
    const timeElapsed = Math.floor((Date.now() - state.startTime) / 1000);

    const timeDiff = level.parTimeSeconds - timeElapsed;
    const timeBonus = Math.max(0, timeDiff * 30);
    const accuracy = Math.min(100, Math.round(state.fuel * 0.5 + 50));
    const accuracyBonus = Math.round((accuracy / 100) * 1000);

    const total = level.baseScore + timeBonus + accuracyBonus + Math.round(state.siloBushels * 1.2);

    let stars: 1 | 2 | 3 = 1;
    if (state.fuel > 30 && timeElapsed <= level.parTimeSeconds) {
      stars = 3;
    } else if (state.fuel > 10) {
      stars = 2;
    }

    sound.playVictoryFanfare(stars);

    onComplete({
      levelId: level.id,
      categoryId: level.categoryId,
      timeElapsedSeconds: timeElapsed,
      accuracyPercent: accuracy,
      tasksCompleted: 4,
      totalTasks: 4,
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
    const s = farmState.current;
    s.x = 400;
    s.y = 500;
    s.speed = 0;
    s.angle = 0;
    s.fuel = 100;
    s.hopperBushels = 0;
    s.siloBushels = 0;
    s.startTime = Date.now();
    s.plots.forEach((p) => {
      p.state = level.levelNumber === 3 ? 'mature' : level.levelNumber === 2 ? 'seeded' : 'raw';
    });
    setFuelPercent(100);
    setGrainHopper(0);
    setSiloYieldBushels(0);
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
            <span>Farmstead</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-amber-400 font-bold">{level.title}</span>
            <span aria-hidden="true" className="text-amber-700">·</span>
            <span className="text-amber-200/60">Scenario 0{level.levelNumber}</span>
          </div>
        </div>

        {/* Live Gauges in Pure Gold */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold text-amber-300 tabular-nums">{fuelPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wheat className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-amber-500/60">HOPPER:</span>
            <span className="font-extrabold text-amber-300 tabular-nums">{grainHopper}%</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-500/60">SILO:</span>
            <span className="font-extrabold text-amber-400 tabular-nums">{siloYieldBushels} BU</span>
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

      {/* Main Farm Canvas */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom Tool Selector & Steering Controls in Pure Gold & Black */}
      <div className="bg-black border-t border-amber-500/20 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs z-20">
        {/* Active Tool Selector */}
        <div className="col-span-2 flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-amber-500/20">
          <button
            onClick={() => setTool('plow')}
            className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedTool === 'plow'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-amber-200/70 hover:text-white bg-neutral-900 border border-amber-500/20'
            }`}
          >
            1. PLOW
          </button>
          <button
            onClick={() => setTool('seeder')}
            className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedTool === 'seeder'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-amber-200/70 hover:text-white bg-neutral-900 border border-amber-500/20'
            }`}
          >
            2. SEEDER
          </button>
          <button
            onClick={() => setTool('sprayer')}
            className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedTool === 'sprayer'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-amber-200/70 hover:text-white bg-neutral-900 border border-amber-500/20'
            }`}
          >
            3. SPRAYER
          </button>
          <button
            onClick={() => setTool('harvester')}
            className={`flex-1 py-2 px-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedTool === 'harvester'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-amber-200/70 hover:text-white bg-neutral-900 border border-amber-500/20'
            }`}
          >
            4. COMBINE
          </button>
        </div>

        {/* Tractor Mobile Steering Buttons */}
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-amber-500/20">
          <button
            onMouseDown={() => { farmState.current.keys.left = true; }}
            onMouseUp={() => { farmState.current.keys.left = false; }}
            onTouchStart={() => { farmState.current.keys.left = true; }}
            onTouchEnd={() => { farmState.current.keys.left = false; }}
            className="flex-1 py-2 bg-neutral-900 active:bg-amber-400 active:text-black text-amber-200 font-bold rounded-lg text-center border border-amber-500/30"
          >
            ◄ TURN
          </button>
          <button
            onMouseDown={() => { farmState.current.keys.right = true; }}
            onMouseUp={() => { farmState.current.keys.right = false; }}
            onTouchStart={() => { farmState.current.keys.right = true; }}
            onTouchEnd={() => { farmState.current.keys.right = false; }}
            className="flex-1 py-2 bg-neutral-900 active:bg-amber-400 active:text-black text-amber-200 font-bold rounded-lg text-center border border-amber-500/30"
          >
            TURN ►
          </button>
        </div>

        {/* Drive & Reverse */}
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-amber-500/20">
          <button
            onMouseDown={() => { farmState.current.keys.down = true; }}
            onMouseUp={() => { farmState.current.keys.down = false; }}
            onTouchStart={() => { farmState.current.keys.down = true; }}
            onTouchEnd={() => { farmState.current.keys.down = false; }}
            className="flex-1 py-2 bg-neutral-900 active:bg-amber-700 text-amber-300 font-bold rounded-lg text-center border border-amber-500/30"
          >
            REV
          </button>
          <button
            onMouseDown={() => { farmState.current.keys.up = true; }}
            onMouseUp={() => { farmState.current.keys.up = false; }}
            onTouchStart={() => { farmState.current.keys.up = true; }}
            onTouchEnd={() => { farmState.current.keys.up = false; }}
            className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-black font-extrabold rounded-lg text-center shadow-md shadow-amber-500/20"
          >
            DRIVE
          </button>
        </div>
      </div>
    </div>
  );
};
