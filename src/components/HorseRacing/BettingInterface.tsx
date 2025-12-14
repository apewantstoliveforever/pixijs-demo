"use client";

import { useCallback, useMemo, useState } from "react";
import { Container, Graphics, Text } from "@pixi/react";
import { TextStyle } from "pixi.js";

// --- COMPONENTS CON (Button, Chip) ---

// Nút bấm cơ bản trong Pixi
const PixiButton = ({ x, y, width, height, text, color, onClick, selected = false, disabled = false, fontSize = 16 }: any) => {
    const draw = useCallback((g: any) => {
        g.clear();
        // Shadow
        g.beginFill(0x000000, 0.5);
        g.drawRoundedRect(4, 4, width, height, 10);
        g.endFill();
        
        // Main Body
        const fillColor = disabled ? 0x555555 : (selected ? 0xFFD700 : color);
        g.lineStyle(selected ? 4 : 2, disabled ? 0x888888 : 0xFFFFFF, 1);
        g.beginFill(fillColor);
        g.drawRoundedRect(0, 0, width, height, 10);
        g.endFill();
    }, [width, height, color, selected, disabled]);

    return (
        <Container x={x} y={y} eventMode={disabled ? "none" : "static"} cursor={disabled ? "default" : "pointer"} onpointertap={onClick}>
            <Graphics draw={draw} />
            <Text
                text={text}
                anchor={0.5}
                x={width / 2}
                y={height / 2}
                style={new TextStyle({
                    fill: selected ? "#000000" : (disabled ? "#aaaaaa" : "#ffffff"),
                    fontSize: fontSize,
                    fontWeight: "bold",
                    fontFamily: "Arial",
                })}
            />
        </Container>
    );
};

// --- MAIN COMPONENT ---

interface PixiBettingUIProps {
    screenW: number;
    screenH: number;
    horses: any[];
    balance: number;
    onStartRace: (selectedHorse: number | null, amount: number) => void;
}

export function PixiBettingUI({ screenW, screenH, horses, balance, onStartRace }: PixiBettingUIProps) {
    const [selectedHorse, setSelectedHorse] = useState<number | null>(null);
    const [betAmount, setBetAmount] = useState(0);

    // Kích thước Panel
    const panelW = Math.min(800, screenW - 40);
    const panelH = Math.min(600, screenH - 40);
    const panelX = (screenW - panelW) / 2;
    const panelY = (screenH - panelH) / 2;

    // Xử lý tiền cược
    const addBet = (amount: number) => {
        if (balance >= betAmount + amount) {
            setBetAmount(prev => prev + amount);
        }
    };

    const clearBet = () => setBetAmount(0);
    const allIn = () => setBetAmount(balance);

    // Vẽ nền mờ (Backdrop)
    const drawBackdrop = useCallback((g: any) => {
        g.clear();
        g.beginFill(0x000000, 0.85); // Đen mờ 85%
        g.drawRect(0, 0, screenW, screenH);
        g.endFill();
    }, [screenW, screenH]);

    // Vẽ khung Panel chính
    const drawPanel = useCallback((g: any) => {
        g.clear();
        g.lineStyle(2, 0x444444, 1);
        g.beginFill(0x1F2937); // Gray-800
        g.drawRoundedRect(0, 0, panelW, panelH, 20);
        g.endFill();
    }, [panelW, panelH]);

    // Tính toán Grid ngựa
    const gridCols = screenW < 600 ? 3 : 4;
    const buttonWidth = (panelW - 60) / gridCols;
    const buttonHeight = 70;
    const startY = 100;

    return (
        <Container>
            {/* 1. Backdrop chặn click xuyên thấu */}
            <Graphics draw={drawBackdrop} eventMode="static" />

            {/* 2. Main Panel */}
            <Container x={panelX} y={panelY}>
                <Graphics draw={drawPanel} />

                {/* Header */}
                <Text text="SÀN CÁ CƯỢC" x={30} y={30} style={new TextStyle({ fill: "#FBBF24", fontSize: 24, fontWeight: "900" })} />
                <Text text={`Tài khoản: $${balance}`} anchor={[1, 0]} x={panelW - 30} y={30} style={new TextStyle({ fill: "#34D399", fontSize: 24, fontWeight: "bold" })} />
                
                <Graphics draw={g => { g.lineStyle(1, 0x555555); g.moveTo(20, 70); g.lineTo(panelW - 20, 70); }} />

                {/* Danh sách Ngựa */}
                <Container y={startY}>
                    {horses.map((horse, i) => {
                        const col = i % gridCols;
                        const row = Math.floor(i / gridCols);
                        const x = 30 + col * (buttonWidth + 10); // Spacing 10
                        const y = row * (buttonHeight + 10);
                        
                        return (
                            <PixiButton
                                key={i}
                                x={x}
                                y={y}
                                width={buttonWidth - 10}
                                height={buttonHeight}
                                color={0x374151}
                                text={`#${i+1} (x${horse.odds})`}
                                selected={selectedHorse === i}
                                onClick={() => setSelectedHorse(i)}
                                fontSize={14}
                            />
                        );
                    })}
                </Container>

                {/* Khu vực điều khiển tiền (Footer) */}
                <Container y={panelH - 140}>
                    <Graphics draw={g => { g.lineStyle(1, 0x555555); g.moveTo(20, 0); g.lineTo(panelW - 20, 0); }} />
                    
                    {/* Hiển thị số tiền đang chọn */}
                    <Text 
                        text={`CƯỢC: $${betAmount}`} 
                        x={30} y={20} 
                        style={new TextStyle({ fill: "#ffffff", fontSize: 20 })} 
                    />

                    {/* Các nút Chips */}
                    <Container x={30} y={60}>
                         <PixiButton x={0} y={0} width={70} height={40} text="+ $10" color={0x2563EB} onClick={() => addBet(10)} />
                         <PixiButton x={80} y={0} width={70} height={40} text="+ $50" color={0x7C3AED} onClick={() => addBet(50)} />
                         <PixiButton x={160} y={0} width={80} height={40} text="+ $100" color={0xDB2777} onClick={() => addBet(100)} />
                         <PixiButton x={250} y={0} width={70} height={40} text="ALL IN" color={0xDC2626} onClick={allIn} />
                         <PixiButton x={330} y={0} width={70} height={40} text="XÓA" color={0x4B5563} onClick={clearBet} />
                    </Container>

                    {/* Nút START (Góc phải dưới) */}
                    <PixiButton 
                        x={panelW - 180} 
                        y={40} 
                        width={150} 
                        height={60} 
                        text={selectedHorse === null ? "XEM ĐUA" : "CHỐT ĐƠN"} 
                        color={selectedHorse !== null ? 0xF59E0B : 0x4B5563}
                        disabled={selectedHorse !== null && betAmount === 0} // Chọn ngựa mà không cược thì không cho
                        onClick={() => onStartRace(selectedHorse, betAmount)}
                        fontSize={20}
                    />
                </Container>
            </Container>
        </Container>
    );
}