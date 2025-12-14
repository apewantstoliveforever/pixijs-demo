"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Application, extend, useTick } from "@pixi/react";
import { Container, Graphics, Text, Ticker } from "pixi.js";
import { SquareRunner } from "./SquareRunner";

// Đăng ký các component Pixi
extend({ Container, Graphics, Text });

// --- CẤU HÌNH ---
const totalLanes = 15;
const laneWidth = 30;
const CORNER_SIZE = 500; 
const INNER_PADDING_LANES = 3; 
const BASE_ZOOM_LEVEL = 1.4; 

// Kích thước đường đua
const path = { left: 400, top: 400, right: 4500, bottom: 2000 };
const edgeLength = path.right - path.left;
const START_LINE_X = path.left + (edgeLength * 0.5);
const FINISH_LINE_X = path.left + (edgeLength * 0.25);
const INNER_Y = path.top - (INNER_PADDING_LANES * laneWidth);
const OUTER_Y = path.top - ((totalLanes + INNER_PADDING_LANES) * laneWidth);

// --- HÀM HỖ TRỢ ---
function hslToHex(h: number, s: number, l: number) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return parseInt(`0x${f(0)}${f(8)}${f(4)}`);
}

function useWindowSize() {
    const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
    useEffect(() => {
        function handleResize() { setWindowSize({ width: window.innerWidth, height: window.innerHeight }); }
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return windowSize;
}

// --- INTERFACES ---
interface RaceResult { laneIndex: number; time: string; rank: number; }
interface RaceSceneProps {
    focusedLane: number;
    colors: number[];
    onFinish: (result: RaceResult) => void;
    startTime: number | null;
    screenW: number;
    screenH: number;
}

// --- COMPONENT MÀN HÌNH ĐUA (RaceScene) ---
const RaceScene = ({ focusedLane, colors, onFinish, startTime, screenW, screenH }: RaceSceneProps) => {
    // Refs
    const runnersData = useRef<any[]>(new Array(totalLanes).fill({ x: 0, y: 0, lane: 0, finished: false }));
    const initialFocusPos = { x: START_LINE_X, y: path.top - (((focusedLane + INNER_PADDING_LANES) * laneWidth) + (laneWidth / 2)) };
    const cameraTargetPos = useRef(initialFocusPos);
    const worldContainerRef = useRef<Container>(null);

    // Camera Logic
    useTick((ticker: Ticker) => {
        if (!worldContainerRef.current) return;
        const container = worldContainerRef.current;
        const dt = ticker.deltaTime;
        
        const mobileScaleFactor = Math.min(screenW / 1000, 1); 
        const currentZoom = Math.max(BASE_ZOOM_LEVEL * mobileScaleFactor, 1.0);

        container.scale.set(currentZoom);

        const targetX = (screenW / 2) - (cameraTargetPos.current.x * currentZoom);
        const targetY = (screenH / 2) - (cameraTargetPos.current.y * currentZoom);

        container.x += (targetX - container.x) * 0.1 * dt;
        container.y += (targetY - container.y) * 0.1 * dt;
    });

    const drawLine = useCallback((g: Graphics, laneIndexFromCenter: number, color: number, alpha: number, thickness: number) => {
        g.clear();
        const offset = laneIndexFromCenter * laneWidth;
        const L = path.left - offset; const R = path.right + offset;
        const T = path.top - offset; const B = path.bottom + offset; const C = CORNER_SIZE;
        g.lineStyle(thickness, color, alpha);
        g.moveTo(L + C, T); g.lineTo(R - C, T); g.lineTo(R, T + C);
        g.lineTo(R, B - C); g.lineTo(R - C, B); g.lineTo(L + C, B);
        g.lineTo(L, B - C); g.lineTo(L, T + C); g.lineTo(L + C, T);
    }, []);

    const drawInnerBarrier = useCallback((g: Graphics) => {
        g.clear();
        const offset = (INNER_PADDING_LANES * laneWidth) - 8; 
        const L = path.left - offset; const R = path.right + offset;
        const T = path.top - offset; const B = path.bottom + offset; const C = CORNER_SIZE;
        g.beginFill(0x1a472a); 
        g.lineStyle(4, 0xffffff, 0.8);
        g.moveTo(L + C, T); g.lineTo(R - C, T); g.lineTo(R, T + C);
        g.lineTo(R, B - C); g.lineTo(R - C, B); g.lineTo(L + C, B);
        g.lineTo(L, B - C); g.lineTo(L, T + C); g.lineTo(L + C, T);
        g.endFill();
    }, []);

    const drawFinishLine = useCallback((g: Graphics) => {
        g.clear();
        g.moveTo(FINISH_LINE_X, INNER_Y); g.lineTo(FINISH_LINE_X, OUTER_Y);
        g.stroke({ width: 8, color: 0xff0000, alpha: 0.8 });
    }, []);

    const drawStartLine = useCallback((g: Graphics) => {
        g.clear();
        g.moveTo(START_LINE_X, INNER_Y); g.lineTo(START_LINE_X, OUTER_Y);
        g.stroke({ width: 4, color: 0x00ff00, alpha: 0.6 });
    }, []);

    return (
        <pixiContainer ref={worldContainerRef}>
            <pixiGraphics draw={(g) => { g.clear(); g.beginFill(0x2d3748); g.drawRect(path.left - 4000, path.top - 4000, path.right + 8000, path.bottom + 8000); g.endFill(); }} />
            <pixiGraphics draw={drawInnerBarrier} />
            {Array.from({ length: totalLanes + 1 }).map((_, i) => (
                <pixiGraphics key={`line-${i}`} draw={(g) => drawLine(g, i + INNER_PADDING_LANES, 0xffffff, 0.3, 1)} />
            ))}
            <pixiGraphics draw={drawStartLine} />
            <pixiGraphics draw={drawFinishLine} />
            
            {colors.map((color, i) => (
                <SquareRunner
                    key={`runner-${i}`}
                    index={i}
                    path={path}
                    laneWidth={laneWidth}
                    totalLanes={totalLanes}
                    cornerSize={CORNER_SIZE}
                    color={color}
                    raceState={startTime ? "running" : "countdown"} 
                    runnersData={runnersData}
                    startLineX={START_LINE_X}
                    finishLineX={FINISH_LINE_X}
                    offsetLane={INNER_PADDING_LANES} 
                    onFinish={(laneIdx: number) => {
                        if (startTime) {
                            const duration = (Date.now() - startTime) / 1000;
                            onFinish({ laneIndex: laneIdx, time: duration.toFixed(2), rank: 0 });
                        }
                    }}
                    onPositionUpdate={i === focusedLane ? (pos: {x:number, y:number}) => { cameraTargetPos.current = pos; } : undefined}
                />
            ))}
        </pixiContainer>
    );
};

// --- COMPONENT CHÍNH ---
export default function TrackSquareRace() {
    const { width, height } = useWindowSize();
    const colors = useMemo(() => Array.from({ length: totalLanes }, (_, i) => hslToHex((i * 360) / totalLanes, 80, 50)), []);
    
    // --- QUẢN LÝ TRẠNG THÁI GAME ---
    const [raceId, setRaceId] = useState(0); 
    const [focusedLane, setFocusedLane] = useState(Math.floor(totalLanes / 2));
    const [raceState, setRaceState] = useState<"betting" | "countdown" | "running" | "finished">("betting");
    const [countdown, setCountdown] = useState(3);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [leaderboard, setLeaderboard] = useState<RaceResult[]>([]);

    // --- QUẢN LÝ TIỀN & CƯỢC ---
    const [balance, setBalance] = useState(1000);
    const [betAmount, setBetAmount] = useState(100);
    const [activeBet, setActiveBet] = useState<{ lane: number; amount: number; odds: number } | null>(null);
    const [winMessage, setWinMessage] = useState<{ amount: number } | null>(null);

    // --- TẠO ODDS MỚI ---
    const fixedOdds = useMemo(() => {
        if (raceId < 0) return []; // Just to depend on raceId
        return Array.from({ length: totalLanes }, () => (Math.random() * 7.5 + 1.5).toFixed(1));
    }, [raceId]); 

    // --- ĐẾM NGƯỢC ---
    useEffect(() => {
        if (raceState !== "countdown") return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setStartTime(Date.now());
                    setRaceState("running");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [raceState]);

    // --- XỬ LÝ KHI NGỰA VỀ ĐÍCH ---
    const handleHorseFinish = (result: RaceResult) => {
        setLeaderboard(prev => {
            if (prev.find(p => p.laneIndex === result.laneIndex)) return prev;
            
            const newRank = prev.length + 1;
            const newLeaderboard = [...prev, { ...result, rank: newRank }];

            // 1. TRẢ THƯỞNG
            if (newRank === 1) {
                if (activeBet && activeBet.lane === result.laneIndex) {
                    const profit = Math.floor(activeBet.amount * activeBet.odds);
                    setBalance(b => b + profit);
                    setWinMessage({ amount: profit });
                }
            }

            // 2. QUAN TRỌNG: KIỂM TRA KẾT THÚC ĐUA
            // Nếu đủ ngựa HOẶC đã có người về nhất (để mở khóa nút Reset sớm)
            if (newRank >= totalLanes) {
                setRaceState("finished");
            }

            return newLeaderboard;
        });
    };

    // --- HÀNH ĐỘNG ĐẶT CƯỢC ---
    const handlePlaceBet = () => {
        if (balance >= betAmount && betAmount > 0) {
            setBalance(prev => prev - betAmount);
            setActiveBet({ 
                lane: focusedLane, 
                amount: betAmount, 
                odds: parseFloat(fixedOdds[focusedLane]) 
            });
            setRaceState("countdown"); 
        }
    };

    const handleSkipBet = () => {
        setRaceState("countdown");
    }

    // --- RESET GAME ---
    const handleReset = () => {
        if (balance < 10) {
            alert("Bạn đã cháy túi! Tặng bạn $1000 để gỡ gạc.");
            setBalance(1000);
        }
        
        setBetAmount(prev => Math.min(prev, balance < 10 ? 1000 : balance));
        setRaceState("betting");
        setLeaderboard([]);
        setStartTime(null);
        setCountdown(3);
        setActiveBet(null);
        setWinMessage(null);
        setFocusedLane(Math.floor(totalLanes / 2));
        setRaceId(prev => prev + 1); 
    };

    // Điều kiện mở khóa nút NEW RACE: Đã xong hoặc ít nhất có 1 người về đích
    const canReset = raceState === 'finished' || leaderboard.length > 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden relative font-sans touch-none select-none">
            <Application width={width} height={height} backgroundColor={0x111827} resolution={window.devicePixelRatio || 1}>
                <RaceScene 
                    key={raceId} 
                    focusedLane={focusedLane} 
                    colors={colors} 
                    onFinish={handleHorseFinish}
                    startTime={startTime}
                    screenW={width}
                    screenH={height}
                />
            </Application>

            {/* VÍ TIỀN */}
            <div className="absolute top-4 left-4 z-50 bg-black/60 backdrop-blur-md border border-yellow-500/50 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
                <span className="text-2xl">💰</span>
                <span className="text-xl font-bold text-yellow-400 font-mono">${balance.toLocaleString()}</span>
                {activeBet && (
                    <div className="flex items-center gap-2 border-l border-white/20 pl-3 ml-1 text-xs sm:text-sm">
                        <span className="text-gray-400">BET:</span>
                        <span className="font-bold text-red-400">-${activeBet.amount}</span>
                        <span className="text-gray-400">ON #{activeBet.lane + 1}</span>
                    </div>
                )}
            </div>

            {/* THÔNG BÁO THẮNG */}
            {winMessage && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
                    <div className="bg-green-600/90 border-4 border-green-400 px-8 py-4 rounded-3xl shadow-[0_0_50px_rgba(0,255,0,0.5)] text-center backdrop-blur-md">
                        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase drop-shadow-md">YOU WON!</h2>
                        <p className="text-xl sm:text-3xl font-mono font-bold text-yellow-300 mt-2">+${winMessage.amount}</p>
                    </div>
                </div>
            )}

            {/* ĐẾM NGƯỢC */}
            {raceState === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <span className="font-black text-yellow-400 drop-shadow-lg animate-pulse" style={{ fontSize: Math.min(width, height) * 0.4 }}>{countdown}</span>
                </div>
            )}

            {/* BẢNG XẾP HẠNG */}
            {leaderboard.length > 0 && (
                <div className="absolute top-20 right-4 z-40 w-48 sm:w-64 max-h-[40vh] sm:max-h-[600px] flex flex-col items-end">
                    <div className="bg-black/80 backdrop-blur-md border border-white/20 p-2 sm:p-4 rounded-xl shadow-2xl overflow-y-auto w-full no-scrollbar">
                        <h3 className="text-yellow-400 font-bold text-sm sm:text-xl mb-2 text-center uppercase border-b border-white/10 pb-1">Rank</h3>
                        <div className="space-y-1 sm:space-y-2">
                            {leaderboard.map((item) => (
                                <div key={item.laneIndex} className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg ${item.rank === 1 ? 'bg-yellow-900/50 border border-yellow-500/50' : 'bg-white/5'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${item.rank === 1 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>{item.rank}</span>
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white/50" style={{ backgroundColor: `#${colors[item.laneIndex].toString(16)}` }}></div>
                                        <span className="font-bold text-xs sm:text-sm">#{item.laneIndex + 1}</span>
                                    </div>
                                    <span className="font-mono text-[10px] sm:text-xs text-green-400">{item.time}s</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTROL BAR */}
            <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none pb-safe-area">
                <div className="bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent pt-8 pb-4 px-2 sm:px-6 pointer-events-auto flex flex-col gap-3">
                    
                    {/* CHỌN NGỰA */}
                    <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
                        <div className="flex-1 overflow-x-auto no-scrollbar mask-gradient-x">
                            <div className="flex gap-2 px-2 py-3 min-w-max">
                                {colors.map((color, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setFocusedLane(i)}
                                        disabled={raceState === 'running' || raceState === 'countdown'}
                                        className="relative w-12 h-12 rounded-full font-bold text-sm border-2 transition-all active:scale-95 flex-shrink-0 flex items-center justify-center shadow-lg group"
                                        style={{
                                            backgroundColor: i === focusedLane ? `#${color.toString(16)}` : 'rgba(40,40,40,0.8)',
                                            borderColor: `#${color.toString(16)}`,
                                            color: i === focusedLane ? '#000' : '#fff',
                                            transform: i === focusedLane ? 'scale(1.15) translateY(-5px)' : 'scale(1)',
                                            opacity: (raceState === 'running' && leaderboard.find(l => l.laneIndex === i)) ? 0.4 : 1,
                                            cursor: (raceState === 'running' || raceState === 'countdown') ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {i + 1}
                                        {fixedOdds[i] && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-1.5 py-0.5 rounded-full font-black shadow-sm border border-black/20 z-10 whitespace-nowrap">
                                                x{fixedOdds[i]}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ACTION PANEL */}
                    {raceState === 'betting' ? (
                        <div className="w-full max-w-md mx-auto bg-gray-800/90 border border-gray-600 rounded-xl p-3 shadow-2xl backdrop-blur-md mb-2 animate-slide-up">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400 text-xs uppercase font-bold">Bet Amount</span>
                                <span className="text-yellow-400 text-xs font-bold">Max: ${balance}</span>
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={betAmount} 
                                    onChange={(e) => setBetAmount(Math.min(Math.max(0, Number(e.target.value)), balance))}
                                    className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-3 text-white font-mono text-center focus:outline-none focus:border-yellow-500"
                                    placeholder="Amount"
                                />
                                <button 
                                    onClick={handlePlaceBet}
                                    disabled={betAmount > balance || betAmount <= 0}
                                    className="flex-[2] bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-black uppercase rounded-lg shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 py-3 text-sm sm:text-base"
                                >
                                    START / BET
                                </button>
                                <button onClick={handleSkipBet} className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg text-xs">
                                    SKIP
                                </button>
                            </div>
                            <div className="text-center mt-2 text-[10px] text-gray-400">
                                Potential Win: <span className="text-green-400 font-bold">${Math.floor(betAmount * parseFloat(fixedOdds[focusedLane] || "0"))}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-4 pb-2">
                            <button onClick={() => setFocusedLane(Math.floor(totalLanes / 2))} className="flex-1 max-w-[140px] py-3 bg-gray-700 active:bg-gray-600 rounded-xl text-xs sm:text-sm font-bold border border-gray-500 shadow-lg">
                                👁️ CENTER
                            </button>
                            <button 
                                className={`flex-1 max-w-[140px] py-3 rounded-xl text-xs sm:text-sm font-bold border shadow-lg ${canReset ? 'bg-yellow-600 active:bg-yellow-500 text-black border-yellow-400 animate-pulse' : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'}`} 
                                onClick={handleReset}
                                disabled={!canReset}
                            >
                                🔄 NEW RACE
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}