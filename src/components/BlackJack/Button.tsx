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
}

export const Button: React.FC<ButtonProps> = ({ 
  x, y, label, onClick, color = 0x2c3e50, disabled 
}) => {
  
  // Vẽ hình chữ nhật, nhưng dịch chuyển toạ độ để tâm nằm giữa (0,0)
  const draw = useCallback((g: Graphics) => {
    g.clear();
    g.beginFill(disabled ? 0x95a5a6 : color);
    // Vẽ từ -60 đến +60 (tổng width 120), từ -25 đến +25 (tổng height 50)
    g.drawRoundedRect(-60, -25, 120, 50, 10);
    g.endFill();
  }, [color, disabled]);

  const textStyle = new TextStyle({ 
    fill: '#ffffff', 
    fontSize: 20, 
    fontWeight: 'bold',
    align: 'center'
  });

  return (
    <pixiContainer 
      x={x} 
      y={y} 
      eventMode={disabled ? 'none' : 'static'} 
      cursor={disabled ? 'default' : 'pointer'} 
      onPointerDown={onClick}
    >
      <pixiGraphics draw={draw} />
      <pixiText 
        text={label} 
        anchor={0.5} 
        x={0} // Text nằm giữa container
        y={0} 
        style={textStyle} 
      />
    </pixiContainer>
  );
};