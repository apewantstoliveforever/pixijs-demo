import React, { useCallback } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CardData } from './useBlackjack';

extend({ Container, Graphics, Text });

interface CardProps {
  card?: CardData;
  x: number;
  y: number;
}

export const Card: React.FC<CardProps> = ({ card, x, y }) => {
  const drawBackground = useCallback((g: Graphics) => {
    g.clear();
    g.lineStyle(2, 0x000000, 1);
    g.beginFill(0xFFFFFF);
    g.drawRoundedRect(0, 0, 80, 120, 8);
    g.endFill();
    
    if (!card) {
      g.beginFill(0xAA0000);
      g.drawRoundedRect(5, 5, 70, 110, 4);
      g.endFill();
    }
  }, [card]);

  const isRed = card?.suit === '♥' || card?.suit === '♦';
  
  const smallStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 20, // Giảm font xuống 1 xíu cho gọn
    fontWeight: 'bold',
    fill: isRed ? '#D40000' : '#000000',
  });

  const bigStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 42,
    fontWeight: 'bold',
    fill: isRed ? '#D40000' : '#000000',
  });

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBackground} />
      {card && (
        <>
          {/* Góc trên trái */}
          <pixiText text={`${card.rank}${card.suit}`} x={6} y={6} style={smallStyle} />
          
          {/* Ở giữa */}
          <pixiText 
            text={card.suit} 
            x={40} 
            y={60} 
            anchor={0.5} 
            style={bigStyle} 
          />
          
          {/* Góc dưới phải (FIXED) */}
          {/* Dùng anchor=0 và xoay 180 độ sẽ đẩy chữ LÊN và sang TRÁI -> Nằm gọn trong bài */}
          <pixiText 
            text={`${card.rank}${card.suit}`} 
            x={74} 
            y={114} 
            anchor={0} 
            rotation={Math.PI}
            style={smallStyle} 
          />
        </>
      )}
    </pixiContainer>
  );
};