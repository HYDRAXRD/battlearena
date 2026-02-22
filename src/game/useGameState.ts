import { useReducer, useCallback } from 'react';
import { GameScreen, HydraStats } from './types';
import { INITIAL_HYDRA, SHOP_ITEMS, ENEMIES } from './constants';

export interface GameState {
  screen: GameScreen;
  hydra: HydraStats;
  currentBattle: number;
  tokens: number;
  totalScore: number;
  purchases: Record<string, number>;
}

type Action =
  | { type: 'SET_SCREEN'; screen: GameScreen }
  | { type: 'START_GAME' }
  | { type: 'WIN_BATTLE'; tokens: number; score: number }
  | { type: 'LOSE_GAME' }
  | { type: 'NEXT_BATTLE' }
  | { type: 'HEAL_FULL' }
  | { type: 'PURCHASE'; itemId: string; isFree?: boolean }
  | { type: 'SYNC_TOKENS'; tokens: number }
  | { type: 'RESET' };

const initialState: GameState = {
  screen: 'start',
  hydra: { ...INITIAL_HYDRA },
  currentBattle: 0,
  tokens: 0,
  totalScore: 0,
  purchases: {},
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'START_GAME':
      return { 
        ...initialState, 
        hydra: { ...INITIAL_HYDRA },
        currentBattle: 0,
        screen: 'battle' 
      };
    case 'WIN_BATTLE':
      return {
        ...state,
        tokens: state.tokens + action.tokens,
        totalScore: state.totalScore + action.score,
        screen: 'victory',
      };
    case 'LOSE_GAME':
      return { ...state, screen: 'defeat' };
    case 'NEXT_BATTLE': {
      const next = state.currentBattle + 1;
      if (next >= ENEMIES.length) {
        return { ...state, screen: 'leaderboard' };
      }
      return { 
        ...state, 
        currentBattle: next, 
        screen: 'battle',
        hydra: {
          ...state.hydra,
          hp: state.hydra.maxHp,
          energy: state.hydra.maxEnergy
        }
      };
    }
    case 'HEAL_FULL':
      return {
        ...state,
        hydra: {
          ...state.hydra,
          hp: state.hydra.maxHp,
          energy: state.hydra.maxEnergy,
        },
      };
    case 'PURCHASE': {
      const item = SHOP_ITEMS.find(i => i.id === action.itemId);
      if (!item) return state;
      
      const count = state.purchases[action.itemId] || 0;
      if (count >= item.maxPurchases) return state;
      // Note: Balance check is now done in Index.tsx or Shop component using wallet balance
      
      const h = { ...state.hydra, headPower: [...state.hydra.headPower] as [number, number, number] };
      if (action.itemId.startsWith('head-')) {
        h.headPower[parseInt(action.itemId.split('-')[1])] += 10;
      } else if (action.itemId === 'max-hp') {
        h.maxHp += 20;
        h.hp += 20;
      } else if (action.itemId === 'max-energy') {
        h.maxEnergy += 15;
        h.energy += 15;
      }
      
      return {
        ...state,
        hydra: h,
        // If isFree is true, it means we handled tokens via wallet transaction already
        tokens: action.isFree ? state.tokens : state.tokens - item.cost,
        purchases: { ...state.purchases, [action.itemId]: count + 1 },
      };
    }
    case 'SYNC_TOKENS':
      return { ...state, tokens: action.tokens };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    setScreen: useCallback((screen: GameScreen) => dispatch({ type: 'SET_SCREEN', screen }), []),
    startGame: useCallback(() => dispatch({ type: 'START_GAME' }), []),
    winBattle: useCallback((tokens: number, score: number) => dispatch({ type: 'WIN_BATTLE', tokens, score }), []),
    loseGame: useCallback(() => dispatch({ type: 'LOSE_GAME' }), []),
    nextBattle: useCallback(() => {
      dispatch({ type: 'NEXT_BATTLE' });
    }, []),
    purchase: useCallback((itemId: string, isFree = false) => dispatch({ type: 'PURCHASE', itemId, isFree }), []),
    syncTokens: useCallback((tokens: number) => dispatch({ type: 'SYNC_TOKENS', tokens }), []),
    resetGame: useCallback(() => dispatch({ type: 'RESET' }), []),
  };
}
