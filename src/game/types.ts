export type GameScreen = 'start' | 'battle' | 'shop' | 'leaderboard' | 'victory' | 'defeat';

export interface HydraStats {
  maxHp: number;
  hp: number;
  maxEnergy: number;
  energy: number;
  level: number;
  attack: number;
  headPower: [number, number, number];
}

export interface EnemyConfig {
  id: string;
  name: string;
  subtitle: string;
  flipX?: boolean;
  maxHp: number;
  attack: number;
  defense: number;
  dodgeRate: number;
  attackSpeed: number;
  specialThreshold?: number;
  specialMultiplier?: number;
  healRate?: number;
  tokenReward: number;
  scoreValue: number;
}

export interface Ability {
  id: string;
  name: string;
  icon: string;
  baseDamage: number;
  healAmount: number;
  energyCost: number;
  cooldownMs: number;
  headIndex: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxPurchases: number;
}

export interface DamagePopup {
  id: number;
  value: number;
  x: number;
  y: number;
  isHeal: boolean;
  isMiss: boolean;
}
