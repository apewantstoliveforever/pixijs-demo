"use client";

import { Assets, Texture, Sprite, Container, Text } from "pixi.js";
import { useEffect, useState } from "react";
import { extend } from "@pixi/react";

// Register Pixi components
extend({ Sprite, Container, Text });

interface BunnySpriteProps {
    x: number;
    y: number;
    scale?: number;
    tint?: number;
    number: number; // <-- THÊM PROP NÀY
}

export function BunnySprite({ x, y, scale = 1, tint = 0xFFFFFF, number }: BunnySpriteProps) {
    const [texture, setTexture] = useState<Texture | null>(null);

    useEffect(() => {
        let mounted = true;
        Assets.load("https://pixijs.com/assets/bunny.png").then((tex) => {
            if (mounted) setTexture(tex);
        });
        return () => { mounted = false; };
    }, []);

    if (!texture) return null;

    // Dùng Container để nhóm Bunny và Số lại.
    // Di chuyển và scale cả container thay vì chỉ sprite.
    return (
        <pixiContainer x={x} y={y} scale={scale}>
            {/* 1. Con thỏ */}
            <pixiSprite
                texture={texture}
                anchor={0.5}
                tint={tint}
                // Không cần đặt x,y, scale ở đây nữa vì container đã lo
            />
            
            {/* 2. Số thứ tự (Nằm đè lên thỏ) */}
            <pixiText
                text={number.toString()}
                anchor={0.5}
                y={-10} // Đẩy nhẹ lên phía lưng/đầu thỏ
                style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: 60, // Cỡ chữ to (sẽ bị scale nhỏ lại theo container)
                    fontWeight: "bold",
                    fill: "#ffffff", // Chữ trắng
                    stroke: "#000000", // Viền đen để dễ đọc trên mọi màu nền
                    dropShadow: true,
                }}
            />
        </pixiContainer>
    );
}