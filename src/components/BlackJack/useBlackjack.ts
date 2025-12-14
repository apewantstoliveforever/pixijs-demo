import { useState, useCallback } from 'react';

// --- Types ---
export type Suit = '♠' | '♥' | '♣' | '♦';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardData {
  suit: Suit;
  rank: Rank;
  value: number;
}

// Thêm trạng thái 'betting'
export type GameState = 'betting' | 'playing' | 'player_bust' | 'player_win' | 'dealer_win' | 'push';

// --- Helpers ---
const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardValue = (rank: Rank): number => {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
};

const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({ suit, rank, value: getCardValue(rank) });
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const calculateScore = (hand: CardData[]): number => {
  const validCards = hand.filter(c => c !== undefined && c !== null);
  let score = validCards.reduce((sum, card) => sum + card.value, 0);
  let aces = validCards.filter((c) => c.rank === 'A').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
};

// --- Hook ---
export const useBlackjack = () => {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [dealerHand, setDealerHand] = useState<CardData[]>([]);
  const [gameState, setGameState] = useState<GameState>('betting');
  
  // Betting State
  const [balance, setBalance] = useState(1000); // Vốn khởi điểm 1000
  const [currentBet, setCurrentBet] = useState(0);

  // Thêm tiền cược
  const placeBet = useCallback((amount: number) => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      setCurrentBet(prev => prev + amount);
    }
  }, [balance]);

  // Xóa cược (trả lại tiền)
  const clearBet = useCallback(() => {
    setBalance(prev => prev + currentBet);
    setCurrentBet(0);
  }, [currentBet]);

  // Bắt đầu ván mới (Sau khi kết thúc ván cũ)
  const resetToBetting = useCallback(() => {
    setPlayerHand([]);
    setDealerHand([]);
    setCurrentBet(0); // Reset bet về 0 để cược ván mới
    setGameState('betting');
  }, []);

  const dealGame = useCallback(() => {
    if (currentBet === 0) return; // Phải cược mới được chơi

    const newDeck = createDeck();
    if (newDeck.length < 4) return;

    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    
    // Check Instant Blackjack (Thắng ngay lập tức 3 ăn 2)
    if (calculateScore(pHand) === 21) {
        setGameState('player_win');
        setBalance(prev => prev + currentBet + (currentBet * 1.5)); // Trả lại vốn + lãi 1.5
    }
  }, [currentBet]);

  const hit = useCallback(() => {
    if (gameState !== 'playing') return;
    if (deck.length === 0) return;
    
    const newDeck = [...deck];
    const card = newDeck.pop();
    if (!card) return;

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (calculateScore(newHand) > 21) {
      setGameState('player_bust');
      // Thua -> Mất luôn tiền cược (đã trừ lúc placeBet)
    }
  }, [deck, playerHand, gameState]);

  const stand = useCallback(() => {
    if (gameState !== 'playing') return;

    let currentDeck = [...deck];
    let currentDealerHand = [...dealerHand];
    let dealerScore = calculateScore(currentDealerHand);

    while (dealerScore < 17) {
      if (currentDeck.length === 0) break;
      const card = currentDeck.pop();
      if (!card) break;
      currentDealerHand.push(card);
      dealerScore = calculateScore(currentDealerHand);
    }

    setDealerHand(currentDealerHand);
    setDeck(currentDeck);

    const playerScore = calculateScore(playerHand);
    let finalState: GameState = 'push';

    if (dealerScore > 21) {
      finalState = 'player_win';
    } else if (dealerScore > playerScore) {
      finalState = 'dealer_win';
    } else if (playerScore > dealerScore) {
      finalState = 'player_win';
    } else {
      finalState = 'push';
    }

    setGameState(finalState);

    // Xử lý trả thưởng
    if (finalState === 'player_win') {
        setBalance(prev => prev + (currentBet * 2)); // Trả lại vốn + lãi 1.0
    } else if (finalState === 'push') {
        setBalance(prev => prev + currentBet); // Trả lại vốn
    }
    // dealer_win hoặc player_bust: Không làm gì (tiền đã trừ lúc đặt cược)

  }, [deck, dealerHand, playerHand, gameState, currentBet]);

  return {
    playerHand,
    dealerHand,
    gameState,
    balance,
    currentBet,
    placeBet,
    clearBet,
    resetToBetting,
    dealGame,
    hit,
    stand,
    playerScore: calculateScore(playerHand),
    dealerScore: calculateScore(dealerHand),
  };
};