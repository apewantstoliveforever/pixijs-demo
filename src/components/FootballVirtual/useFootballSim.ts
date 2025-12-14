import { useState, useCallback, useRef } from 'react';
import { 
    PITCH_WIDTH, PITCH_HEIGHT, GOAL_SIZE, 
    PLAYER_SPEED, SPRINT_SPEED, BALL_FRICTION, 
    PASS_POWER, SHOOT_POWER, INTERCEPT_RANGE,
    PlayerEntity 
} from './FMConstants';

export type MatchState = 'betting' | 'playing' | 'finished';
export type BetType = 'HOME' | 'DRAW' | 'AWAY' | null;
export type GameFlowState = 'kickoff' | 'throwin' | 'corner' | 'goalie' | 'play';

interface Player extends PlayerEntity {
    passSkill: number; // Kỹ năng chuyền bóng (0.0 đến 1.0)
    defensiveAwareness: number; // Khả năng phòng ngự và đọc tình huống
}


export const useFootballSim = () => {
    const [matchState, setMatchState] = useState<MatchState>('betting');
    const [time, setTime] = useState(0);
    const [score, setScore] = useState({ home: 0, away: 0 });
    const [commentary, setCommentary] = useState("Place your bets!");
    
    const [balance, setBalance] = useState(1000);
    const [betAmount, setBetAmount] = useState(0);
    const [selectedBet, setSelectedBet] = useState<BetType>(null);
    
    const [gameFlow, setGameFlow] = useState<GameFlowState>('kickoff'); 
    const [setPieceTeam, setSetPieceTeam] = useState<'HOME' | 'AWAY'>('HOME');
    const [setPiecePos, setSetPiecePos] = useState({ x: PITCH_WIDTH/2, y: PITCH_HEIGHT/2 });


    const playersRef = useRef<Player[]>([]);
    const ballRef = useRef({ 
        x: PITCH_WIDTH/2, y: PITCH_HEIGHT/2, 
        owner: -1, 
        vx: 0, vy: 0 
    });
    
    const gkDelayRef = useRef(0); 

    // --- HÀM HELPER: TÌM TIỀN VỆ ĐỂ GIAO BÓNG ---
    const findMidfielderForKickoff = (team: 'HOME' | 'AWAY', allPlayers: Player[]) => {
        return allPlayers.filter(p => p.team === team && p.role === 'MID')
                         .sort((a, b) => Math.hypot(PITCH_WIDTH/2 - a.x, PITCH_HEIGHT/2 - a.y) - Math.hypot(PITCH_WIDTH/2 - b.x, PITCH_HEIGHT/2 - b.y))[0];
    };

    // --- INIT TEAMS (11 vs 11 - Sơ đồ 4-3-3 cơ bản) ---
    const initTeams = useCallback(() => {
        const p: Player[] = [];

        const createPlayer = (id: number, team: 'HOME' | 'AWAY', role: 'GK' | 'DEF' | 'MID' | 'FWD', x: number, y: number): Player => {
            let dribbleSkill = 0.5, passSkill = 0.5, defensiveAwareness = 0.5;

            switch(role) {
                case 'GK':
                    dribbleSkill = 0.1; passSkill = 0.7; defensiveAwareness = 0.9; break;
                case 'DEF':
                    dribbleSkill = 0.3; passSkill = 0.6; defensiveAwareness = 1.0; break;
                case 'MID':
                    dribbleSkill = 0.8; passSkill = 0.9; defensiveAwareness = 0.7; 
                    dribbleSkill += (Math.random() - 0.5) * 0.1;
                    passSkill += (Math.random() - 0.5) * 0.1;
                    defensiveAwareness += (Math.random() - 0.5) * 0.1;
                    break; 
                case 'FWD':
                    dribbleSkill = 1.0; passSkill = 0.6; defensiveAwareness = 0.4; 
                    dribbleSkill += (Math.random() - 0.5) * 0.1;
                    passSkill += (Math.random() - 0.5) * 0.1;
                    defensiveAwareness += (Math.random() - 0.5) * 0.1;
                    break;
            }
            // Giới hạn chỉ số trong [0.1, 1.0]
            dribbleSkill = Math.max(0.1, Math.min(1.0, dribbleSkill));
            passSkill = Math.max(0.1, Math.min(1.0, passSkill));
            defensiveAwareness = Math.max(0.1, Math.min(1.0, defensiveAwareness));


            return { id, team, role, x, y, startX: x, startY: y, cooldown: 0, dribbleSkill, passSkill, defensiveAwareness };
        };

        // HOME (Đá từ Trái sang Phải)
        p.push(createPlayer(0, 'HOME', 'GK', 40, PITCH_HEIGHT/2));
        p.push(createPlayer(1, 'HOME', 'DEF', 150, 100));
        p.push(createPlayer(2, 'HOME', 'DEF', 150, 200));
        p.push(createPlayer(3, 'HOME', 'DEF', 150, 300));
        p.push(createPlayer(4, 'HOME', 'DEF', 150, 400));
        p.push(createPlayer(5, 'HOME', 'MID', 350, 150));
        p.push(createPlayer(6, 'HOME', 'MID', 350, PITCH_HEIGHT/2));
        p.push(createPlayer(7, 'HOME', 'MID', 350, 350));
        p.push(createPlayer(8, 'HOME', 'FWD', 550, 150));
        p.push(createPlayer(9, 'HOME', 'FWD', 550, PITCH_HEIGHT/2));
        p.push(createPlayer(10, 'HOME', 'FWD', 550, 350));

        // AWAY (Đá từ Phải sang Trái)
        p.push(createPlayer(11, 'AWAY', 'GK', PITCH_WIDTH-40, PITCH_HEIGHT/2));
        p.push(createPlayer(12, 'AWAY', 'DEF', PITCH_WIDTH-150, 100));
        p.push(createPlayer(13, 'AWAY', 'DEF', PITCH_WIDTH-150, 200));
        p.push(createPlayer(14, 'AWAY', 'DEF', PITCH_WIDTH-150, 300));
        p.push(createPlayer(15, 'AWAY', 'DEF', PITCH_WIDTH-150, 400));
        p.push(createPlayer(16, 'AWAY', 'MID', PITCH_WIDTH-350, 150));
        p.push(createPlayer(17, 'AWAY', 'MID', PITCH_WIDTH-350, PITCH_HEIGHT/2));
        p.push(createPlayer(18, 'AWAY', 'MID', PITCH_WIDTH-350, 350));
        p.push(createPlayer(19, 'AWAY', 'FWD', PITCH_WIDTH-550, 150));
        p.push(createPlayer(20, 'AWAY', 'FWD', PITCH_WIDTH-550, PITCH_HEIGHT/2));
        p.push(createPlayer(21, 'AWAY', 'FWD', PITCH_WIDTH-550, 350));

        playersRef.current = p;
        ballRef.current = { x: PITCH_WIDTH/2, y: PITCH_HEIGHT/2, owner: -1, vx: 0, vy: 0 };
    }, []);
    

    // --- HÀM HELPER CHUYỀN/SÚT/TẠT ---
    const passOrCross = (me: Player, targetX: number, targetY: number, power: number) => {
        ballRef.current.owner = -1;
        me.cooldown = 20;

        const distToTarget = Math.hypot(targetY - me.y, targetX - me.x);
        const enemyNear = playersRef.current.some(p => p.team !== me.team && Math.hypot(p.x - me.x, p.y - me.y) < 40); 

        // Sai số dựa trên Kỹ năng chuyền và khoảng cách
        let baseError = 50 * (power / PASS_POWER); 
        baseError += distToTarget * 0.2; 
        
        // TĂNG GẤP ĐÔI sai số nếu bị áp sát (Áp lực -> lỗi)
        if (enemyNear) {
            baseError *= 2.0; 
        }

        // Giảm sai số theo kỹ năng chuyền (passSkill)
        const skillFactor = 1.0 - me.passSkill * 0.5; 
        const finalError = baseError * skillFactor;

        const errorX = (Math.random() - 0.5) * finalError;
        const errorY = (Math.random() - 0.5) * finalError;

        const angle = Math.atan2((targetY + errorY) - me.y, (targetX + errorX) - me.x);

        // Lực chuyền tỉ lệ với khoảng cách (min 0.5 * PASS_POWER, max 1.2 * PASS_POWER)
        const normalizedDist = Math.min(distToTarget, 500) / 500; 
        const dynamicPower = power * (0.5 + normalizedDist * 0.7);

        ballRef.current.vx = Math.cos(angle) * dynamicPower;
        ballRef.current.vy = Math.sin(angle) * dynamicPower;

        if (me.role === 'GK') {
            gkDelayRef.current = 0;
        }
    };

    // --- HÀM KIỂM TRA ĐƯỜNG CHUYỀN AN TOÀN ---
    const isPassSafe = (me: Player, target: Player, allPlayers: Player[]) => {
        const minEnemyDistance = 40; 

        for (const enemy of allPlayers.filter(p => p.team !== me.team)) {
            const distToPassLine = Math.abs((target.y - me.y) * enemy.x - (target.x - me.x) * enemy.y + target.x * me.y - target.y * me.x) /
                                   Math.hypot(target.y - me.y, target.x - me.x);

            const isBetween = (enemy.x > Math.min(me.x, target.x) - 20 && enemy.x < Math.max(me.x, target.x) + 20) &&
                              (enemy.y > Math.min(me.y, target.y) - 20 && enemy.y < Math.max(me.y, target.y) + 20);

            if (distToPassLine < minEnemyDistance && isBetween) {
                return false;
            }
        }
        return true;
    };


    // --- LOGIC CHÍNH ---
    const updateGame = useCallback((deltaTime: number) => {
        if (matchState !== 'playing') return;

        if (Math.random() > 0.95) setTime(prev => {
            if (prev >= 90) { endMatch(); return 90; }
            return prev + 1;
        });

        const ball = ballRef.current;
        const players = playersRef.current;
        const currentOwner = players.find(p => p.id === ball.owner);

        if (currentOwner?.role === 'GK' && gkDelayRef.current > 0) {
            gkDelayRef.current = Math.max(0, gkDelayRef.current - 1);
        }

        // --- Xử lý tình huống cố định ---
        if (gameFlow !== 'play' && gameFlow !== 'goalie') {
            if (currentOwner && currentOwner.team === setPieceTeam) {
                decideSetPiece(currentOwner, players, ball, gameFlow);
            }
        }

        // --- Chạy vật lý và AI thường ---
        if (gameFlow === 'play' || gameFlow === 'goalie') {

            // 1. Cập nhật vật lý Bóng
            if (ball.owner === -1) {
                ball.x += ball.vx * deltaTime;
                ball.y += ball.vy * deltaTime;
                ball.vx *= BALL_FRICTION;
                ball.vy *= BALL_FRICTION;

                const ballOutTop = ball.y < 5;
                const ballOutBottom = ball.y > PITCH_HEIGHT - 5;


                if (ballOutTop || ballOutBottom) {
                    if (Math.abs(ball.vx) > 0.5 || Math.abs(ball.vy) > 0.5) {
                        const throwInTeam = ballOutTop ? (ball.vx > 0 ? 'AWAY' : 'HOME') : (ball.vx < 0 ? 'AWAY' : 'HOME');
                        const throwInY = ballOutTop ? 10 : PITCH_HEIGHT - 10;
                        resetGameFlow('throwin', throwInTeam, { x: ball.x, y: throwInY });
                        return;
                    }
                    ball.vy *= -1;
                }
            } else {
                if (currentOwner && currentOwner.role === 'GK') {
                    ball.x = currentOwner.x;
                    ball.y = currentOwner.y;
                    ball.vx = 0; ball.vy = 0;
                } else if (currentOwner) {
                    const offset = currentOwner.team === 'HOME' ? 6 : -6;
                    ball.x = currentOwner.x + offset;
                    ball.y = currentOwner.y;
                    ball.vx = 0; ball.vy = 0;
                }
            }

            // 2. Logic từng Cầu thủ 
            players.forEach(p => {
                const isTackleAttempt = p.cooldown === 40; 
                
                if (p.cooldown > 0) p.cooldown--;

                if (ball.owner === p.id) {
                    decideWithBall(p, players, ball);
                } else {
                    decideWithoutBall(p, players, ball, deltaTime);
                }

                // Cướp bóng & Nhặt bóng
                if (ball.owner !== p.id && ball.owner !== -1) {
                    const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                    const owner = players.find(o => o.id === ball.owner);

                    const isInPenaltyArea = (owner!.team === 'HOME' && owner!.x < 10 + 120) || (owner!.team === 'AWAY' && owner!.x > PITCH_WIDTH - 10 - 120);

                    if (owner && owner.team !== p.team && ! (owner.role === 'GK' && isInPenaltyArea) ) {
                        
                        // NGĂN CHẶN TACKLE PING-PONG: Người cầm bóng vừa lấy được/bị mất bóng không thể bị cướp lại ngay.
                        if (owner.cooldown > 10) {
                            return; 
                        }
                        
                        // Tăng phạm vi đánh chặn cho DefensiveAwareness cao
                        const effectiveInterceptRange = INTERCEPT_RANGE + (p.defensiveAwareness * 5); 
                        
                        const tackleAdvantage = p.defensiveAwareness * (p.role === 'DEF' || p.role === 'MID' ? 1.5 : 1.0);
                        let stealChance = 0.05 * tackleAdvantage * (1.0 - owner.dribbleSkill / 2);

                        // TĂNG CƠ HỘI CƯỚP BÓNG nếu cầu thủ vừa Dấn thân vào Tackle
                        if (isTackleAttempt) { 
                            stealChance *= 3.0; 
                        }

                        if (dist < effectiveInterceptRange && Math.random() < stealChance) {
                            // TACKLE/STEAL THÀNH CÔNG
                            ball.owner = p.id;
                            setCommentary(`${p.team} Player ${p.id} executes a decisive TACKLE!`);
                            
                            // Người cướp được bóng có lợi thế xử lý
                            p.cooldown = 10; 
                            owner.cooldown = 60; // Người mất bóng bị choáng
                            
                        } else if (isTackleAttempt) {
                            // TACKLE THẤT BẠI - HÌNH PHẠT CỰC LỚN VÀ ĐẨY VĂNG RA
                            setCommentary(`${p.team} Player ${p.id} missed the tackle badly!`);
                            p.cooldown = 150; // 2.5 giây mất đà
                            
                            // Áp dụng lực đẩy cơ học (IMPULSE) cho cầu thủ thất bại
                            if (owner) {
                                const angleToOwner = Math.atan2(owner.y - p.y, owner.x - p.x);
                                const IMPULSE_FORCE = 30; 
                                p.x -= Math.cos(angleToOwner) * IMPULSE_FORCE; 
                                p.y -= Math.sin(angleToOwner) * IMPULSE_FORCE;
                            }
                        }
                    }
                }
                else if (ball.owner === -1 && p.cooldown === 0) {
                    const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
                    if (dist < 15) {
                        ball.owner = p.id;
                        if (p.role === 'GK') {
                            gkDelayRef.current = 90;
                        }
                    }
                }
            });
        }

        checkGoal();
    }, [matchState, score, gameFlow]); // eslint-disable-line

    // --- HÀM XỬ LÝ SET PIECE (Giữ nguyên) ---
    const handleSetPiecePass = (me: Player, targetX: number, targetY: number, power: number, comment: string) => {
        const dynamicPower = power * (1.0 + Math.random() * 0.2); 

        passOrCross(me, targetX, targetY, dynamicPower);
        setCommentary(comment);
        setGameFlow('play'); 
    }

    const decideSetPiece = (me: Player, allPlayers: Player[], ball: any, flow: GameFlowState) => {
        const teammates = allPlayers.filter(p => p.team === me.team && p.id !== me.id);
        const targetX = setPiecePos.x;
        const targetY = setPiecePos.y;
        
        if (Math.hypot(targetX - me.x, targetY - me.y) > 20) {
            const angle = Math.atan2(targetY - me.y, targetX - me.x);
            const moveDist = Math.hypot(targetY - me.y, targetX - me.x); 
            const currentSpeed = Math.min(PLAYER_SPEED * 1.5, moveDist);

            me.x += Math.cos(angle) * currentSpeed;
            me.y += Math.sin(angle) * currentSpeed;
            return;
        }
        
        const safeTarget = teammates
            .filter(tm => isPassSafe(me, tm, allPlayers))
            .sort((a, b) => {
                const forwardProgressA = me.team === 'HOME' ? a.x : PITCH_WIDTH - a.x;
                const forwardProgressB = me.team === 'HOME' ? b.x : PITCH_WIDTH - b.x;
                return forwardProgressB - forwardProgressA; 
            })[0];
            
        if (flow === 'throwin') {
            if (safeTarget) {
                handleSetPiecePass(me, safeTarget.x, safeTarget.y, PASS_POWER * 1.5, `${me.team} throw-in to ${safeTarget.role}.`);
            } else {
                handleSetPiecePass(me, targetX + (me.team === 'HOME' ? 150 : -150), targetY, PASS_POWER * 1.8, `${me.team} throw-in long.`);
            }
        } else if (flow === 'corner') {
            const crossTargetX = me.team === 'HOME' ? PITCH_WIDTH * 0.9 : PITCH_WIDTH * 0.1;
            const crossTargetY = PITCH_HEIGHT / 2 + (Math.random() * 80 - 40);
            handleSetPiecePass(me, crossTargetX, crossTargetY, SHOOT_POWER * 0.7, `${me.team} crosses from the corner!`);
        } else if (flow === 'kickoff') {
             const passTarget = teammates.find(p => p.role === 'MID' && p.startY === me.startY);
             if (passTarget) {
                handleSetPiecePass(me, passTarget.x, passTarget.y, PASS_POWER * 0.5, `${me.team} starts the play.`);
             }
        }
    }


    // --- AI: QUYẾT ĐỊNH KHI CÓ BÓNG (PASSING OPTIMIZATION) ---
    const decideWithBall = (me: Player, allPlayers: Player[], ball: any) => {
        
        if (me.role === 'GK') {
             if (gkDelayRef.current > 0) {
                 const direction = me.team === 'HOME' ? 1 : -1;
                 me.x += direction * PLAYER_SPEED * 0.1;
                 me.y += (Math.random() - 0.5) * 1;
                 me.x = Math.max(10, Math.min(me.team === 'HOME' ? 50 : PITCH_WIDTH - 50, me.x));
                 return;
             }

             const teammates = allPlayers.filter(p => p.team === me.team && p.id !== me.id);
             const bestTarget = teammates.sort((a, b) => {
                 const roleA = a.role === 'DEF' ? 1000 : (a.role === 'MID' ? 500 : 0);
                 const roleB = b.role === 'DEF' ? 1000 : (b.role === 'MID' ? 500 : 0);
                 const safeA = isPassSafe(me, a, allPlayers) ? 1000 : 0; 
                 const safeB = isPassSafe(me, b, allPlayers) ? 1000 : 0;
                 const distanceA = Math.hypot(me.x - a.x, me.y - a.y);
                 const distanceB = Math.hypot(me.x - b.x, me.y - b.y);
                 return (roleB + safeB - distanceB) - (roleA + safeA - distanceA); 
             })[0];

             if (bestTarget && bestTarget.role !== 'GK') { 
                 passOrCross(me, bestTarget.x, bestTarget.y, PASS_POWER * 1.5);
                 setCommentary(`${me.team} GK passes the ball to ${bestTarget.role}.`);
                 setGameFlow('play');
                 return;
             } else {
                const midX = me.team === 'HOME' ? PITCH_WIDTH * 0.4 : PITCH_WIDTH * 0.6;
                passOrCross(me, midX, PITCH_HEIGHT/2, SHOOT_POWER * 1.2);
                setCommentary(`${me.team} GK launches the ball forward.`);
                setGameFlow('play');
                return;
             }
        }

        // --- LOGIC CẦU THỦ THƯỜNG ---
        const enemyGoalX = me.team === 'HOME' ? PITCH_WIDTH : 0;
        const distToGoal = Math.hypot(enemyGoalX - me.x, PITCH_HEIGHT/2 - me.y);
        const enemyNear = allPlayers.some(p => p.team !== me.team && Math.hypot(p.x - me.x, p.y - me.y) < 40);
        const teammates = allPlayers.filter(p => p.team === me.team && p.id !== me.id);
        const allPlayersArray = playersRef.current;


        // 1. SÚT GÔN (SHOOTING LOGIC)
        if (distToGoal < 150) {
            if (Math.random() < 0.8) { 
                passOrCross(me, enemyGoalX, PITCH_HEIGHT/2, SHOOT_POWER * 1.2); 
                setCommentary(`${me.team} Player ${me.id} takes a close-range shot!`);
                return;
            }
        }
        else if (distToGoal < 300 && !enemyNear) {
            const shotAggression = (me.role === 'FWD' || me.role === 'MID') ? 0.15 : 0.05;
            if (Math.random() < shotAggression) {
                passOrCross(me, enemyGoalX, PITCH_HEIGHT/2, SHOOT_POWER);
                setCommentary(`${me.team} Player ${me.id} attempts a long shot!`);
                return;
            }
        }

        // 2. TẠT BÓNG (CROSSING LOGIC)
        const isNearWing = me.y < PITCH_HEIGHT * 0.2 || me.y > PITCH_HEIGHT * 0.8;
        const isInAttackingThird = me.team === 'HOME' ? me.x > PITCH_WIDTH * 0.6 : me.x < PITCH_WIDTH * 0.4;
        const FWDsInBox = allPlayersArray.filter(p => p.team === me.team && p.role === 'FWD' &&
             ((me.team === 'HOME' && p.x > PITCH_WIDTH * 0.75) || (me.team === 'AWAY' && p.x < PITCH_WIDTH * 0.25))
        );

        if (isNearWing && isInAttackingThird && FWDsInBox.length > 0 && Math.random() < 0.4) {
            const crossTargetX = me.team === 'HOME' ? PITCH_WIDTH * 0.9 : PITCH_WIDTH * 0.1;
            const crossTargetY = PITCH_HEIGHT / 2 + (Math.random() * 80 - 40);
            passOrCross(me, crossTargetX, crossTargetY, SHOOT_POWER * 0.7);
            setCommentary(`${me.team} sends a cross into the box!`);
            return;
        }

        // 3. CHUYỀN BÓNG (PASSING LOGIC - SCORE BASED)
        const safeTargets = teammates
            .filter(tm => isPassSafe(me, tm, allPlayers))
            .map(tm => {
                let score = 0;
                
                const forwardProgress = me.team === 'HOME' ? (tm.x - me.x) : (me.x - tm.x);
                const distToTarget = Math.hypot(me.x - tm.x, me.y - tm.y);
                const enemyNearTarget = allPlayers.some(p => p.team !== me.team && Math.hypot(p.x - tm.x, p.y - tm.y) < 50);

                // 1. TIẾN ĐỘ (Ưu tiên chuyền về phía trước)
                score += forwardProgress * 3.0; 

                // 2. KHOẢNG TRỐNG (Ưu tiên chuyền cho người đang mở)
                if (!enemyNearTarget) {
                    score += 200; // Điểm thưởng lớn nếu không bị kèm
                }

                // 3. KHUYẾN KHÍCH CHUYỀN VỪA VÀ XA
                if (distToTarget > 100 && distToTarget < 400) {
                    score += distToTarget * 0.5;
                } else if (distToTarget >= 400) {
                    score += 150; // Thưởng khi chuyền rất xa (chuyền vượt tuyến)
                }
                
                // 4. Ưu tiên FWD hơn DEF/MID
                if (tm.role === 'FWD') score += 100;
                
                // Phạt nhẹ nếu chuyền ngược về sân nhà (trừ khi bị áp sát)
                if (forwardProgress < 0 && !enemyNear) score -= 50;


                return { player: tm, score };
            })
            .sort((a, b) => b.score - a.score);


        const bestTargetResult = safeTargets[0];
        const bestTargetPlayer = bestTargetResult?.player;
        const bestScore = bestTargetResult?.score;

        // Bổ sung logic chuyền cho mục tiêu tốt nhất (bestTarget)
        if (bestTargetPlayer && bestScore && bestScore > 50 && Math.random() < 0.9) {
             const power = (bestTargetPlayer.role === 'DEF' || bestTargetPlayer.role === 'MID') ? PASS_POWER * 1.0 : PASS_POWER * 1.3; // FWD nhận bóng mạnh hơn
             passOrCross(me, bestTargetPlayer.x, bestTargetPlayer.y, power);
             setCommentary(`${me.team} makes an intelligent pass to ${bestTargetPlayer.role}.`);
             return;
        } 

        // 4. RÊ DẮT (Dribble)
        const dribbleChance = me.dribbleSkill * 0.9;
        const nearestEnemy = allPlayers
            .filter(p => p.team !== me.team)
            .sort((a, b) => Math.hypot(me.x - a.x, me.y - a.y) - Math.hypot(me.x - b.x, me.y - b.y))[0];

        const enemyDist = nearestEnemy ? Math.hypot(me.x - nearestEnemy.x, me.y - nearestEnemy.y) : Infinity;

        // --- LOGIC QUA NGƯỜI (TAKE-ON) ---
        if (enemyDist < 35 && Math.random() < dribbleChance) {
             // Tăng hiệu quả rê dắt dựa trên Dribble Skill
             const skillFactor = me.dribbleSkill * 1.5; 
             const successRate = skillFactor / (skillFactor + nearestEnemy.defensiveAwareness); // Tăng cường sự ảnh hưởng của chỉ số
             
             if (Math.random() < successRate) {
                 // QUA NGƯỜI THÀNH CÔNG
                 const pushDirection = (Math.random() > 0.5 ? 1 : -1) * 30;
                 const moveDir = me.team === 'HOME' ? 1 : -1;

                 const evasionAngle = Math.atan2(pushDirection, moveDir * 10);

                 me.x += Math.cos(evasionAngle) * SPRINT_SPEED * 0.8;
                 me.y += Math.sin(evasionAngle) * SPRINT_SPEED * 0.8;

                 setCommentary(`${me.team} Player ${me.id} successfully dribbles past ${nearestEnemy.role}!`);
                 nearestEnemy.cooldown = 40;
                 return;

             } else {
                 // QUA NGƯỜI THẤT BẠI - BẮT BUỘC MẤT KIỂM SOÁT BÓNG
                 setCommentary(`${me.team} Player ${me.id} fails the dribble and loses control!`);
                 
                 // 1. Giải phóng bóng
                 ball.owner = -1;
                 
                 // 2. Áp dụng lực đẩy nhỏ cho bóng (Nudge)
                 const pushAngle = Math.atan2(nearestEnemy!.y - me.y, nearestEnemy!.x - me.x); 
                 ball.vx = Math.cos(pushAngle) * 5; 
                 ball.vy = Math.sin(pushAngle) * 5;

                 // 3. Hình phạt cho người rê dắt
                 me.cooldown = 50; 
                 if (nearestEnemy) nearestEnemy.cooldown = 40; 
                 return;
             }
        }
        // --- KẾT THÚC LOGIC QUA NGƯỜI ---


        // Logic Dribble bình thường (tiến lên nếu không bị ai áp sát trực tiếp)
        if (Math.random() < dribbleChance) {
             const moveDir = me.team === 'HOME' ? 1 : -1;
             me.x += moveDir * SPRINT_SPEED * me.dribbleSkill * 0.5;
             me.y += (Math.random() - 0.5) * 2;
        } else {
             // Đứng im
             me.x += 0;
             me.y += 0;
        }
    };

    // --- AI: QUYẾT ĐỊNH KHI KHÔNG BÓNG (Tối ưu hóa Phòng ngự & Chạy chỗ) ---
    const decideWithoutBall = (me: Player, allPlayers: Player[], ball: any, dt: number) => {
        let targetX = me.startX;
        let targetY = me.startY;
        let speed = PLAYER_SPEED;
        
        // --- DI CHUYỂN CÁC KHAI BÁO BIẾN LÊN ĐẦU ---
        const distToBall = Math.hypot(ball.x - me.x, ball.y - me.y);
        const ballOwner = allPlayers.find(p => p.id === ball.owner);
        const myTeam = me.team; 
        const direction = myTeam === 'HOME' ? 1 : -1;
        const halfwayX = PITCH_WIDTH / 2;
        
        const isMyTeamPossession = ballOwner && ballOwner.team === myTeam;
        const isEnemyPossession = ballOwner && ballOwner.team !== myTeam;
        const isEnemyGKPossession = isEnemyPossession && ballOwner!.role === 'GK';
        
        const scoreDiff = score.home - score.away;
        const isWinning = (myTeam === 'HOME' && scoreDiff > 0) || (myTeam === 'AWAY' && scoreDiff < 0);
        const isInOwnHalf = myTeam === 'HOME' ? me.x < PITCH_WIDTH / 2 : me.x > PITCH_WIDTH / 2;
        
        // Điều chỉnh tốc độ cơ bản (TEMPO CONTROL & HÌNH PHẠT)
        // Nếu đang trong thời gian bị phạt (cooldown > 10)
        if (me.cooldown > 10) { 
            speed = PLAYER_SPEED * 0.1; // Cực kỳ chậm (gần như bò)
        } 
        // Nếu không bị phạt, áp dụng Tempo Control
        else if (isWinning && isInOwnHalf) {
            speed = PLAYER_SPEED * 0.6; 
        } else if (isMyTeamPossession) {
            speed = PLAYER_SPEED * 1.0; 
        }


        // --- 1. XÁC ĐỊNH VỊ TRÍ GỐC ĐỘNG (DYNAMIC BASE FORMATION) ---
        let advanceFactor = 0;

        if (isMyTeamPossession) {
            const forwardMove = ballOwner ? (myTeam === 'HOME' ? Math.max(0, ballOwner.x - me.x) : Math.max(0, me.x - ballOwner.x)) : 0;

            if (me.role === 'FWD') advanceFactor = 150 + forwardMove * 0.5;
            else if (me.role === 'MID') advanceFactor = 80 + forwardMove * 0.3;
            else if (me.role === 'DEF') advanceFactor = 30;

            if (me.role === 'FWD' && ((myTeam === 'HOME' && me.x > halfwayX) || (myTeam === 'AWAY' && me.x < halfwayX))) {
                 if (me.startY < PITCH_HEIGHT/2) targetY = me.startY - 30; 
                 if (me.startY > PITCH_HEIGHT/2) targetY = me.startY + 30; 
            }
            
            // --- LOGIC CHẠY CHỖ (ATTACKING RUNS) ---
            const distToOwner = ballOwner ? Math.hypot(me.x - ballOwner.x, me.y - ballOwner.y) : Infinity;
            
            if (ballOwner && me.role !== 'DEF' && me.role !== 'GK') {
                 
                 const isBlocked = allPlayers.some(p => p.team !== myTeam && Math.hypot(p.x - me.x, p.y - me.y) < 40);
                 const isForward = ballOwner ? (me.team === 'HOME' ? me.x > ballOwner.x : me.x < ballOwner.x) : false;

                 if (isBlocked && distToOwner < 150) {
                     // Thoát kèm
                     targetX = me.startX + direction * (advanceFactor + 30); 
                     targetY = me.y + (me.startY > PITCH_HEIGHT/2 ? -60 : 60); 
                     speed = SPRINT_SPEED * 1.5; 
                 } else if (distToOwner < 50 && isForward) {
                     // Chạy ra xa người cầm bóng
                     targetX = ballOwner.x + (me.team === 'HOME' ? 100 : -100) + (Math.random() * 20 - 10); 
                     
                     if (Math.abs(me.startY - PITCH_HEIGHT/2) < 50) {
                          targetY = me.y + (me.startY > PITCH_HEIGHT/2 ? 50 : -50);
                     } else {
                          targetY = me.startY + (Math.random() * 20 - 10);
                     }
                     
                     speed = SPRINT_SPEED; 
                 }
            }


        } else if (isEnemyPossession) {
            if (me.role === 'DEF') advanceFactor = -50;
            else if (me.role === 'MID') advanceFactor = -20;
        }

        targetX = me.startX + direction * advanceFactor;
        targetY = me.startY + direction * (me.startY - PITCH_HEIGHT/2) / 5;

        // --- 2. THAY ĐỔI VỊ TRÍ DỰA TRÊN TÌNH HUỐNG (OVERRIDES) ---

        if (me.role === 'GK') {
             targetX = me.startX;
             targetY = Math.max(PITCH_HEIGHT/2 - 50, Math.min(PITCH_HEIGHT/2 + 50, ball.y));
        }
        else {
             // A. Trường hợp PHÒNG THỦ
             if (isEnemyPossession) {
                 
                 // KHÔNG CHO PHÉP TẤN CÔNG/ÁP SÁT NẾU ĐANG CHỊU HÌNH PHẠT LỚN
                 if (me.cooldown > 10) { 
                      // Buộc quay lại vị trí xuất phát một cách thụ động
                      targetX = me.startX;
                      targetY = me.startY;
                 } 
                 // Nếu không bị phạt, áp dụng logic áp sát/tackle bình thường
                 else {
                     const distToOwner = ballOwner ? Math.hypot(me.x - ballOwner.x, me.y - ballOwner.y) : Infinity;

                     // LAO VÀO CẢN PHÁ QUYẾT LIỆT (TACKLE THRESHOLD 100px)
                     if ((me.role === 'DEF' || me.role === 'MID') && distToOwner < 100) {
                         
                         // KÍCH HOẠT HÀNH ĐỘNG TACKLE CHỦ ĐỘNG
                         if (distToOwner < 30) { 
                            targetX = ballOwner!.x;
                            targetY = ballOwner!.y;
                            speed = SPRINT_SPEED * 3.0; // Tốc độ đột ngột TĂNG CAO
                            me.cooldown = 40; // Đánh dấu là đang Tackle
                         } else {
                             // Áp sát bình thường
                             targetX = ballOwner!.x;
                             targetY = ballOwner!.y;
                             speed = SPRINT_SPEED * 1.5; 
                         }
                         
                     } else {
                         
                         let nearestChaser: Player | undefined;
                         const myChasers = allPlayers
                             .filter(p => p.team === myTeam && p.role !== 'GK')
                             .sort((a, b) => Math.hypot(ballOwner!.x - a.x, ballOwner!.y - a.y) - Math.hypot(ballOwner!.x - b.x, ballOwner!.y - b.y));
                         nearestChaser = myChasers[0];
                         
                         // RULE THỦ MÔN CẦM BÓNG -> BUỘC LÙI VỀ
                         if (isEnemyGKPossession) {
                              if (me.team === 'HOME' && me.x > halfwayX) targetX = halfwayX - 50; 
                              else if (me.team === 'AWAY' && me.x < halfwayX) targetX = halfwayX + 50; 
                              targetY = me.startY; 
                              speed = PLAYER_SPEED;
                         }
                         // Logic Pressing Priority & Zonal Defense
                         else if (me.id === nearestChaser?.id) {
                             // Pressing: Tăng tốc độ và nhắm tới vị trí sau lưng người cầm bóng
                             const targetPressX = ballOwner!.x + (ballOwner!.team === 'HOME' ? -10 : 10); 
                             targetX = targetPressX;
                             targetY = ballOwner!.y;
                             speed = SPRINT_SPEED * 1.2; 
                         } else if (me.role === 'DEF' || me.role === 'MID') {
                             // Zonal Defense: Di chuyển tới vị trí che chắn giữa khung thành và bóng
                             const blockX = (me.startX * 0.5 + ballOwner!.x * 0.5); 
                             const blockY = (me.startY * 0.5 + ballOwner!.y * 0.5); 

                             targetX = (targetX + blockX * 2) / 3;
                             targetY = (targetY + blockY * 2) / 3;
                             speed = PLAYER_SPEED * 0.8; 
                         }
                     }
                 }
             }
             // B. Trường hợp BÓNG TỰ DO (Chạy tới bóng)
             else if (ball.owner === -1) {
                 if (distToBall < 100) { 
                     targetX = ball.x;
                     targetY = ball.y;
                     speed = SPRINT_SPEED * 1.2; 
                 }
             }
        }

        // --- 3. THỰC HIỆN DI CHUYỂN VÀ NÉ TRÁNH ---
        const angle = Math.atan2(targetY - me.y, targetX - me.x);
        const moveDist = Math.hypot(targetY - me.y, targetX - me.x); 
        const currentSpeed = Math.min(speed * dt, moveDist);

        me.x += Math.cos(angle) * currentSpeed;
        me.y += Math.sin(angle) * currentSpeed;

        // LOGIC NÉ TRÁNH (SEPARATION) - ĐỘNG (Chống tụm)
        const SEPARATION_RADIUS = 35; // Bán kính né tránh hợp lý
        
        for (const other of allPlayers) {
             if (other.id === me.id) continue;

             const dist = Math.hypot(other.x - me.x, other.y - me.y);

             if (dist < SEPARATION_RADIUS) {
                 const pushAngle = Math.atan2(me.y - other.y, me.x - other.x);
                 const overlap = SEPARATION_RADIUS - dist;
                 
                 // Lực đẩy tỉ lệ nghịch với khoảng cách (overlap * 0.2)
                 const dynamicPushForce = overlap * 0.2; 

                 me.x += Math.cos(pushAngle) * dynamicPushForce;
                 me.y += Math.sin(pushAngle) * dynamicPushForce;
             }
        }

        // Giới hạn sân
        me.x = Math.max(10, Math.min(PITCH_WIDTH-10, me.x));
        me.y = Math.max(10, Math.min(PITCH_HEIGHT-10, me.y));
    };

    const shoot = (me: Player, targetX: number, targetY: number) => {
        passOrCross(me, targetX, targetY, SHOOT_POWER);
        setCommentary(`${me.team} SHOOTS!!!`);
    };

    const pass = (me: Player, target: Player) => {
        passOrCross(me, target.x, target.y, PASS_POWER);
    };

    const checkGoal = () => {
        const ball = ballRef.current;
        const inGoalRange = ball.y > (PITCH_HEIGHT/2 - GOAL_SIZE/2) && ball.y < (PITCH_HEIGHT/2 + GOAL_SIZE/2);

        if (gameFlow !== 'play') return;

        // BÀN THẮNG
        if (ball.x > PITCH_WIDTH && inGoalRange) {
             setScore(s => ({ ...s, home: s.home + 1 }));
             setCommentary("GOALLLL! HOME TEAM SCORES!");
             resetGameFlow('kickoff', 'AWAY');
        } else if (ball.x < 0 && inGoalRange) {
             setScore(s => ({ ...s, away: s.away + 1 }));
             setCommentary("GOALLLL! AWAY TEAM SCORES!");
             resetGameFlow('kickoff', 'HOME');
        }
        // PHẠT GÓC (Ra biên ngang, KHÔNG vào gôn)
        else if (ball.x > PITCH_WIDTH || ball.x < 0) {

             const teamKickingOut = ball.x > PITCH_WIDTH ? 'HOME' : 'AWAY';
             const cornerTeam = teamKickingOut === 'HOME' ? 'AWAY' : 'HOME';

             const cornerX = cornerTeam === 'HOME' ? 10 : PITCH_WIDTH - 10;
             const cornerY = ball.y < PITCH_HEIGHT/2 ? 10 : PITCH_HEIGHT - 10;

             resetGameFlow('corner', cornerTeam, { x: cornerX, y: cornerY });
        }
        // Khác (Bóng ra khỏi màn hình hoàn toàn)
        else if (ball.x < -20 || ball.x > PITCH_WIDTH + 20 || ball.y < -20 || ball.y > PITCH_HEIGHT + 20) {
             resetGameFlow('kickoff', 'HOME');
             setCommentary("Ball out.");
        }
    };


    const resetGameFlow = (flow: GameFlowState, team: 'HOME' | 'AWAY', pos?: { x: number, y: number }) => {
        initTeams();
        setSetPieceTeam(team);

        let ballPos = pos || { x: PITCH_WIDTH/2, y: PITCH_HEIGHT/2 };
        ballRef.current = { x: ballPos.x, y: ballPos.y, owner: -1, vx: 0, vy: 0 };
        setSetPiecePos(ballPos);

        setTimeout(() => {
            const players = playersRef.current;
            let kicker: Player | undefined;

            if (flow === 'kickoff') {
                kicker = findMidfielderForKickoff(team, players);
                setCommentary(`Kick off! ${team} to start.`);
                setGameFlow('play');
            } else if (flow === 'throwin' || flow === 'corner') {
                kicker = players.filter(p => p.team === team)
                                 .sort((a, b) => Math.hypot(ballPos.x - a.x, ballPos.y - a.y) - Math.hypot(ballPos.x - b.x, ballPos.y - b.y))[0];
                setCommentary(flow === 'corner' ? `${team} Corner Kick!` : `${team} Throw-in!`);
                setGameFlow(flow);
            }

            if (kicker) {
                ballRef.current.owner = kicker.id;
                kicker.cooldown = 15;
            } else {
                ballRef.current.owner = -1;
            }

        }, 100);
    };

    const startMatch = useCallback(() => {
        if (!selectedBet || betAmount === 0) return;
        setBalance(prev => prev - betAmount);
        initTeams();
        setScore({ home: 0, away: 0 });
        setTime(0);
        setGameFlow('play');
        setMatchState('playing');
        setCommentary("Kick off!");
    }, [betAmount, selectedBet, initTeams]);

    const endMatch = () => {
        setMatchState('finished');
        let result: BetType = 'DRAW';
        if (score.home > score.away) result = 'HOME';
        else if (score.away > score.home) result = 'AWAY';

        setCommentary(`Full Time! Result: ${result}`);
        if (result === selectedBet) {
             let payout = result === 'DRAW' ? betAmount * 3 : betAmount * 2;
             setBalance(prev => prev + betAmount + payout);
        }
        setTimeout(() => {
             setMatchState('betting');
             setBetAmount(0);
             setSelectedBet(null);
        }, 4000);
    };


    return {
        matchState, time, score, commentary,
        balance, betAmount, selectedBet, setBetAmount, setSelectedBet,
        startMatch, updateGame, playersRef, ballRef,
        gameFlow, setPiecePos, setPieceTeam
    };
};