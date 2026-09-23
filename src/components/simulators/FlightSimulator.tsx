/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown, Compass, ShieldAlert } from 'lucide-react';
import { LevelConfig, PerformanceReport } from '../../types/simulator';
import { sound } from '../../utils/audio';

interface FlightSimulatorProps {
  level: LevelConfig;
  onExit: () => void;
  onComplete: (report: PerformanceReport) => void;
}

interface WaypointRing {
  x: number;
  y: number;
  z: number;
  radius: number;
  cleared: boolean;
}

export const FlightSimulator: React.FC<FlightSimulatorProps> = ({
  level,
  onExit,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Flight Dynamics State
  const [speed, setSpeed] = useState<number>(0);
  const [altitude, setAltitude] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [heading, setHeading] = useState<number>(360);
  const [throttle, setThrottle] = useState<number>(0);
  const [gearDown, setGearDown] = useState<boolean>(true);
  const [flapsIndex, setFlapsIndex] = useState<number>(0);
  const [isStalling, setIsStalling] = useState<boolean>(false);
  const [isAirborne, setIsAirborne] = useState<boolean>(false);
  const [crashed, setCrashed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Objectives tracking
  const [waypointsCleared, setWaypointsCleared] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Internal mutable animation refs
  const flightStateRef = useRef({
    x: 0,
    altitude: 0,
    distance: 0,
    speed: 0,
    pitch: 0,
    roll: 0,
    heading: 360,
    throttle: 0,
    gearDown: true,
    flaps: 0,
    waypoints: [] as WaypointRing[],
    totalWaypoints: 4,
    hasRotated: false,
    gearRetractedAfterClimb: false,
    touchdownSuccessful: false,
    startTime: Date.now(),
    lastFrameTime: Date.now(),
    penaltyPoints: 0,
    totalFrames: 0,
    onGlideSlopeFrames: 0
  });

  // Initialize Waypoints based on level
  useEffect(() => {
    const numRings = level.levelNumber === 1 ? 4 : level.levelNumber === 2 ? 6 : 4;
    flightStateRef.current.totalWaypoints = numRings;

    const rings: WaypointRing[] = [];
    for (let i = 0; i < numRings; i++) {
      const zDist = 1800 + i * 1600;
      let xOffset = 0;
      let yAlt = 800 + i * 450;

      if (level.levelNumber === 2) {
        xOffset = Math.sin(i * 1.5) * 220;
        yAlt = 1200 + Math.cos(i) * 300;
      } else if (level.levelNumber === 3) {
        yAlt = 2500 - i * 500;
        xOffset = (Math.random() - 0.5) * 80;
      }

      rings.push({
        x: xOffset,
        y: yAlt,
        z: zDist,
        radius: 120,
        cleared: false
      });
    }

    flightStateRef.current.waypoints = rings;
    flightStateRef.current.startTime = Date.now();
    flightStateRef.current.lastFrameTime = Date.now();

    if (level.levelNumber === 3) {
      flightStateRef.current.altitude = 2800;
      flightStateRef.current.speed = 160;
      flightStateRef.current.throttle = 60;
      setAltitude(2800);
      setSpeed(160);
      setThrottle(60);
      setIsAirborne(true);
    }
  }, [level]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || crashed) return;

      const state = flightStateRef.current;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowdown':
          state.pitch = Math.max(-25, state.pitch - 1.5);
          break;
        case 's':
        case 'arrowup':
          state.pitch = Math.min(25, state.pitch + 1.5);
          break;
        case 'a':
        case 'arrowleft':
          state.roll = Math.max(-50, state.roll - 2.5);
          break;
        case 'd':
        case 'arrowright':
          state.roll = Math.min(50, state.roll + 2.5);
          break;
        case 'shift':
        case 'e':
          state.throttle = Math.min(100, state.throttle + 5);
          setThrottle(state.throttle);
          sound.playClick();
          break;
        case 'control':
        case 'q':
          state.throttle = Math.max(0, state.throttle - 5);
          setThrottle(state.throttle);
          sound.playClick();
          break;
        case 'g':
          state.gearDown = !state.gearDown;
          setGearDown(state.gearDown);
          sound.playClick();
          if (!state.gearDown && state.altitude > 400) {
            state.gearRetractedAfterClimb = true;
          }
          break;
        case 'f':
          const nextFlaps = state.flaps === 0 ? 15 : state.flaps === 15 ? 30 : 0;
          state.flaps = nextFlaps;
          setFlapsIndex(nextFlaps);
          sound.playClick();
          break;
        case 'b':
          if (state.altitude <= 5) {
            state.speed = Math.max(0, state.speed - 4);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, crashed]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    let animationFrameId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = Date.now();
      const dt = Math.min((now - flightStateRef.current.lastFrameTime) / 1000, 0.1);
      flightStateRef.current.lastFrameTime = now;

      if (!isPaused && !crashed) {
        const state = flightStateRef.current;
        state.totalFrames += 1;

        const targetSpeed = (state.throttle / 100) * 320;
        const drag = (state.flaps / 30) * 20 + (state.gearDown ? 15 : 0) + Math.abs(state.pitch) * 0.8;
        const netAccel = (targetSpeed - drag - state.speed) * 0.4;
        state.speed = Math.max(0, state.speed + netAccel * dt);

        if (state.altitude > 5) {
          setIsAirborne(true);
        }

        const liftFactor = (state.speed / 135) * (1 + (state.flaps / 30) * 0.35);
        const verticalVelocity = (liftFactor * Math.sin((state.pitch * Math.PI) / 180) * 2800) - (liftFactor < 0.8 && state.altitude > 10 ? 1200 : 0);

        state.altitude = Math.max(0, state.altitude + (verticalVelocity * dt) / 60);

        const turnRate = Math.sin((state.roll * Math.PI) / 180) * 35;
        state.heading = (state.heading + turnRate * dt + 360) % 360;
        state.x += Math.sin((state.roll * Math.PI) / 180) * state.speed * 0.4 * dt;
        state.distance += state.speed * 0.514 * dt;

        const isStallCondition = (state.speed < 105 && state.altitude > 50) || (state.pitch > 22 && state.speed < 140);
        setIsStalling(isStallCondition);

        state.roll *= 0.985;
        state.pitch *= 0.99;

        sound.updateEngineSound(state.speed / 300, 0.08);

        if (state.altitude <= 0) {
          state.altitude = 0;
          if (state.speed > 190 || Math.abs(state.pitch) > 12 || Math.abs(state.roll) > 15 || !state.gearDown) {
            setCrashed(true);
            sound.playFailure();
            return;
          } else if (state.speed < 40 && state.distance > 3000) {
            state.touchdownSuccessful = true;
          }
        }

        state.waypoints.forEach((ring) => {
          if (!ring.cleared && state.distance >= ring.z - 100 && state.distance <= ring.z + 150) {
            const dx = state.x - ring.x;
            const dy = state.altitude - ring.y;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);

            if (distToCenter <= ring.radius) {
              ring.cleared = true;
              sound.playObjectiveComplete();
              setWaypointsCleared((prev) => prev + 1);
            }
          }
        });

        setSpeed(Math.round(state.speed));
        setAltitude(Math.round(state.altitude));
        setPitch(Math.round(state.pitch));
        setRoll(Math.round(state.roll));
        setHeading(Math.round(state.heading));
        setElapsedSeconds(Math.floor((Date.now() - state.startTime) / 1000));

        const allRingsCleared = state.waypoints.filter((w) => w.cleared).length >= state.totalWaypoints;

        if (level.levelNumber === 1 && state.altitude >= 2500 && allRingsCleared) {
          finishScenario(true);
          return;
        } else if (level.levelNumber === 2 && allRingsCleared) {
          finishScenario(true);
          return;
        } else if (level.levelNumber === 3 && allRingsCleared && state.altitude <= 5 && state.speed < 80) {
          finishScenario(true);
          return;
        }
      }

      // DRAW CANVAS IN GOLD & BLACK COCKPIT SCHEME
      const width = canvas.width;
      const height = canvas.height;
      const state = flightStateRef.current;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Pitch/Roll Horizon
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((-state.roll * Math.PI) / 180);
      const pitchOffset = state.pitch * 6;
      ctx.translate(0, pitchOffset);

      // Sky gradient - Dark Obsidian
      const skyGrad = ctx.createLinearGradient(0, -height, 0, 0);
      skyGrad.addColorStop(0, '#000000');
      skyGrad.addColorStop(1, '#1c1917');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-width, -height * 2, width * 2, height * 2);

      // Ground gradient - Deep Black & Bronze
      const groundGrad = ctx.createLinearGradient(0, 0, 0, height);
      groundGrad.addColorStop(0, '#292524');
      groundGrad.addColorStop(0.3, '#1c1917');
      groundGrad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-width, 0, width * 2, height * 2);

      // Horizon line in Pure Gold
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-width, 0);
      ctx.lineTo(width, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Golden Pitch Ladder marks
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      for (let deg = -20; deg <= 20; deg += 5) {
        if (deg === 0) continue;
        const yPos = -deg * 6;
        ctx.beginPath();
        ctx.moveTo(-25, yPos);
        ctx.lineTo(25, yPos);
        ctx.stroke();
        ctx.fillText(`${deg}°`, 35, yPos + 3);
      }

      // Runway rendering on ground in Gold & Charcoal
      if (state.distance < 4000) {
        const rwWidth = Math.max(8, 200 - (state.distance / 4000) * 160);
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(-rwWidth / 2, 0);
        ctx.lineTo(rwWidth / 2, 0);
        ctx.lineTo(rwWidth * 1.5, height);
        ctx.lineTo(-rwWidth * 1.5, height);
        ctx.closePath();
        ctx.fill();

        // Runway centerline stripes in pure gold
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      // Draw Waypoints in Pure Gold Rings
      state.waypoints.forEach((ring, idx) => {
        const relZ = ring.z - state.distance;
        if (relZ > 20 && relZ < 5000) {
          const scale = 500 / relZ;
          const projX = width / 2 + (ring.x - state.x) * scale;
          const projY = height / 2 - (ring.y - state.altitude) * scale;
          const projRadius = Math.max(12, ring.radius * scale);

          ctx.save();
          ctx.beginPath();
          ctx.arc(projX, projY, projRadius, 0, Math.PI * 2);
          ctx.lineWidth = ring.cleared ? 2 : 4;
          ctx.strokeStyle = ring.cleared ? 'rgba(234, 179, 8, 0.4)' : '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = ring.cleared ? 4 : 12;
          ctx.stroke();

          // Gate Number in Gold
          ctx.fillStyle = ring.cleared ? '#fef08a' : '#facc15';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`GATE 0${idx + 1}`, projX, projY - projRadius - 6);
          ctx.restore();
        }
      });

      // HUD Center Flight Reticle in Pure Gold
      ctx.strokeStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Left winglet
      ctx.moveTo(width / 2 - 40, height / 2);
      ctx.lineTo(width / 2 - 15, height / 2);
      ctx.lineTo(width / 2 - 15, height / 2 + 8);
      // Right winglet
      ctx.moveTo(width / 2 + 15, height / 2 + 8);
      ctx.lineTo(width / 2 + 15, height / 2);
      ctx.lineTo(width / 2 + 40, height / 2);
      // Center dot
      ctx.arc(width / 2, height / 2, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      sound.stopContinuous();
    };
  }, [isPaused, crashed, level]);

  const finishScenario = (success: boolean) => {
    sound.stopContinuous();
    const state = flightStateRef.current;
    const timeElapsed = Math.floor((Date.now() - state.startTime) / 1000);

    const clearedCount = state.waypoints.filter((w) => w.cleared).length;
    const accuracy = Math.round((clearedCount / state.totalWaypoints) * 100);

    const timeDiff = level.parTimeSeconds - timeElapsed;
    const timeBonus = Math.max(0, timeDiff * 30);
    const accuracyBonus = Math.round((accuracy / 100) * 1200);

    const total = level.baseScore + timeBonus + accuracyBonus;

    let stars: 1 | 2 | 3 = 1;
    if (accuracy >= 90 && timeElapsed <= level.parTimeSeconds) {
      stars = 3;
    } else if (accuracy >= 75) {
      stars = 2;
    }

    sound.playVictoryFanfare(stars);

    onComplete({
      levelId: level.id,
      categoryId: level.categoryId,
      timeElapsedSeconds: timeElapsed,
      accuracyPercent: accuracy,
      tasksCompleted: clearedCount,
      totalTasks: state.totalWaypoints,
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
    const state = flightStateRef.current;
    state.x = 0;
    state.altitude = level.levelNumber === 3 ? 2800 : 0;
    state.distance = 0;
    state.speed = level.levelNumber === 3 ? 160 : 0;
    state.pitch = 0;
    state.roll = 0;
    state.heading = 360;
    state.throttle = level.levelNumber === 3 ? 60 : 0;
    state.startTime = Date.now();
    state.lastFrameTime = Date.now();
    state.waypoints.forEach((w) => (w.cleared = false));
    setWaypointsCleared(0);
    setThrottle(state.throttle);
  };

  return (
    <div className="relative w-full h-[88vh] max-h-[900px] flex flex-col bg-black rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-black select-none">
      {/* Top Cockpit Telemetry Banner in Pure Gold & Black */}
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
            <span>Abort</span>
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-amber-400 font-bold">{level.title}</span>
            <span aria-hidden="true" className="text-amber-700">·</span>
            <span className="text-amber-200/60">Scenario 0{level.levelNumber}</span>
          </div>
        </div>

        {/* Live Gauges in Pure Gold */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-amber-500/60">IAS:</span>
            <span className="font-extrabold text-amber-300 text-sm tabular-nums">{speed}</span>
            <span className="text-amber-500/60 text-[10px]">KTS</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-500/60">ALT:</span>
            <span className="font-extrabold text-amber-300 text-sm tabular-nums">{altitude}</span>
            <span className="text-amber-500/60 text-[10px]">FT</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-amber-500/60">HDG:</span>
            <span className="font-extrabold text-yellow-400 text-sm tabular-nums">{heading}°</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-500/60">GATES:</span>
            <span className="font-extrabold text-amber-400 text-sm tabular-nums">
              {waypointsCleared} / {flightStateRef.current.totalWaypoints}
            </span>
          </div>
        </div>

        {/* Controls */}
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
            title="Restart Scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Glass Cockpit 3D Simulation Canvas */}
      <div className="relative flex-1 w-full bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-cover"
        />

        {/* Left Side: Airspeed Tape HUD Overlay in Gold & Black */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 border border-amber-500/40 rounded-lg p-2 font-mono text-center text-xs backdrop-blur-sm pointer-events-none hidden sm:block shadow-lg shadow-black">
          <span className="text-[10px] text-amber-200/60 block mb-1">AIRSPEED</span>
          <div className="text-xl font-extrabold text-amber-400 tabular-nums drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{speed}</div>
          <div className="text-[10px] text-amber-500/60 mt-1">KNOTS</div>
        </div>

        {/* Right Side: Altimeter Tape HUD Overlay in Gold & Black */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 border border-amber-500/40 rounded-lg p-2 font-mono text-center text-xs backdrop-blur-sm pointer-events-none hidden sm:block shadow-lg shadow-black">
          <span className="text-[10px] text-amber-200/60 block mb-1">ALTITUDE</span>
          <div className="text-xl font-extrabold text-amber-400 tabular-nums drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{altitude}</div>
          <div className="text-[10px] text-amber-500/60 mt-1">FEET</div>
        </div>

        {/* Stall Warning Banner */}
        {isStalling && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-950 text-red-200 font-mono font-bold text-sm px-4 py-1.5 rounded-md animate-pulse shadow-lg border border-red-500">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>STALL WARNING · PUSH NOSE DOWN</span>
          </div>
        )}

        {/* Crash Overlay */}
        {crashed && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">AIRCRAFT DESTROYED</h3>
            <p className="text-sm text-amber-200/70 max-w-md">
              Excessive impact velocity or uncoordinated attitude during touchdown. Check your landing gear and maintain gentle sink rate.
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold rounded-xl text-sm transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Flight Instrument Deck in Pure Gold & Black */}
      <div className="bg-black border-t border-amber-500/20 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs z-20">
        {/* Throttle Lever Control */}
        <div className="flex flex-col gap-1.5 bg-neutral-950 p-2.5 rounded-xl border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-200/70 font-mono">
            <span>THROTTLE (W/S)</span>
            <span className="text-amber-400 font-bold">{throttle}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={throttle}
            onChange={(e) => {
              const val = Number(e.target.value);
              setThrottle(val);
              flightStateRef.current.throttle = val;
            }}
            className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-900 rounded-lg"
          />
        </div>

        {/* Flight Surface Pitch & Roll Indicator */}
        <div className="flex items-center justify-around bg-neutral-950 p-2.5 rounded-xl border border-amber-500/20 font-mono">
          <div className="text-center">
            <span className="text-[10px] text-amber-500/60 block">PITCH</span>
            <span className="font-bold text-amber-300">{pitch}°</span>
          </div>
          <div className="h-6 w-px bg-amber-900/40" />
          <div className="text-center">
            <span className="text-[10px] text-amber-500/60 block">BANK</span>
            <span className="font-bold text-amber-300">{roll}°</span>
          </div>
        </div>

        {/* Gear & Flaps Actuators */}
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-amber-500/20 font-mono">
          <button
            onClick={() => {
              const next = !gearDown;
              setGearDown(next);
              flightStateRef.current.gearDown = next;
              sound.playClick();
            }}
            className={`flex-1 py-1.5 rounded text-center text-xs font-bold transition-colors ${
              gearDown ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-neutral-900 text-neutral-500'
            }`}
          >
            GEAR {gearDown ? 'DOWN' : 'UP'}
          </button>
          <button
            onClick={() => {
              const next = flapsIndex === 0 ? 15 : flapsIndex === 15 ? 30 : 0;
              setFlapsIndex(next);
              flightStateRef.current.flaps = next;
              sound.playClick();
            }}
            className="flex-1 py-1.5 rounded text-center text-xs font-bold bg-neutral-900 text-amber-200 hover:bg-neutral-800 border border-amber-500/20"
          >
            FLAPS {flapsIndex}°
          </button>
        </div>

        {/* On-Screen Touch Yoke Buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            onMouseDown={() => { flightStateRef.current.pitch = Math.min(25, flightStateRef.current.pitch + 4); }}
            onTouchStart={() => { flightStateRef.current.pitch = Math.min(25, flightStateRef.current.pitch + 4); }}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-500 active:text-black text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold font-mono"
          >
            PULL UP
          </button>
          <button
            onMouseDown={() => { flightStateRef.current.pitch = Math.max(-25, flightStateRef.current.pitch - 4); }}
            onTouchStart={() => { flightStateRef.current.pitch = Math.max(-25, flightStateRef.current.pitch - 4); }}
            className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 active:bg-amber-500 active:text-black text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold font-mono"
          >
            NOSE DWN
          </button>
        </div>
      </div>
    </div>
  );
};
