import React, { useState, useEffect } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Text, TextStyle } from 'pixi.js';
import { useBlackjack } from './useBlackjack';
import { Card } from './Card';
import { Button } from './Button';
import { useWindowSize } from './useWindowSize';

extend({ Container, Text });

const App = () => {
  // 1. Hook 1 & 2: Lấy kích thước
  const { width, height } = useWindowSize();
  
  // 2. Hook 3: Game Logic (DI CHUYỂN LÊN ĐÂY)
  // Hook phải luôn được gọi, bất kể width có giá trị hay không
  const game = useBlackjack(); 

  // 3. Hook 4: Style logic (Di chuyển lên luôn cho an toàn)
  const titleStyle = new TextStyle({ 
    fill: '#fff', 
    fontSize: 24, 
    align: 'center' 
  });
  
  const moneyStyle = new TextStyle({ 
    fill: '#2ecc71', 
    fontSize: 20, 
    fontWeight: 'bold', 
    align: 'right' 
  });

  const statusStyle = new TextStyle({ 
    fill: '#f1c40f', 
    fontSize: 32, 
    fontWeight: 'bold', 
    align: 'center',
    dropShadow: true, 
    wordWrap: true,
    wordWrapWidth: width ? width * 0.9 : 300 // Safe check cho width
  });

  // 4. BÂY GIỜ MỚI ĐƯỢC RETURN NULL (Conditional Rendering)
  if (!width || !height) {
    return null;
  }

  // --- RESPONSIVE MATH ---
  const scaleWidth = width / 400; 
  const scaleHeight = height / 800;
  const baseScale = Math.min(scaleWidth, scaleHeight);
  const centerX = width / 2;
  const cardSpacing = 40 * baseScale; 

  const getCardX = (index: number, totalCards: number) => {
    const totalWidth = (totalCards - 1) * cardSpacing;
    const startX = -totalWidth / 2;
    return startX + index * cardSpacing;
  };

  const getStatusText = () => {
    switch (game.gameState) {
      case 'betting': return 'Place Bet';
      case 'player_bust': return 'BUST!';
      case 'player_win': return 'YOU WIN!';
      case 'dealer_win': return 'DEALER WINS';
      case 'push': return 'PUSH';
      default: return '';
    }
  };

  return (
    <Application width={width} height={height} backgroundColor={0x205c3b}>
      
      {/* --- Money Info --- */}
      <pixiContainer x={width - 20} y={20}>
         <pixiText 
            text={`$${game.balance}`} 
            anchor={{ x: 1, y: 0 }} 
            style={moneyStyle} 
            scale={baseScale} 
         />
         <pixiText 
            text={`Bet: $${game.currentBet}`} 
            anchor={{ x: 1, y: 0 }} 
            y={25 * baseScale} 
            style={{...moneyStyle, fill: '#e74c3c'}} 
            scale={baseScale} 
         />
      </pixiContainer>

      {/* --- DEALER SECTION --- */}
      <pixiContainer x={centerX} y={height * 0.15} scale={baseScale}>
        <pixiText 
          text={`Dealer (${game.gameState === 'betting' ? '0' : (game.gameState === 'playing' ? '?' : game.dealerScore)})`} 
          anchor={0.5}
          y={-40}
          style={titleStyle} 
        />
        <pixiContainer>
            {game.dealerHand.map((card, i) => (
            <Card 
                key={i} 
                x={getCardX(i, game.dealerHand.length)} 
                y={0} 
                card={(i === 1 && game.gameState === 'playing') ? undefined : card} 
            />
            ))}
        </pixiContainer>
      </pixiContainer>

      {/* --- STATUS TEXT --- */}
      <pixiContainer x={centerX} y={height * 0.45} scale={baseScale}>
        <pixiText 
            text={getStatusText()} 
            anchor={0.5} 
            style={statusStyle} 
        />
      </pixiContainer>

      {/* --- PLAYER SECTION --- */}
      <pixiContainer x={centerX} y={height * 0.55} scale={baseScale}>
        <pixiText 
          text={`You (${game.gameState === 'betting' ? '0' : game.playerScore})`} 
          anchor={0.5}
          y={-40}
          style={titleStyle} 
        />
        <pixiContainer>
            {game.playerHand.map((card, i) => (
            <Card 
                key={i} 
                x={getCardX(i, game.playerHand.length)} 
                y={0} 
                card={card} 
            />
            ))}
        </pixiContainer>
      </pixiContainer>

      {/* --- CONTROLS SECTION --- */}
      <pixiContainer x={centerX} y={height - (180 * baseScale)} scale={baseScale}>
        {game.gameState === 'betting' ? (
            <pixiContainer>
                {/* Betting Buttons */}
                <pixiContainer y={0} x={-65}> 
                    <Button x={-70} y={0} label="$10" onClick={() => game.placeBet(10)} color={0xf39c12} />
                    <Button x={70} y={0} label="$50" onClick={() => game.placeBet(50)} color={0xd35400} />
                    <Button x={210} y={0} label="$100" onClick={() => game.placeBet(100)} color={0x8e44ad} />
                </pixiContainer>
                <pixiContainer y={70} x={0}>
                    <Button x={-70} y={0} label="CLEAR" onClick={game.clearBet} color={0x7f8c8d} disabled={game.currentBet === 0} />
                    <Button x={70} y={0} label="DEAL" onClick={game.dealGame} color={0x27ae60} disabled={game.currentBet === 0} />
                </pixiContainer>
            </pixiContainer>
        ) : game.gameState === 'playing' ? (
            <pixiContainer>
              <Button x={-70} y={0} label="HIT" onClick={game.hit} color={0x27ae60} />
              <Button x={70} y={0} label="STAND" onClick={game.stand} color={0xc0392b} />
            </pixiContainer>
        ) : (
            <pixiContainer>
              <Button x={0} y={0} label="NEXT HAND" onClick={game.resetToBetting} color={0x2980b9} />
            </pixiContainer>
        )}
      </pixiContainer>

    </Application>
  );
};

export default App;