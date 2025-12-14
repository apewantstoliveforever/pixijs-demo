import React from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { useBaccarat } from './useBaccarat';
import { Card } from './Card';
import { Button } from './Button';
import { useWindowSize } from './useWindowSize';

extend({ Container, Text, Graphics });

const App = () => {
  // 1. Hook lấy kích thước
  const { width, height } = useWindowSize();
  
  // 2. Hook game (luôn gọi, không để trong if)
  const game = useBaccarat();

  // 3. Conditional Rendering: Nếu chưa có size thì chưa vẽ gì
  if (width === undefined || height === undefined) {
    return null; 
  }

  // --- Styles ---
  const titleStyle = new TextStyle({ fill: '#fff', fontSize: 20, align: 'center' });
  const scoreStyle = new TextStyle({ fill: '#f1c40f', fontSize: 36, fontWeight: 'bold' });
  const resultStyle = new TextStyle({ 
    fill: '#fff', fontSize: 40, fontWeight: 'bold', 
    dropShadow: true, stroke: '#000'
  });

  // --- Responsive Math ---
  const scaleWidth = width / 400; // Base width mobile
  const scaleHeight = height / 850; // Base height mobile
  const baseScale = Math.min(scaleWidth, scaleHeight);
  const centerX = width / 2;
  const cardSpacing = 35 * baseScale;

  const getCardX = (index: number, totalCards: number) => {
    const totalWidth = (totalCards - 1) * cardSpacing;
    return (-totalWidth / 2) + (index * cardSpacing);
  };

  const drawBetBox = (g: any, isSelected: boolean, color: number) => {
    g.clear();
    g.lineStyle(2, isSelected ? 0xFFFF00 : 0xFFFFFF, 1);
    g.beginFill(color, 0.3);
    g.drawRoundedRect(-60, -30, 120, 60, 10);
    g.endFill();
  };

  return (
    <Application width={width} height={height} backgroundColor={0x5e2636}> 
      
      {/* --- Money Info --- */}
      <pixiContainer x={width - 20} y={20}>
         <pixiText text={`$${game.balance}`} anchor={{x:1,y:0}} style={{fill:'#2ecc71', fontSize: 24}} scale={baseScale} />
         <pixiText text={`Bet: $${game.betAmount}`} anchor={{x:1,y:0}} y={30} style={{fill:'#fff', fontSize: 20}} scale={baseScale} />
      </pixiContainer>

      {/* --- BANKER SECTION (Top) --- */}
      <pixiContainer x={centerX} y={height * 0.15} scale={baseScale}>
        <pixiText text="BANKER" anchor={0.5} y={-50} style={{...titleStyle, fill: '#e74c3c'}} />
        {/* Chỉ hiện điểm khi đang chơi hoặc kết thúc */}
        <pixiText text={`${game.gameState === 'betting' ? '' : game.bankerScore}`} anchor={0.5} y={-80} style={scoreStyle} />
        <pixiContainer>
           {game.bankerHand.map((card, i) => (
             <Card key={i} x={getCardX(i, game.bankerHand.length)} y={0} card={card} />
           ))}
        </pixiContainer>
      </pixiContainer>

      {/* --- RESULT TEXT (Center) --- */}
      <pixiContainer x={centerX} y={height * 0.45} scale={baseScale}>
        {game.gameState === 'result' && (
             <pixiText 
                text={game.winner === 'TIE' ? "TIE GAME!" : `${game.winner} WINS!`} 
                anchor={0.5} style={resultStyle} 
             />
        )}
      </pixiContainer>

      {/* --- PLAYER SECTION (Bottom Middle) --- */}
      <pixiContainer x={centerX} y={height * 0.58} scale={baseScale}>
        <pixiText text="PLAYER" anchor={0.5} y={-50} style={{...titleStyle, fill: '#3498db'}} />
        <pixiText text={`${game.gameState === 'betting' ? '' : game.playerScore}`} anchor={0.5} y={-80} style={scoreStyle} />
        <pixiContainer>
           {game.playerHand.map((card, i) => (
             <Card key={i} x={getCardX(i, game.playerHand.length)} y={0} card={card} />
           ))}
        </pixiContainer>
      </pixiContainer>

      {/* --- BETTING CONTROLS (Bottom Fixed) --- */}
      <pixiContainer x={centerX} y={height - (220 * baseScale)} scale={baseScale}>
        
        {/* 1. Khu vực chọn cửa (Ẩn khi đang chia bài) */}
        {game.gameState === 'betting' && !game.isDealing && (
            <pixiContainer y={-50}>
                {/* P */}
                <pixiContainer x={-100} y={0} eventMode="static" onPointerDown={() => game.selectPosition('PLAYER')}>
                    <pixiGraphics draw={(g) => drawBetBox(g, game.selectedBet === 'PLAYER', 0x3498db)} />
                    <pixiText text="P (1:1)" anchor={0.5} style={{fill:'#fff', fontSize: 18, fontWeight: 'bold'}} />
                </pixiContainer>
                {/* Tie */}
                <pixiContainer x={0} y={0} eventMode="static" onPointerDown={() => game.selectPosition('TIE')}>
                    <pixiGraphics draw={(g) => drawBetBox(g, game.selectedBet === 'TIE', 0x2ecc71)} />
                    <pixiText text="TIE (1:8)" anchor={0.5} style={{fill:'#fff', fontSize: 18, fontWeight: 'bold'}} />
                </pixiContainer>
                {/* B */}
                <pixiContainer x={100} y={0} eventMode="static" onPointerDown={() => game.selectPosition('BANKER')}>
                    <pixiGraphics draw={(g) => drawBetBox(g, game.selectedBet === 'BANKER', 0xe74c3c)} />
                    <pixiText text="B (1:1)" anchor={0.5} style={{fill:'#fff', fontSize: 18, fontWeight: 'bold'}} />
                </pixiContainer>
            </pixiContainer>
        )}

        {/* 2. Khu vực Tiền & Nút Lệnh */}
        <pixiContainer y={50}>
            {game.gameState === 'betting' ? (
                <>
                    {/* Chọn tiền (Ẩn khi đang chia) */}
                    <pixiContainer y={0} x={-65} visible={!game.isDealing}> 
                        <Button x={-70} y={0} label="$10" onClick={() => game.increaseBet(10)} color={0xf39c12} />
                        <Button x={70} y={0} label="$50" onClick={() => game.increaseBet(50)} color={0xd35400} />
                        <Button x={210} y={0} label="$100" onClick={() => game.increaseBet(100)} color={0x8e44ad} />
                    </pixiContainer>

                    <pixiContainer y={70} x={0}>
                        <Button 
                            x={-70} y={0} label="CLEAR" onClick={game.clearBet} color={0x7f8c8d} 
                            disabled={game.betAmount === 0 || game.isDealing} 
                        />
                        <Button 
                            x={70} y={0} label="DEAL" onClick={game.dealGame} color={0xffce22} 
                            disabled={game.betAmount === 0 || !game.selectedBet || game.isDealing} 
                        />
                    </pixiContainer>
                </>
            ) : (
                <pixiContainer y={40}>
                    {/* Hiện NEW GAME khi kết thúc */}
                    {!game.isDealing && (
                        <Button x={0} y={0} label="NEW GAME" onClick={game.resetGame} color={0x2980b9} />
                    )}
                </pixiContainer>
            )}
        </pixiContainer>
      </pixiContainer>

    </Application>
  );
};

export default App;