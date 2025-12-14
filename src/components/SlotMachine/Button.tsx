import React, { useCallback } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';

extend({ Container, Graphics, Text });

interface ButtonProps {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
  color?: number;
  disabled?: boolean;
  scale?: number;
}

export const Button: React.FC<ButtonProps> = ({ 
  x, y, label, onClick, color = 0x2c3e50, disabled, scale = 1
}) => {
  
  const draw = useCallback((g: Graphics) => {
    g.clear();
    g.beginFill(disabled ? 0x95a5a6 : color);
    g.drawRoundedRect(-60, -25, 120, 50, 10);
    g.endFill();
  }, [color, disabled]);

  const textStyle = new TextStyle({ 
    fill: '#ffffff', fontSize: 20, fontWeight: 'bold', align: 'center'
  });

  return (
    <pixiContainer 
      x={x} y={y} scale={scale}
      eventMode={disabled ? 'none' : 'static'} 
      cursor={disabled ? 'default' : 'pointer'} 
      onPointerDown={onClick}
    >
      <pixiGraphics draw={draw} />
      <pixiText text={label} anchor={0.5} x={0} y={0} style={textStyle} />
    </pixiContainer>
  );
};