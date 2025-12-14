import { useState, useCallback } from 'react';

// --- Types ---
export type Suit = '♠' | '♥' | '♣' | '♦';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type BetPosition = 'PLAYER' | 'BANKER' | 'TIE' | null;
export type GameState = 'betting' | 'playing' | 'result';

export interface CardData {
  suit: Suit;
  rank: Rank;
  value: number;
}

// --- Helpers ---
const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getBaccaratValue = (rank: Rank): number => {
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  if (rank === 'A') return 1;
  return parseInt(rank);
};

const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({ suit, rank, value: getBaccaratValue(rank) });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

// Tính điểm an toàn (bỏ qua lá bài chưa lật - undefined)
const calculateScore = (hand: (CardData | undefined)[]): number => {
  const sum = hand.reduce((total, card) => total + (card ? card.value : 0), 0);
  return sum % 10;
};

// Hàm delay giúp tạo hiệu ứng chờ
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Hook ---
export const useBaccarat = () => {
  const [deck, setDeck] = useState<CardData[]>([]);
  // Hand bây giờ có thể chứa undefined (lá bài úp)
  const [playerHand, setPlayerHand] = useState<(CardData | undefined)[]>([]);
  const [bankerHand, setBankerHand] = useState<(CardData | undefined)[]>([]);
  
  const [gameState, setGameState] = useState<GameState>('betting');
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(0);
  const [selectedBet, setSelectedBet] = useState<BetPosition>(null);
  const [winner, setWinner] = useState<BetPosition>(null);
  const [isDealing, setIsDealing] = useState(false); // Trạng thái đang chia bài

  const selectPosition = (pos: BetPosition) => {
    if (gameState !== 'betting' || isDealing) return;
    setSelectedBet(pos);
    if (betAmount === 0) setBetAmount(10);
  };

  const increaseBet = (amount: number) => {
    if (balance >= amount && !isDealing) {
      setBalance(prev => prev - amount);
      setBetAmount(prev => prev + amount);
    }
  };

  const clearBet = () => {
    if (isDealing) return;
    setBalance(prev => prev + betAmount);
    setBetAmount(0);
    setSelectedBet(null);
  };

  const resetGame = () => {
    if (isDealing) return;
    setPlayerHand([]);
    setBankerHand([]);
    setGameState('betting');
    setWinner(null);
    setBetAmount(0);
    setSelectedBet(null);
  };

  // --- LOGIC CHIA BÀI VỚI HIỆU ỨNG ---
  const dealGame = useCallback(async () => {
    if (betAmount === 0 || !selectedBet || isDealing) return;

    setIsDealing(true); // Khóa nút
    setGameState('playing');
    setWinner(null);

    // 1. Tính toán kết quả trước (Ngầm định)
    let currentDeck = createDeck();
    let finalPHand = [currentDeck.pop()!, currentDeck.pop()!];
    let finalBHand = [currentDeck.pop()!, currentDeck.pop()!];

    // Quy tắc rút bài (giữ nguyên logic cũ)
    let pScore = finalPHand.reduce((s, c) => s + c.value, 0) % 10;
    let bScore = finalBHand.reduce((s, c) => s + c.value, 0) % 10;
    
    // Check rút lá thứ 3
    if (pScore < 8 && bScore < 8) {
        let playerThirdCardValue = -1;
        if (pScore <= 5) {
            const p3 = currentDeck.pop()!;
            finalPHand.push(p3);
            playerThirdCardValue = p3.value;
        }

        let bankerDraws = false;
        if (playerThirdCardValue === -1) {
            if (bScore <= 5) bankerDraws = true;
        } else {
            // Luật Banker rút khi Player rút lá 3
            if (bScore <= 2) bankerDraws = true;
            else if (bScore === 3 && playerThirdCardValue !== 8) bankerDraws = true;
            else if (bScore === 4 && [2,3,4,5,6,7].includes(playerThirdCardValue)) bankerDraws = true;
            else if (bScore === 5 && [4,5,6,7].includes(playerThirdCardValue)) bankerDraws = true;
            else if (bScore === 6 && [6,7].includes(playerThirdCardValue)) bankerDraws = true;
        }
        if (bankerDraws) finalBHand.push(currentDeck.pop()!);
    }

    // 2. BẮT ĐẦU HIỆU ỨNG CHIA BÀI (ANIMATION)
    
    // Bước 1: Chia 2 lá bài ÚP cho mỗi bên
    setPlayerHand([undefined, undefined]);
    setBankerHand([undefined, undefined]);
    await sleep(600); 

    // Bước 2: Lật từng lá bài (Tạo kịch tính)
    // Copy mảng hiện tại để cập nhật dần
    let currentP: (CardData | undefined)[] = [undefined, undefined];
    let currentB: (CardData | undefined)[] = [undefined, undefined];

    // Lật Player 1
    currentP[0] = finalPHand[0];
    setPlayerHand([...currentP]);
    await sleep(700);

    // Lật Banker 1
    currentB[0] = finalBHand[0];
    setBankerHand([...currentB]);
    await sleep(700);

    // Lật Player 2
    currentP[1] = finalPHand[1];
    setPlayerHand([...currentP]);
    await sleep(700);

    // Lật Banker 2
    currentB[1] = finalBHand[1];
    setBankerHand([...currentB]);
    await sleep(700);

    // Bước 3: Rút lá thứ 3 (nếu có)
    if (finalPHand.length > 2) {
        // Chia úp trước
        currentP.push(undefined);
        setPlayerHand([...currentP]);
        await sleep(600);
        // Lật bài
        currentP[2] = finalPHand[2];
        setPlayerHand([...currentP]);
        await sleep(800);
    }

    if (finalBHand.length > 2) {
        // Chia úp trước
        currentB.push(undefined);
        setBankerHand([...currentB]);
        await sleep(600);
        // Lật bài
        currentB[2] = finalBHand[2];
        setBankerHand([...currentB]);
        await sleep(800);
    }

    // 3. Kết thúc & Trả thưởng
    const endPScore = calculateScore(finalPHand);
    const endBScore = calculateScore(finalBHand);
    
    let result: BetPosition = 'TIE';
    if (endPScore > endBScore) result = 'PLAYER';
    else if (endBScore > endPScore) result = 'BANKER';

    setWinner(result);
    setGameState('result');

    if (result === selectedBet) {
      let payout = betAmount; 
      if (result === 'TIE') payout = betAmount * 8; 
      setBalance(prev => prev + betAmount + payout);
    }

    setIsDealing(false); // Mở khóa nút
  }, [betAmount, selectedBet, isDealing]); // Thêm dependencies

  return {
    playerHand,
    bankerHand,
    gameState,
    balance,
    betAmount,
    selectedBet,
    winner,
    isDealing, // Xuất biến này để App dùng
    playerScore: calculateScore(playerHand),
    bankerScore: calculateScore(bankerHand),
    selectPosition,
    increaseBet,
    clearBet,
    dealGame,
    resetGame,
  };
};