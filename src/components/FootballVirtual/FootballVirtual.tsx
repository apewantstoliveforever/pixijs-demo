import React from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useWindowSize } from './useWindowSize';
import { useFootballSim } from './useFootballSim';
import { FieldRenderer } from './FieldRenderer';
import { Button } from './Button'; 
import { PITCH_WIDTH, PITCH_HEIGHT, TEAM_HOME_COLOR, TEAM_AWAY_COLOR } from './FMConstants';

extend({ Container, Graphics, Text });

const App = () => {
  const { width, height } = useWindowSize();
  const game = useFootballSim();

  if (!width || !height) return null;

  const baseScale = Math.min(width / (PITCH_WIDTH + 50), height / (PITCH_HEIGHT + 200));
  const centerX = width / 2;
  const pitchX = centerX - (PITCH_WIDTH * baseScale) / 2;
  const pitchY = (height - (PITCH_HEIGHT * baseScale)) / 2;

  // Styles
  const scoreStyle = new TextStyle({ fill: '#fff', fontSize: 40, fontWeight: 'bold', dropShadow: true });
  const timeStyle = new TextStyle({ fill: '#f1c40f', fontSize: 24, fontWeight: 'bold' });
  const commStyle = new TextStyle({ fill: '#fff', fontSize: 18, align: 'center', wordWrap: true, wordWrapWidth: 400 });

  return (
    <Application width={width} height={height} backgroundColor={0x1a1a1a}>
        
        {/* --- SCOREBOARD --- */}
        <pixiContainer x={centerX} y={30}>
            <pixiText text={`${game.score.home}`} x={-100} anchor={0.5} style={{...scoreStyle, fill: TEAM_HOME_COLOR}} />
            <pixiText text={`${game.score.away}`} x={100} anchor={0.5} style={{...scoreStyle, fill: TEAM_AWAY_COLOR}} />
            <pixiText text={`${game.time}'`} y={-20} anchor={0.5} style={timeStyle} />
            <pixiText text="-" anchor={0.5} style={scoreStyle} />
        </pixiContainer>

        {/* --- PITCH AREA --- */}
        <pixiContainer x={pitchX} y={pitchY} scale={baseScale}>
            <FieldRenderer 
                playersRef={game.playersRef} 
                ballRef={game.ballRef} 
                onTick={game.updateGame} 
            />
        </pixiContainer>

        {/* --- COMMENTARY BOX --- */}
        <pixiContainer x={centerX} y={height - 120}>
            <pixiGraphics draw={g => {
                g.clear(); g.beginFill(0x000000, 0.5);
                g.drawRoundedRect(-200, -20, 400, 40, 10); g.endFill();
            }} />
            <pixiText text={game.commentary} anchor={0.5} style={commStyle} />
        </pixiContainer>

        {/* --- BETTING UI (Overlay) --- */}
        {game.matchState === 'betting' && (
            <pixiContainer x={centerX} y={height/2}>
                {/* Background mờ */}
                <pixiGraphics draw={g => {
                    g.clear(); g.beginFill(0x000000, 0.8);
                    g.drawRect(-width/2, -height/2, width, height); g.endFill();
                }} />

                <pixiText text="MATCH BETTING" y={-150} anchor={0.5} style={{...scoreStyle, fontSize: 30}} />
                
                <pixiText text={`Balance: $${game.balance}`} y={-100} anchor={0.5} style={{fill:'#2ecc71', fontSize:24}} />

                {/* Chọn Đội */}
                <pixiContainer y={-20}>
                    <Button 
                        x={-150} y={0} label="HOME (x2)" color={TEAM_HOME_COLOR}
                        onClick={() => game.setSelectedBet('HOME')}
                        scale={game.selectedBet === 'HOME' ? 1.1 : 1}
                    />
                    <Button 
                        x={0} y={0} label="DRAW (x3)" color={0x95a5a6}
                        onClick={() => game.setSelectedBet('DRAW')}
                        scale={game.selectedBet === 'DRAW' ? 1.1 : 1}
                    />
                    <Button 
                        x={150} y={0} label="AWAY (x2)" color={TEAM_AWAY_COLOR}
                        onClick={() => game.setSelectedBet('AWAY')}
                        scale={game.selectedBet === 'AWAY' ? 1.1 : 1}
                    />
                </pixiContainer>

                {/* Chọn Tiền */}
                <pixiContainer y={60}>
                    <Button x={-70} y={0} label="$10" color={0xf39c12} onClick={() => game.setBetAmount(prev => prev+10)} scale={0.8} />
                    <Button x={0} y={0} label="$50" color={0xe67e22} onClick={() => game.setBetAmount(prev => prev+50)} scale={0.8} />
                    <Button x={70} y={0} label="$100" color={0xd35400} onClick={() => game.setBetAmount(prev => prev+100)} scale={0.8} />
                </pixiContainer>

                {/* Nút Start */}
                <pixiContainer y={150}>
                     <pixiText text={`Bet: $${game.betAmount} on ${game.selectedBet || '...'}`} y={-40} anchor={0.5} style={{fill:'#fff', fontSize:18}} />
                     
                     <Button 
                        x={0} y={0} label="KICK OFF" color={0x27ae60} scale={1.2}
                        onClick={game.startMatch}
                        disabled={!game.selectedBet || game.betAmount === 0 || game.balance < game.betAmount}
                     />
                </pixiContainer>
            </pixiContainer>
        )}

    </Application>
  );
};

export default App;