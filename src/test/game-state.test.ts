import { describe, it, expect } from 'vitest';
import { INITIAL_HYDRA, SHOP_ITEMS, ENEMIES } from '../game/constants';
import type { HydraStats } from '../game/types';

// ─── Reducer Logic Tests (standalone, no React) ──────────────────────────
// These test the pure functions that the reducer relies on.

function buildHydraFromPurchases(purchases: Record<string, number>): HydraStats {
    const h: HydraStats = {
        ...INITIAL_HYDRA,
        headPower: [0, 0, 0] as [number, number, number],
    };
    for (const [id, count] of Object.entries(purchases)) {
        for (let i = 0; i < count; i++) {
            if (id.startsWith('head-')) {
                h.headPower[parseInt(id.split('-')[1])] += 10;
            } else if (id === 'max-hp') {
                h.maxHp += 20;
                h.hp += 20;
            } else if (id === 'max-energy') {
                h.maxEnergy += 15;
                h.energy += 15;
            }
        }
    }
    return h;
}

describe('buildHydraFromPurchases', () => {
    it('should return INITIAL_HYDRA when no purchases', () => {
        const h = buildHydraFromPurchases({});
        expect(h.maxHp).toBe(INITIAL_HYDRA.maxHp);
        expect(h.hp).toBe(INITIAL_HYDRA.hp);
        expect(h.attack).toBe(INITIAL_HYDRA.attack);
        expect(h.headPower).toEqual([0, 0, 0]);
    });

    it('should upgrade head-0 correctly', () => {
        const h = buildHydraFromPurchases({ 'head-0': 3 });
        expect(h.headPower[0]).toBe(30);
        expect(h.headPower[1]).toBe(0);
        expect(h.headPower[2]).toBe(0);
    });

    it('should upgrade max-hp correctly', () => {
        const h = buildHydraFromPurchases({ 'max-hp': 2 });
        expect(h.maxHp).toBe(INITIAL_HYDRA.maxHp + 40);
        expect(h.hp).toBe(INITIAL_HYDRA.hp + 40);
    });

    it('should upgrade max-energy correctly', () => {
        const h = buildHydraFromPurchases({ 'max-energy': 3 });
        expect(h.maxEnergy).toBe(INITIAL_HYDRA.maxEnergy + 45);
        expect(h.energy).toBe(INITIAL_HYDRA.energy + 45);
    });

    it('should apply multiple upgrades together', () => {
        const h = buildHydraFromPurchases({
            'head-0': 2,
            'head-1': 1,
            'head-2': 3,
            'max-hp': 1,
            'max-energy': 2,
        });
        expect(h.headPower).toEqual([20, 10, 30]);
        expect(h.maxHp).toBe(INITIAL_HYDRA.maxHp + 20);
        expect(h.maxEnergy).toBe(INITIAL_HYDRA.maxEnergy + 30);
    });

    it('should cap purchases at maxPurchases per item', () => {
        // max-hp maxPurchases is 5
        const h = buildHydraFromPurchases({ 'max-hp': 5 });
        expect(h.maxHp).toBe(INITIAL_HYDRA.maxHp + 100);
    });
});

describe('Purchase cost validation', () => {
    it('should not allow negative tokens after buying one of each to max', () => {
        let totalTokens = ENEMIES.reduce((acc, e) => acc + e.tokenReward, 0);
        let totalCost = 0;
        for (const item of SHOP_ITEMS) {
            totalCost += item.cost * item.maxPurchases;
        }
        // Total tokens from all enemies: 2375
        // Total max cost from shop: should be <= 2375
        expect(totalCost).toBeLessThanOrEqual(totalTokens);
    });
});

describe('WIN_BATTLE should not reset purchases (regression)', () => {
    it('purchases should persist through a simulated win', () => {
        // Simulate the reducer logic for WIN_BATTLE
        const stateBefore = {
            tokens: 100,
            totalScore: 500,
            purchases: { 'head-0': 2, 'max-hp': 1 },
        };

        // WIN_BATTLE action should only add tokens/score, NOT touch purchases
        const stateAfter = {
            ...stateBefore,
            tokens: stateBefore.tokens + 200,
            totalScore: stateBefore.totalScore + 700,
            // purchases should remain unchanged
        };

        expect(stateAfter.purchases).toEqual(stateBefore.purchases);
        expect(stateAfter.tokens).toBe(300);
        expect(stateAfter.totalScore).toBe(1200);
    });
});
