"use client";

import { Assets, Texture, Rectangle, AnimatedSprite as PixiAnimatedSprite, Container, Text } from "pixi.js";
import { useEffect, useState, useMemo, useRef } from "react";
import { extend } from "@pixi/react";

// Register Pixi components
extend({ AnimatedSprite: PixiAnimatedSprite, Container, Text });

interface HorseSpriteProps {
    x: number;
    y: number;
    scale?: number;
    tint?: number;
    number: number;
    segment: number;
}

const SHEET_URL = "//horse_racing/horse_sheet.png"; 

// --- CẤU HÌNH QUAN TRỌNG ---
const SHEET_COLS = 11;      // Tổng số cột của file ảnh (Dùng để tính độ rộng frame)
const FRAMES_TO_USE = 8;    // Số frame thực tế muốn dùng cho Animation (bỏ qua 3 cột cuối)
const ROWS = 18; 
const ANIMATION_SPEED = 0.2;

export function HorseSprite({ x, y, scale = 1, tint = 0xFFFFFF, number, segment }: HorseSpriteProps) {
    const [spriteSheet, setSpriteSheet] = useState<Texture[][] | null>(null);
    const spriteRef = useRef<PixiAnimatedSprite>(null);

    useEffect(() => {
        let mounted = true;

        const loadSheet = async () => {
            try {
                const baseTexture = await Assets.load(SHEET_URL);
                
                // 1. Tính toán độ rộng dựa trên TỔNG SỐ CỘT (11) để cắt cho đúng tỷ lệ
                const frameWidth = baseTexture.width / SHEET_COLS;
                const frameHeight = baseTexture.height / ROWS;
                const animations: Texture[][] = [];

                for (let row = 0; row < ROWS; row++) {
                    const rowFrames: Texture[] = [];
                    
                    // 2. Chỉ vòng lặp 8 lần để lấy 8 frame đầu tiên
                    for (let col = 0; col < FRAMES_TO_USE; col++) {
                        const rect = new Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight);
                        const frame = new Texture({ source: baseTexture.source, frame: rect });
                        rowFrames.push(frame);
                    }
                    animations.push(rowFrames);
                }

                if (mounted) setSpriteSheet(animations);
            } catch (error) {
                console.error("Failed to load sprite sheet:", error);
            }
        };

        loadSheet();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (spriteRef.current && spriteSheet) {
            if (!spriteRef.current.playing) {
                spriteRef.current.play();
            }
        }
    }, [spriteSheet, segment]);

    const directionRow = useMemo(() => {
        switch (segment) {
            case 0: return 3; 
            case 1: return 3; 
            case 2: return 12; 
            case 3: return 12; 
            case 4: return 8; 
            case 5: return 8; 
            case 6: return 16; 
            case 7: return 16; 
            default: return 0;
        }
    }, [segment]);

    if (!spriteSheet) return null;

    const safeRow = (directionRow < spriteSheet.length) ? directionRow : 0;

    return (
        <pixiContainer x={x} y={y} scale={scale}>
            <pixiAnimatedSprite
                loop={true}
                ref={spriteRef}
                textures={spriteSheet[safeRow]}
                animationSpeed={ANIMATION_SPEED}
                anchor={0.5}
                tint={tint}
            />
            
            <pixiText
                text={number.toString()}
                anchor={0.5}
                y={-20} 
                style={{
                    fontFamily: "Arial",
                    fontSize: 40,
                    fontWeight: "bold",
                    fill: "#ffffff",
                    stroke: "#000000",
                }}
            />
        </pixiContainer>
    );
}