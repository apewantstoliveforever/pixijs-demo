import { useState, useCallback } from 'react';
import { SYMBOLS, REEL_STRIPS } from './SlotConstants';

export type SlotState = 'idle' | 'spinning' | 'stopping' | 'win' | 'lose';

export const useSlotMachine = () => {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [gameState, setGameState] = useState<SlotState>('idle');
  const [stopPositions, setStopPositions] = useState<number[]>([0, 0, 0]);
  
  // Lưu danh sách các dòng thắng để vẽ (VD: [-1] là dòng trên, ['diag1'] là chéo)
  const [winningLines, setWinningLines] = useState<(number | string)[]>([]);

  const changeBet = (amount: number) => {
    if (gameState === 'idle' || gameState === 'win' || gameState === 'lose') {
        if (balance + amount >= 0) setBet(prev => Math.max(10, prev + amount));
    }
  }

  const spin = useCallback(() => {
    if (balance < bet || gameState === 'spinning' || gameState === 'stopping') return;

    setBalance(prev => prev - bet);
    setWinAmount(0);
    setWinningLines([]); // Reset dòng thắng
    setGameState('spinning');

    const newStops = REEL_STRIPS.map(strip => Math.floor(Math.random() * strip.length));
    setStopPositions(newStops);

    setTimeout(() => {
        setGameState('stopping');
    }, 2000);
  }, [balance, bet, gameState]);

  // HÀM CHEAT: Dùng để test thắng chéo
  const cheatWin = useCallback(() => {
      if (balance < bet || gameState === 'spinning' || gameState === 'stopping') return;
      setBalance(prev => prev - bet);
      setWinAmount(0);
      setWinningLines([]);
      setGameState('spinning');

      // Ép dừng ở vị trí tạo ra đường chéo Cherry (Giả sử index 0, 1, 2 đều là Cherry hoặc Symbol giống nhau)
      // Reel 1: Index 0
      // Reel 2: Index 1 
      // Reel 3: Index 2
      setStopPositions([0, 1, 2]); 
      
      setTimeout(() => { setGameState('stopping'); }, 2000);
  }, [balance, bet, gameState]);

  // --- LOGIC TÍNH THƯỞNG 5 DÒNG ---
  const calculateWin = useCallback(() => {
    let totalWin = 0;
    let lines: (number | string)[] = [];

    // Helper: Lấy ID tại guồng reelIdx, offset (-1: trên, 0: giữa, 1: dưới)
    const getSymbolId = (reelIdx: number, offset: number) => {
        const strip = REEL_STRIPS[reelIdx];
        const pos = stopPositions[reelIdx];
        const targetIndex = (pos + offset + strip.length) % strip.length;
        return strip[targetIndex];
    };

    // 1. Check 3 Dòng Ngang (-1, 0, 1)
    [-1, 0, 1].forEach(offset => {
        const s1 = getSymbolId(0, offset);
        const s2 = getSymbolId(1, offset);
        const s3 = getSymbolId(2, offset);
        if (s1 === s2 && s2 === s3) {
            const symbol = SYMBOLS.find(s => s.id === s1);
            if (symbol) {
                totalWin += bet * symbol.payout;
                lines.push(offset);
            }
        }
    });

    // 2. Check Chéo 1 (\): Góc Trên Trái -> Góc Dưới Phải
    const d1_1 = getSymbolId(0, -1);
    const d1_2 = getSymbolId(1, 0);
    const d1_3 = getSymbolId(2, 1);
    if (d1_1 === d1_2 && d1_2 === d1_3) {
         const symbol = SYMBOLS.find(s => s.id === d1_1);
         if (symbol) {
             totalWin += bet * symbol.payout;
             lines.push('diag1');
         }
    }

    // 3. Check Chéo 2 (/): Góc Dưới Trái -> Góc Trên Phải
    const d2_1 = getSymbolId(0, 1);
    const d2_2 = getSymbolId(1, 0);
    const d2_3 = getSymbolId(2, -1);
    if (d2_1 === d2_2 && d2_2 === d2_3) {
         const symbol = SYMBOLS.find(s => s.id === d2_1);
         if (symbol) {
             totalWin += bet * symbol.payout;
             lines.push('diag2');
         }
    }

    if (totalWin > 0) {
        setBalance(prev => prev + totalWin);
        setWinAmount(totalWin);
        setWinningLines(lines);
        setGameState('win');
    } else {
        setGameState('lose');
    }
  }, [bet, stopPositions]);

  return {
    balance, bet, winAmount, gameState, stopPositions, winningLines,
    spin, cheatWin, changeBet, calculateWin
  };
};