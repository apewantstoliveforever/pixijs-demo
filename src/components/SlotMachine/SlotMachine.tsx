import React, { useState, useEffect, useCallback } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { useSlotMachine } from './useSlotMachine';
import { Reel } from './Reel';
import { Button } from './Button';
import { useWindowSize } from './useWindowSize';
import { REEL_WIDTH, SYMBOL_HEIGHT, VISIBLE_SYMBOLS } from './SlotConstants';

extend({ Container, Text, Graphics });

const App = () => {
  const { width, height } = useWindowSize();
  const game = useSlotMachine();

  const [reelsStoppedCount, setReelsStoppedCount] = useState(0);

  const handleReelComplete = useCallback(() => {
    setReelsStoppedCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (reelsStoppedCount === 3) {
        game.calculateWin();
        setReelsStoppedCount(0);
    }
  }, [reelsStoppedCount, game]);

  // --- CONFIG LAYOUT ---
  const MACHINE_WIDTH = (REEL_WIDTH * 3) + 40; 
  const MACHINE_HEIGHT = SYMBOL_HEIGHT * VISIBLE_SYMBOLS;

  // --- HOOK VẼ PAYLINES (Đưa lên trên) ---
  const drawPaylines = useCallback((g: Graphics) => {
    g.clear();
    if (game.gameState !== 'win' || game.winningLines.length === 0) return;

    g.lineStyle(6, 0xe74c3c, 0.9); // Đậm hơn chút cho dễ nhìn

    game.winningLines.forEach(line => {
        const startX = -MACHINE_WIDTH/2 + 10; 
        const endX = MACHINE_WIDTH/2 - 10;
        
        const yTop = -SYMBOL_HEIGHT;
        const yMid = 0;
        const yBot = SYMBOL_HEIGHT;

        if (typeof line === 'number') {
            const y = line * SYMBOL_HEIGHT;
            g.moveTo(startX, y); g.lineTo(endX, y);
        } else if (line === 'diag1') { // \
            g.moveTo(startX, yTop); g.lineTo(endX, yBot);
        } else if (line === 'diag2') { // /
            g.moveTo(startX, yBot); g.lineTo(endX, yTop);
        }
    });
  }, [game.gameState, game.winningLines, MACHINE_WIDTH]);

  if (!width || !height) return null;

  // --- RESPONSIVE MATH ---
  // Scale nhỏ hơn chút để chắc chắn vừa màn hình
  const baseScale = Math.min(width / 480, height / 900); 
  const centerX = width / 2;
  const centerY = height / 2;

  const titleStyle = new TextStyle({ fill: '#f1c40f', fontSize: 36, fontWeight: 'bold', dropShadow: true });
  const infoStyle = new TextStyle({ fill: '#fff', fontSize: 24 });
  const winStyle = new TextStyle({ fill: '#2ecc71', fontSize: 48, fontWeight: 'bold', dropShadow: true});

  return (
    <Application width={width} height={height} backgroundColor={0x34495e}>
        
      {/* --- HEADER --- */}
      <pixiContainer x={centerX} y={height * 0.1} scale={baseScale}>
        <pixiText text="LUCKY SLOTS" anchor={0.5} style={titleStyle} />
        
        {/* Thông tin tiền & cược */}
        <pixiContainer y={60}>
            <pixiText text={`$${game.balance}`} anchor={{x:1, y:0.5}} x={-20} style={infoStyle} />
            <pixiText text={`Bet: $${game.bet}`} anchor={{x:0, y:0.5}} x={20} style={infoStyle} />
        </pixiContainer>

        {/* Nút CHEAT đưa lên góc phải Header để đỡ tốn chỗ dưới */}
        <pixiContainer x={180} y={0} visible={game.gameState !== 'spinning' && game.gameState !== 'stopping'}>
             <Button x={0} y={0} scale={0.6} label="CHEAT" onClick={game.cheatWin} color={0xe74c3c} />
        </pixiContainer>
      </pixiContainer>

      {/* --- SLOT MACHINE --- */}
      <pixiContainer x={centerX} y={centerY - (40 * baseScale)} scale={baseScale}>
        <pixiGraphics draw={g => {
            g.clear(); g.beginFill(0x2c3e50); g.lineStyle(5, 0xf39c12);
            g.drawRoundedRect(-MACHINE_WIDTH/2 - 20, -MACHINE_HEIGHT/2 - 20, MACHINE_WIDTH + 40, MACHINE_HEIGHT + 40, 20);
            g.endFill();
        }} />
        
        <pixiContainer x={-MACHINE_WIDTH/2} y={-MACHINE_HEIGHT/2}>
            {[0, 1, 2].map(i => (
                <Reel 
                    key={i}
                    x={i * (REEL_WIDTH + 20)} y={0} reelIndex={i}
                    stopPosition={game.stopPositions[i]}
                    isSpinning={game.gameState === 'spinning'} 
                    onSpinComplete={handleReelComplete}
                />
            ))}
            <pixiGraphics draw={drawPaylines} />
        </pixiContainer>
      </pixiContainer>

       {/* --- WIN MSG --- */}
       <pixiContainer x={centerX} y={centerY + (220 * baseScale)} scale={baseScale}>
         {game.gameState === 'win' && game.winAmount > 0 && (
             <pixiText text={`WIN: $${game.winAmount}!`} anchor={0.5} style={winStyle} />
         )}
         {game.gameState === 'lose' && (
             <pixiText text="Try Again" anchor={0.5} style={{...infoStyle, fill: '#bdc3c7'}} />
         )}
       </pixiContainer>

      {/* --- CONTROLS (RESPONSIVE FIX) --- */}
      <pixiContainer x={centerX} y={height - (90 * baseScale)} scale={baseScale}>
        
        {/* Nhóm nút chỉnh tiền (-10 / +10) */}
        <pixiContainer x={-120} visible={game.gameState !== 'spinning' && game.gameState !== 'stopping'}>
            {/* Thu gọn khoảng cách các nút */}
            <Button x={-55} y={0} scale={0.9} label="-10" onClick={() => game.changeBet(-10)} color={0xd35400} disabled={game.bet <= 10} />
            <Button x={55} y={0} scale={0.9} label="+10" onClick={() => game.changeBet(10)} color={0xd35400} />
        </pixiContainer>

        {/* Nút SPIN to ở bên phải */}
        <Button 
            x={120} y={0} scale={1.2}
            label={game.gameState === 'spinning' ? "..." : "SPIN"} 
            onClick={game.spin} 
            color={0x27ae60}
            disabled={game.gameState === 'spinning' || game.gameState === 'stopping' || game.balance < game.bet}
        />
      </pixiContainer>

    </Application>
  );
};

export default App;