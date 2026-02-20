import { EnemyConfig, Ability, ShopItem, HydraStats } from './types';

export const ENEMIES: EnemyConfig[] = [
  {
    id: 'doge', name: 'Doge', subtitle: 'Much Wow, Very Attack',
    maxHp: 120, attack: 12, defense: 3, dodgeRate: 0.1, attackSpeed: 2200,
    tokenReward: 50, scoreValue: 100,
  },
  {
    id: 'pepe', name: 'Pepe', subtitle: 'Feels Good Shield',
    maxHp: 150, attack: 10, defense: 8, dodgeRate: 0.05, attackSpeed: 2500,
    tokenReward: 75, scoreValue: 200,
  },
  {
    id: 'chill', name: 'Chill Guy', subtitle: 'Low Volatility Vibes',
    maxHp: 100, attack: 8, defense: 4, dodgeRate: 0.35, attackSpeed: 2000,
    healRate: 5, tokenReward: 100, scoreValue: 300,
  },
  {
    id: 'wojak', name: 'Wojak', subtitle: 'Pink Panic Seller',
    maxHp: 130, attack: 14, defense: 2, dodgeRate: 0.08, attackSpeed: 1800,
    specialThreshold: 0.3, specialMultiplier: 3, tokenReward: 150, scoreValue: 500,
  },
];

export const ABILITIES: Ability[] = [
  { id: 'liquidity-blast', name: 'Liquidity Blast', icon: '💥', baseDamage: 25, healAmount: 0, energyCost: 30, cooldownMs: 5000, headIndex: 0 },
  { id: 'scalability-strike', name: 'Scalability Strike', icon: '⚡', baseDamage: 40, healAmount: 0, energyCost: 45, cooldownMs: 8000, headIndex: 1 },
  { id: 'atomic-swap', name: 'Atomic Swap', icon: '🔄', baseDamage: 15, healAmount: 20, energyCost: 35, cooldownMs: 6000, headIndex: 2 },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'head-0', name: 'Upgrade Blast Head', description: '+10 Liquidity Blast dmg', cost: 40, maxPurchases: 5 },
  { id: 'head-1', name: 'Upgrade Strike Head', description: '+10 Scalability Strike dmg', cost: 40, maxPurchases: 5 },
  { id: 'head-2', name: 'Upgrade Swap Head', description: '+10 Atomic Swap dmg & heal', cost: 40, maxPurchases: 5 },
  { id: 'max-hp', name: 'Reinforce Scales', description: '+20 Max HP', cost: 30, maxPurchases: 5 },
  { id: 'max-energy', name: 'Expand Energy Core', description: '+15 Max Energy', cost: 35, maxPurchases: 5 },
  { id: 'cooldown', name: 'Temporal Flux', description: '-0.5s all cooldowns', cost: 60, maxPurchases: 4 },
];

export const INITIAL_HYDRA: HydraStats = {
  maxHp: 100, hp: 100, maxEnergy: 100, energy: 100,
  level: 1, attack: 10, headPower: [0, 0, 0],
};

export const PIXEL_PALETTE: Record<string, string> = {
  'p': '#8b5cf6', 'P': '#6d28d9', 'b': '#3b82f6', 'B': '#1d4ed8',
  'c': '#14b8a6', 'C': '#06d6a0', 'w': '#f8fafc', 'W': '#cbd5e1',
  'g': '#22c55e', 'G': '#15803d', 'y': '#fbbf24', 'Y': '#f59e0b',
  'o': '#fb923c', 'O': '#ea580c', 'r': '#ef4444', 'R': '#dc2626',
  'k': '#f472b6', 'K': '#ec4899', 'n': '#1e1b4b', 'N': '#0f172a',
  'd': '#64748b', 'D': '#475569', 'e': '#fde68a', 'S': '#94a3b8',
  't': '#a78bfa', '.': '',
};

export const HYDRA_ART = [
  '.p...p...p.',
  'pcp.pcp.pcp',
  'pwp.pwp.pwp',
  'ppp.ppp.ppp',
  '.ppppppppp.',
  '..ppcpcpp..',
  '..ppppppp..',
  '..ppppppp..',
  '...ppppp...',
  '...pp.pp...',
  '..pp...pp..',
  '..cc...cc..',
];

export const CHARACTER_ART: Record<string, string[]> = {
  hydra: HYDRA_ART,
  doge: [
    '..SSSSS..',
    '.S.....S.',
    'S.ooooo.S',
    'S.o.o.o.S',
    'S.ooooo.S',
    'S.o.n.n.S',
    'S.ooooo.S',
    '.S.ooo.S.',
    '..SoooS..',
    '...ooo...',
    '..ooooo..',
    '...ooo...',
  ],
  pepe: [
    '..ggggg..',
    '.ggggggg.',
    '.gwg.gwg.',
    '.gng.gng.',
    '.ggggggg.',
    '..grrgg..',
    '..ggggg..',
    'DDgggggDD',
    '.D.ggg.D.',
    '...ggg...',
    '..gg.gg..',
    '.gg...gg.',
  ],
  chill: [
    '..eeeee..',
    '.eeeeeee.',
    '.eDDDDDe.',
    '.eeeeeee.',
    '.ee.e.ee.',
    '..eeeee..',
    '..bbbbb..',
    '.bbbbbbb.',
    '.bbbbbbb.',
    '..bbbbb..',
    '..bb.bb..',
    '.DD..DD..',
  ],
  wojak: [
    '..kkkkk..',
    '.kkkkkkk.',
    '.kwk.kwk.',
    '.kkk.kkk.',
    '.kkkkkkk.',
    '.kk.r.kk.',
    '..kkkkk..',
    '...kkk...',
    '..kkkkk..',
    '.kkkkkkk.',
    '..kk.kk..',
    '.kk...kk.',
  ],
};

export const LEADERBOARD_DATA: { name: string; score: number }[] = [];
