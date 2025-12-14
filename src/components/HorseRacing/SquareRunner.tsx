"use client";

import { useState, useMemo, useRef } from "react";
import { useTick } from "@pixi/react";
import { Ticker } from "pixi.js";
import { HorseSprite } from "./HorseSprite";

interface SquareRunnerProps {
    index: number;
    path: { left: number; top: number; right: number; bottom: number };
    laneWidth: number;
    totalLanes: number;
    cornerSize: number;
    color: number;
    raceState: string;
    runnersData: React.MutableRefObject<any[]>;
    startLineX: number;
    finishLineX: number; 
    offsetLane: number;
    onFinish: (laneIndex: number) => void;
    onPositionUpdate?: (pos: { x: number, y: number }) => void;
}

const TOTAL_LAPS = 1;
const OVERTAKE_DISTANCE = 45; 
const SAFE_GAP = 55;

export function SquareRunner({
    index, path, laneWidth, totalLanes, cornerSize, color, raceState, runnersData, startLineX, finishLineX, offsetLane, onFinish, onPositionUpdate
}: SquareRunnerProps) {

    const baseSpeed = useMemo(() => 4 + Math.random() * 1.5, []);
    const aggression = useMemo(() => 0.5 + Math.random() * 0.5, []);

    const initialVisualOffset = ((index + offsetLane) * laneWidth) + (laneWidth / 2);
    const [pos, setPos] = useState({ x: startLineX, y: path.top - initialVisualOffset });

    const state = useRef({
        currentLane: index,
        visualOffset: initialVisualOffset,
        segment: 0,
        lapCount: 0,
        finished: false,
        stamina: 1.0,
        wobble: Math.random() * 10
    });

    useTick((ticker: Ticker) => {
        if (raceState !== "running" || state.current.finished) return;
        const s = state.current;
        const dt = ticker.deltaTime;
        const myX = pos.x; const myY = pos.y;

        // --- AI LOGIC ---
        const getDist = (other: any) => Math.sqrt(Math.pow(other.x - myX, 2) + Math.pow(other.y - myY, 2));
        const isLaneSafe = (targetLaneIdx: number) => !runnersData.current.some((other, idx) => {
            if (idx === index || !other || other.finished) return false;
            if (Math.abs(other.lane - targetLaneIdx) < 0.7) return getDist(other) < SAFE_GAP;
            return false;
        });

        let targetLane = s.currentLane;
        const blockedAhead = runnersData.current.some((other, idx) => {
            if (idx === index || !other || other.finished) return false;
            if (Math.abs(other.lane - s.currentLane) < 0.6) return getDist(other) < OVERTAKE_DISTANCE;
            return false;
        });

        if (blockedAhead) {
            if (s.currentLane >= 1 && isLaneSafe(s.currentLane - 1)) {
                targetLane = s.currentLane - 1;
            } else if (s.currentLane < totalLanes - 1 && isLaneSafe(s.currentLane + 1)) {
                targetLane = s.currentLane + 1;
            }
        } else {
            if (s.currentLane >= 1 && Math.random() < 0.05 * aggression && isLaneSafe(s.currentLane - 1)) {
                targetLane = s.currentLane - 1;
            }
        }

        targetLane = Math.max(0, Math.min(totalLanes - 1, targetLane));
        s.currentLane += (targetLane - s.currentLane) * 0.08 * dt;

        let cornerCutting = 0;
        if (s.segment % 2 !== 0) cornerCutting = 2;

        const idealOffset = ((s.currentLane + offsetLane) * laneWidth) + (laneWidth / 2) + cornerCutting;
        s.visualOffset += (idealOffset - s.visualOffset) * 0.1 * dt;

        const off = s.visualOffset;
        const L = path.left - off; const R = path.right + off;
        const T = path.top - off; const B = path.bottom + off; const C = cornerSize;
        const targets = [{ x: R - C, y: T }, { x: R, y: T + C }, { x: R, y: B - C }, { x: R - C, y: B }, { x: L + C, y: B }, { x: L, y: B - C }, { x: L, y: T + C }, { x: L + C, y: T }];
        const currentTarget = targets[s.segment];

        if (Math.random() < 0.02) s.stamina = 0.8 + Math.random() * 0.4;
        const currentSpeed = baseSpeed * s.stamina * dt;
        
        const dx = currentTarget.x - pos.x; const dy = currentTarget.y - pos.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        let nextX = pos.x; let nextY = pos.y;
        
        if (distToTarget <= currentSpeed) {
            nextX = currentTarget.x; nextY = currentTarget.y;
            s.segment = (s.segment + 1) % 8;
        } else {
            nextX += (dx / distToTarget) * currentSpeed;
            nextY += (dy / distToTarget) * currentSpeed;
        }

        // Finish Logic
        if (s.segment === 0 && pos.x < finishLineX && nextX >= finishLineX) {
            s.lapCount++;
            if (s.lapCount >= TOTAL_LAPS) { 
                s.finished = true; 
                onFinish(index); 
            }
        }
        
        setPos({ x: nextX, y: nextY });
        runnersData.current[index] = { x: nextX, y: nextY, lane: s.currentLane, finished: s.finished };
        if (onPositionUpdate) onPositionUpdate({ x: nextX, y: nextY });
    });

    return (
        <HorseSprite
            x={pos.x}
            y={pos.y}
            scale={0.65} 
            tint={color}
            number={index + 1}
            segment={state.current.segment} 
        />
    );
}