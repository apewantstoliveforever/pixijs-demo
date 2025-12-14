import React, { useRef, useEffect, useState } from 'react';
import { extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js';
import { SYMBOLS, REEL_STRIPS, SYMBOL_HEIGHT, REEL_WIDTH, VISIBLE_SYMBOLS } from './SlotConstants';

extend({ Container, Graphics, Text });

interface ReelProps {
  x: number;
  y: number;
  reelIndex: number;
  stopPosition: number;
  isSpinning: boolean;
  onSpinComplete: () => void;
}

export const Reel: React.FC<ReelProps> = ({ 
    x, y, reelIndex, stopPosition, isSpinning, onSpinComplete 
}) => {
  const [maskObj, setMaskObj] = useState<Graphics | null>(null);
  const [currentY, setCurrentY] = useState(0);
  const [localSpinning, setLocalSpinning] = useState(false);
  
  const stripData = REEL_STRIPS[reelIndex] || [];
  const stripHeight = stripData.length * SYMBOL_HEIGHT;
  const SPIN_SPEED = 30 + (reelIndex * 5);

  useEffect(() => {
    if (isSpinning) {
        setLocalSpinning(true);
    } else {
        if (localSpinning) {
            const delay = reelIndex * 500;
            const timeoutId = setTimeout(() => {
                setLocalSpinning(false);
                
                // --- FIX CĂN CHỈNH ---
                const targetSymbolY = stopPosition * SYMBOL_HEIGHT;
                
                // Đưa symbol về giữa khung (offset 1 ô = SYMBOL_HEIGHT)
                let finalY = -targetSymbolY + SYMBOL_HEIGHT;
                
                // Chuẩn hoá về chu kỳ âm
                if (finalY > 0) {
                    finalY -= stripHeight;
                }

                // QUAN TRỌNG: Làm tròn số để pixel sắc nét, không bị lệch
                setCurrentY(Math.round(finalY)); 
                onSpinComplete();
            }, delay);
            return () => clearTimeout(timeoutId);
        }
    }
  }, [isSpinning, reelIndex, stopPosition, localSpinning, onSpinComplete, stripHeight]); 

  useTick((ticker: Ticker) => {
    if (!localSpinning) return;

    let newY = currentY + (SPIN_SPEED * ticker.deltaTime);

    if (newY >= 0) {
        newY = newY - stripHeight;
    }

    setCurrentY(newY);
  });

  const drawSymbolBg = (g: Graphics, color: number) => {
    g.clear();
    // Vẽ nhỏ hơn 1 chút (padding) để không bị dính vào nhau
    g.beginFill(color);
    g.drawRoundedRect(4, 4, REEL_WIDTH - 8, SYMBOL_HEIGHT - 8, 16); 
    g.endFill();
  }

  const symbolTextStyle = new TextStyle({ 
      fontSize: 50, 
      align: 'center',
      dropShadow: true,
  });

  const renderStrip = (offsetY: number) => (
      <pixiContainer y={offsetY}>
          {stripData.map((symbolId, index) => {
              const symbol = SYMBOLS.find(s => s.id === symbolId);
              if (!symbol) return null;
              return (
                <pixiContainer key={index} y={index * SYMBOL_HEIGHT}>
                    <pixiGraphics draw={(g) => drawSymbolBg(g, symbol.color)} />
                    <pixiText text={symbol.text} anchor={0.5} x={REEL_WIDTH / 2} y={SYMBOL_HEIGHT / 2} style={symbolTextStyle} />
                </pixiContainer>
              );
          })}
      </pixiContainer>
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        ref={setMaskObj} 
        draw={g => {
            g.clear(); g.beginFill(0x000000); 
            g.drawRect(0, 0, REEL_WIDTH, SYMBOL_HEIGHT * VISIBLE_SYMBOLS); 
            g.endFill();
        }}
      />
      <pixiContainer y={currentY} mask={maskObj}>
          {renderStrip(-stripHeight)}
          {renderStrip(0)}
          {renderStrip(stripHeight)}
      </pixiContainer>
      
      {/* Viền ngoài */}
      <pixiGraphics draw={g => {
        g.clear(); g.lineStyle(4, 0x2c3e50, 1);
        g.drawRect(0, 0, REEL_WIDTH, SYMBOL_HEIGHT * VISIBLE_SYMBOLS);
      }} />
    </pixiContainer>
  );
};