export interface SymbolData {
  id: number;
  name: string;
  color: number;
  text: string;
  payout: number;
}

export const REEL_WIDTH = 100;
export const SYMBOL_HEIGHT = 100;
export const VISIBLE_SYMBOLS = 3; 

export const SYMBOLS: SymbolData[] = [
  { id: 0, name: 'Cherry', color: 0xe74c3c, text: '🍒', payout: 2 },
  { id: 1, name: 'Lemon',  color: 0xf1c40f, text: '🍋', payout: 5 },
  { id: 2, name: 'Grape',  color: 0x8e44ad, text: '🍇', payout: 10 },
  { id: 3, name: 'Bell',   color: 0xf39c12, text: '🔔', payout: 20 },
  { id: 4, name: 'Seven',  color: 0x3498db, text: '7️⃣', payout: 50 },
];

export const REEL_STRIPS: number[][] = [
    [0, 1, 0, 2, 0, 1, 3, 0, 1, 2, 0, 4, 0, 1, 2],
    [1, 0, 2, 0, 1, 0, 2, 3, 0, 1, 0, 2, 4, 0, 1],
    [2, 0, 1, 2, 0, 3, 0, 1, 2, 0, 4, 0, 1, 2, 0],
];