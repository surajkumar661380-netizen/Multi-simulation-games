/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Building2, Trees, Zap, Droplet, DollarSign, Users, Smile, Trash2 } from 'lucide-react';
import { LevelConfig, PerformanceReport } from '../../types/simulator';
import { sound } from '../../utils/audio';

interface CityBuildingSimulatorProps {
  level: LevelConfig;
  onExit: () => void;
  onComplete: (report: PerformanceReport) => void;
}

type TileType = 'empty' | 'road' | 'residential' | 'commercial' | 'industrial' | 'power' | 'water' | 'park';

interface CityTile {
  r: number;
  c: number;
  type: TileType;
  level: number; // 1 to 3 upgrade stage
  hasPower: boolean;
  hasWater: boolean;
  residents: number;
  revenue: number;
}

export const CityBuildingSimulator: React.FC<CityBuildingSimulatorProps> = ({
  level,
  onExit,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Urban Metrics State
  const [activeTool, setActiveTool] = useState<TileType | 'bulldoze'>('road');
  const [treasury, setTreasury] = useState<number>(5000);
  const [population, setPopulation] = useState<number>(0);
  const [happiness, setHappiness] = useState<number>(75);
  const [incomePerSec, setIncomePerSec] = useState<number>(50);
  const [powerCoverage, setPowerCoverage] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Mutable City Grid & Sim Clock
  const cityState = useRef({
    rows: 8,
    cols: 12,
    grid: [] as CityTile[][],
    treasury: 5000,
    population: 0,
    happiness: 75,
    cashflow: 50,
    powerCoverage: 100,
    parksCount: 0,
    cleanPowerCount: 0,
    startTime: Date.now(),
    lastSimTick: Date.now(),
    carPositions: [] as { x: number; y: number; vx: number; vy: number }[]
  });

  // Tool Costs
  const TOOL_COSTS: Record<TileType | 'bulldoze', number> = {
    empty: 0,
    road: 25,
    residential: 100,
    commercial: 150,
    industrial: 200,
    power: 350,
    water: 250,
    park: 80,
    bulldoze: 10
  };

  // Initialize Grid
  useEffect(() => {
    const s = cityState.current;
    s.startTime = Date.now();
    s.lastSimTick = Date.now();

    const grid: CityTile[][] = [];
    for (let r = 0; r < s.rows; r++) {
      const row: CityTile[] = [];
      for (let c = 0; c < s.cols; c++) {
        row.push({
          r,
          c,
          type: 'empty',
          level: 1,
          hasPower: false,
          hasWater: false,
          residents: 0,
          revenue: 0
        });
      }
      grid.push(row);
    }

    // Pre-populate some starter roads & generator in center
    grid[3][0].type = 'power';
    grid[4][0].type = 'water';
    for (let c = 0; c < 6; c++) {
      grid[3][c + 1].type = 'road';
    }

    s.grid = grid;
  }, [level]);

  // Handle Tile Placement Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const s = cityState.current;
    const tileW = canvas.width / s.cols;
    const tileH = canvas.height / s.rows;

    const c = Math.floor(clickX / tileW);
    const r = Math.floor(clickY / tileH);

    if (r >= 0 && r < s.rows && c >= 0 && c < s.cols) {
      const cost = TOOL_COSTS[activeTool];
      if (s.treasury >= cost) {
        s.treasury -= cost;
        setTreasury(s.treasury);

        if (activeTool === 'bulldoze') {
          s.grid[r][c].type = 'empty';
          s.grid[r][c].residents = 0;
          s.grid[r][c].level = 1;
          sound.playConstruction();
        } else {
          s.grid[r][c].type = activeTool;
          s.grid[r][c].level = 1;
          sound.playConstruction();
        }
      } else {
        sound.playFailure();
      }
    }
  };

  // Main Urban Simulation Tick & Render Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      const dt = (now - cityState.current.lastSimTick) / 1000;

      const s = cityState.current;

      if (!isPaused && dt >= 1.0) {
        // Simulation Tick (Every 1s is a month)
        s.lastSimTick = now;

        // Check power and water network
        let powerPlants = 0;
        let waterTowers = 0;
        let parks = 0;
        let totalPop = 0;
        let netRevenue = 0;

        s.grid.forEach((row) => {
          row.forEach((tile) => {
            if (tile.type === 'power') powerPlants++;
            if (tile.type === 'water') waterTowers++;
            if (tile.type === 'park') parks++;
          });
        });

        s.parksCount = parks;
        s.cleanPowerCount = powerPlants;
        const totalZonedTiles = s.grid.flat().filter((t) => t.type === 'residential' || t.type === 'commercial' || t.type === 'industrial').length;
        const powerCap = powerPlants * 8;
        const powerRating = totalZonedTiles > 0 ? Math.min(100, Math.round((powerCap / Math.max(1, totalZonedTiles)) * 100)) : 100;
        s.powerCoverage = powerRating;
        setPowerCoverage(powerRating);

        // Update each zone
        s.grid.forEach((row, r) => {
          row.forEach((tile, c) => {
            // Check road adjacency
            const hasAdjacentRoad =
              (r > 0 && s.grid[r - 1][c].type === 'road') ||
              (r < s.rows - 1 && s.grid[r + 1][c].type === 'road') ||
              (c > 0 && s.grid[r][c - 1].type === 'road') ||
              (c < s.cols - 1 && s.grid[r][c + 1].type === 'road');

            tile.hasPower = powerPlants > 0;
            tile.hasWater = waterTowers > 0;

            if (tile.type === 'residential' && hasAdjacentRoad && tile.hasPower) {
              tile.residents = Math.min(120, tile.residents + 15);
              totalPop += tile.residents;
              netRevenue += Math.round(tile.residents * 0.4);
            } else if (tile.type === 'commercial' && hasAdjacentRoad && tile.hasPower) {
              netRevenue += 35;
            } else if (tile.type === 'industrial' && hasAdjacentRoad) {
              netRevenue += 50;
            }
          });
        });

        // Happiness calculation
        let calculatedHappiness = 75 + parks * 3 - (powerRating < 80 ? 25 : 0);
        calculatedHappiness = Math.max(40, Math.min(100, calculatedHappiness));
        s.happiness = calculatedHappiness;

        s.treasury += netRevenue;
        s.population = totalPop;
        s.cashflow = netRevenue;

        setTreasury(s.treasury);
        setPopulation(totalPop);
        setHappiness(calculatedHappiness);
        setIncomePerSec(netRevenue);

        // Check Victory
        if (level.levelNumber === 1 && totalPop >= 600 && calculatedHappiness >= 70) {
          finishCityScenario(true);
          return;
        } else if (level.levelNumber === 2 && totalPop >= 1500 && parks >= 4 && netRevenue >= 500) {
          finishCityScenario(true);
          return;
        } else if (level.levelNumber === 3 && totalPop >= 3000 && calculatedHappiness >= 88 && s.treasury >= 10000) {
          finishCityScenario(true);
          return;
        }
      }

      // RENDER CITY CANVAS
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const tileW = w / s.cols;
      const tileH = h / s.rows;

      // Draw Grid Tiles
      s.grid.forEach((row, r) => {
        row.forEach((tile, c) => {
          const tx = c * tileW;
          const ty = r * tileH;

          // Tile base
          if (tile.type === 'empty') {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#0f172a' : '#1e293b';
            ctx.fillRect(tx, ty, tileW, tileH);
          } else if (tile.type === 'road') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(tx, ty, tileW, tileH);
            ctx.strokeStyle = '#facc15';
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(tx, ty + tileH / 2);
            ctx.lineTo(tx + tileW, ty + tileH / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          } else if (tile.type === 'residential') {
            ctx.fillStyle = '#065f46';
            ctx.fillRect(tx, ty, tileW, tileH);
            // Houses
            ctx.fillStyle = '#34d399';
            ctx.fillRect(tx + 8, ty + 8, tileW - 16, tileH - 16);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText(`${tile.residents}p`, tx + 12, ty + tileH / 2 + 3);
          } else if (tile.type === 'commercial') {
            ctx.fillStyle = '#1e40af';
            ctx.fillRect(tx, ty, tileW, tileH);
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(tx + 10, ty + 10, tileW - 20, tileH - 20);
          } else if (tile.type === 'industrial') {
            ctx.fillStyle = '#854d0e';
            ctx.fillRect(tx, ty, tileW, tileH);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(tx + 8, ty + 8, tileW - 16, tileH - 16);
          } else if (tile.type === 'power') {
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(tx, ty, tileW, tileH);
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(tx + tileW / 2, ty + tileH / 2, tileW * 0.3, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile.type === 'water') {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(tx, ty, tileW, tileH);
          } else if (tile.type === 'park') {
            ctx.fillStyle = '#15803d';
            ctx.fillRect(tx, ty, tileW, tileH);
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(tx + tileW / 2, ty + tileH / 2, tileW * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }

          // Grid hairline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.strokeRect(tx, ty, tileW, tileH);
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const finishCityScenario = (success: boolean) => {
    sound.stopContinuous();
    const s = cityState.current;
    const timeElapsed = Math.floor((Date.now() - s.startTime) / 1000);

    const timeDiff = level.parTimeSeconds - timeElapsed;
    const timeBonus = Math.max(0, timeDiff * 30);
    const accuracyBonus = Math.round((s.happiness / 100) * 1200);

    const total = level.baseScore + timeBonus + accuracyBonus + Math.round(s.population * 2);

    let stars: 1 | 2 | 3 = 1;
    if (s.happiness >= 85 && timeElapsed <= level.parTimeSeconds) {
      stars = 3;
    } else if (s.happiness >= 70) {
      stars = 2;
    }

    sound.playVictoryFanfare(stars);

    onComplete({
      levelId: level.id,
      categoryId: level.categoryId,
      timeElapsedSeconds: timeElapsed,
      accuracyPercent: s.happiness,
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
    const s = cityState.current;
    s.treasury = 5000;
    s.population = 0;
    s.happiness = 75;
    s.startTime = Date.now();
    s.lastSimTick = Date.now();
    s.grid.forEach((row) => row.forEach((t) => (t.type = 'empty')));
    setTreasury(5000);
    setPopulation(0);
    setHappiness(75);
  };

  return (
    <div className="relative w-full h-[88vh] max-h-[900px] flex flex-col bg-black rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-black select-none">
      {/* Top Banner in Pure Gold & Black */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/95 border-b border-amber-500/20 text-xs text-amber-200/80 font-mono z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onExit();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 transition-colors font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>City Hall</span>
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
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold text-amber-300 tabular-nums">${treasury.toLocaleString()}</span>
            <span className="text-amber-500/60 text-[10px]">(+${incomePerSec}/mo)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold text-amber-300 tabular-nums">{population.toLocaleString()}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Smile className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-extrabold text-amber-300 tabular-nums">{happiness}%</span>
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

      {/* Main City Grid Canvas */}
      <div className="relative flex-1 w-full bg-black overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handleCanvasClick}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Bottom Zoning Toolbar in Pure Gold & Black */}
      <div className="bg-black border-t border-amber-500/20 p-2 sm:p-3 flex flex-wrap items-center justify-center gap-2 text-xs z-20">
        {[
          { id: 'road', name: 'Road', cost: 25 },
          { id: 'residential', name: 'Zone Residential', cost: 100 },
          { id: 'commercial', name: 'Zone Commercial', cost: 150 },
          { id: 'industrial', name: 'Zone Industrial', cost: 200 },
          { id: 'power', name: 'Power Plant', cost: 350 },
          { id: 'water', name: 'Water Tower', cost: 250 },
          { id: 'park', name: 'Park', cost: 80 },
          { id: 'bulldoze', name: 'Demolish', cost: 10 }
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              setActiveTool(tool.id as TileType | 'bulldoze');
              sound.playClick();
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTool === tool.id
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black ring-1 ring-amber-400 shadow-md shadow-amber-500/20 font-extrabold scale-105'
                : 'bg-neutral-950 text-amber-200/70 hover:text-white border border-amber-500/20 hover:border-amber-500/40'
            }`}
          >
            <span>{tool.name}</span>
            <span className="text-[10px] opacity-75 font-mono">(${tool.cost})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
