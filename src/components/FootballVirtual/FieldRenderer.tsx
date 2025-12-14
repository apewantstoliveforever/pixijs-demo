import React from 'react';
import { Container, Graphics, Text, Ticker, TextStyle } from 'pixi.js';
import { extend, useTick } from '@pixi/react';
import { 
    PITCH_WIDTH, PITCH_HEIGHT, TEAM_HOME_COLOR, TEAM_AWAY_COLOR, BALL_COLOR, GOAL_SIZE, GOAL_DEPTH,
    CENTRE_CIRCLE_RADIUS, PENALTY_AREA_WIDTH, PENALTY_AREA_HEIGHT, PENALTY_SPOT_DIST 
} from './FMConstants';

extend({ Container, Graphics, Text });

interface RendererProps {
    playersRef: React.MutableRefObject<any[]>;
    ballRef: React.MutableRefObject<any>;
    onTick: (dt: number) => void;
}

export const FieldRenderer: React.FC<RendererProps> = ({ playersRef, ballRef, onTick }) => {
    const [_, forceUpdate] = React.useState(0);

    useTick((ticker: Ticker) => {
        onTick(ticker.deltaTime);
        forceUpdate(n => n + 1);
    });

    const drawGoal = (g: Graphics, x: number, isLeft: boolean) => {
        const topY = PITCH_HEIGHT/2 - GOAL_SIZE/2;
        const botY = PITCH_HEIGHT/2 + GOAL_SIZE/2;
        const depthDir = isLeft ? -GOAL_DEPTH : GOAL_DEPTH;

        g.lineStyle(2, 0xFFFFFF);
        g.moveTo(x, topY); g.lineTo(x, botY);
        g.moveTo(x + depthDir, topY); g.lineTo(x + depthDir, botY); 
        g.moveTo(x, topY); g.lineTo(x + depthDir, topY); 
        g.moveTo(x, botY); g.lineTo(x + depthDir, botY); 
        
        g.lineStyle(1, 0xFFFFFF, 0.3);
        for(let i=0; i<6; i++) {
             let y = topY + (i * (GOAL_SIZE/5));
             g.moveTo(x, y); g.lineTo(x + depthDir, y);
        }
    };

    const drawPitch = (g: Graphics) => {
        g.clear();
        // Cỏ
        g.beginFill(0x27ae60);
        g.drawRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
        g.endFill();

        // --- VẠCH KẺ SÂN ---
        g.lineStyle(2, 0xFFFFFF, 0.8);
        g.drawRect(10, 10, PITCH_WIDTH-20, PITCH_HEIGHT-20); // Biên

        // Giữa sân
        g.moveTo(PITCH_WIDTH/2, 10); g.lineTo(PITCH_WIDTH/2, PITCH_HEIGHT-10);
        g.drawCircle(PITCH_WIDTH/2, PITCH_HEIGHT/2, CENTRE_CIRCLE_RADIUS);

        // Vòng tròn giữa
        g.drawCircle(PITCH_WIDTH/2, PITCH_HEIGHT/2, 5); 

        // --- KHU VỰC 16M50 (TRÁI) ---
        const P_TOP = PITCH_HEIGHT/2 - PENALTY_AREA_HEIGHT/2;
        const P_BOT = PITCH_HEIGHT/2 + PENALTY_AREA_HEIGHT/2;
        g.drawRect(10, P_TOP, PENALTY_AREA_WIDTH, PENALTY_AREA_HEIGHT); // Hình chữ nhật 16m50
        
        g.beginFill(0xFFFFFF); g.drawCircle(10 + PENALTY_SPOT_DIST, PITCH_HEIGHT/2, 3); g.endFill(); // Chấm phạt đền
        
        g.arc(10 + PENALTY_SPOT_DIST, PITCH_HEIGHT/2, CENTRE_CIRCLE_RADIUS, -0.6, 0.6); // Cung phạt đền

        // --- KHU VỰC 16M50 (PHẢI) ---
        const PA_X = PITCH_WIDTH - 10 - PENALTY_AREA_WIDTH;
        g.drawRect(PA_X, P_TOP, PENALTY_AREA_WIDTH, PENALTY_AREA_HEIGHT);
        
        g.beginFill(0xFFFFFF); g.drawCircle(PITCH_WIDTH - 10 - PENALTY_SPOT_DIST, PITCH_HEIGHT/2, 3); g.endFill();
        
        g.arc(PITCH_WIDTH - 10 - PENALTY_SPOT_DIST, PITCH_HEIGHT/2, CENTRE_CIRCLE_RADIUS, Math.PI - 0.6, Math.PI + 0.6); 
        
        // Khung thành
        drawGoal(g, 10, true);
        drawGoal(g, PITCH_WIDTH-10, false);
    };

    const drawPlayers = (g: Graphics) => {
        g.clear();
        playersRef.current.forEach(p => {
            // Bóng đổ
            g.beginFill(0x000000, 0.3); g.drawEllipse(p.x, p.y + 6, 8, 4); g.endFill();

            // Người
            g.lineStyle(1, 0xFFFFFF);
            g.beginFill(p.team === 'HOME' ? TEAM_HOME_COLOR : TEAM_AWAY_COLOR);
            g.drawCircle(p.x, p.y, 10);
            g.endFill();
            
            // Vai trò (GK khác màu)
            if (p.role === 'GK') {
                 g.beginFill(0xFFFF00); 
                 g.drawCircle(p.x, p.y, 4);
                 g.endFill();
            }
        });
    };

    const drawBall = (g: Graphics) => {
        g.clear();
        const b = ballRef.current;
        // Bóng đổ
        g.beginFill(0x000000, 0.3); g.drawEllipse(b.x, b.y + 4, 6, 3); g.endFill();

        g.beginFill(BALL_COLOR);
        g.drawCircle(b.x, b.y, 6);
        g.endFill();
    };

    return (
        <pixiContainer>
            <pixiGraphics draw={drawPitch} />
            <pixiGraphics draw={drawPlayers} />
            <pixiGraphics draw={drawBall} />
        </pixiContainer>
    );
};