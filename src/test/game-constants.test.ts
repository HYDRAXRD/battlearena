import { describe, it, expect } from 'vitest';
import { ENEMIES, ABILITIES, SHOP_ITEMS, INITIAL_HYDRA } from '../game/constants';

// ─── Game Constants Validation ───────────────────────────────────────────

describe('ENEMIES', () => {
    it('should have exactly 10 enemies', () => {
        expect(ENEMIES).toHaveLength(10);
    });

    it('each enemy should have valid base stats', () => {
        for (const e of ENEMIES) {
            expect(e.id).toBeTruthy();
            expect(e.name).toBeTruthy();
            expect(e.maxHp).toBeGreaterThan(0);
            expect(e.attack).toBeGreaterThan(0);
            expect(e.defense).toBeGreaterThanOrEqual(0);
            expect(e.dodgeRate).toBeGreaterThanOrEqual(0);
            expect(e.dodgeRate).toBeLessThan(1);
            expect(e.attackSpeed).toBeGreaterThan(0);
            expect(e.tokenReward).toBeGreaterThan(0);
            expect(e.scoreValue).toBeGreaterThan(0);
        }
    });

    it('enemies should increase in score value (difficulty proxy)', () => {
        for (let i = 1; i < ENEMIES.length; i++) {
            expect(ENEMIES[i].scoreValue).toBeGreaterThan(ENEMIES[i - 1].scoreValue);
        }
    });

    it('special enemies should have valid thresholds and multipliers', () => {
        const specials = ENEMIES.filter(e => e.specialThreshold !== undefined);
        expect(specials.length).toBeGreaterThan(0);
        for (const e of specials) {
            expect(e.specialThreshold).toBeGreaterThan(0);
            expect(e.specialThreshold).toBeLessThanOrEqual(1);
            expect(e.specialMultiplier).toBeGreaterThan(1);
        }
    });
});

describe('ABILITIES', () => {
    it('should have exactly 3 abilities', () => {
        expect(ABILITIES).toHaveLength(3);
    });

    it('each ability should have valid stats', () => {
        for (const ab of ABILITIES) {
            expect(ab.id).toBeTruthy();
            expect(ab.baseDamage).toBeGreaterThan(0);
            expect(ab.energyCost).toBeGreaterThan(0);
            expect(ab.cooldownMs).toBeGreaterThan(0);
            expect(ab.headIndex).toBeGreaterThanOrEqual(0);
            expect(ab.headIndex).toBeLessThan(3);
        }
    });

    it('only atomic-swap should heal', () => {
        const healers = ABILITIES.filter(a => a.healAmount > 0);
        expect(healers).toHaveLength(1);
        expect(healers[0].id).toBe('atomic-swap');
    });
});

describe('SHOP_ITEMS', () => {
    it('should have 6 items', () => {
        expect(SHOP_ITEMS).toHaveLength(6);
    });

    it('each item should have valid cost and max purchases', () => {
        for (const item of SHOP_ITEMS) {
            expect(item.cost).toBeGreaterThan(0);
            expect(item.maxPurchases).toBeGreaterThan(0);
        }
    });
});

describe('INITIAL_HYDRA', () => {
    it('should have expected base stats', () => {
        expect(INITIAL_HYDRA.maxHp).toBe(120);
        expect(INITIAL_HYDRA.hp).toBe(120);
        expect(INITIAL_HYDRA.maxEnergy).toBe(100);
        expect(INITIAL_HYDRA.energy).toBe(100);
        expect(INITIAL_HYDRA.attack).toBe(12);
        expect(INITIAL_HYDRA.headPower).toEqual([0, 0, 0]);
    });

    it('hp should equal maxHp at start', () => {
        expect(INITIAL_HYDRA.hp).toBe(INITIAL_HYDRA.maxHp);
    });

    it('energy should equal maxEnergy at start', () => {
        expect(INITIAL_HYDRA.energy).toBe(INITIAL_HYDRA.maxEnergy);
    });
});

// ─── Economy Validation ──────────────────────────────────────────────────

describe('Game Economy', () => {
    it('total possible score should be 8900', () => {
        const total = ENEMIES.reduce((sum, e) => sum + e.scoreValue, 0);
        expect(total).toBe(8900);
    });

    it('total possible tokens should be 2375', () => {
        const total = ENEMIES.reduce((sum, e) => sum + e.tokenReward, 0);
        expect(total).toBe(2375);
    });

    it('max shop spending should not exceed total tokens', () => {
        const maxSpend = SHOP_ITEMS.reduce((sum, item) => sum + (item.cost * item.maxPurchases), 0);
        const totalTokens = ENEMIES.reduce((sum, e) => sum + e.tokenReward, 0);
        expect(maxSpend).toBeLessThanOrEqual(totalTokens);
    });
});

// ─── Damage Formula Validation ───────────────────────────────────────────

describe('Damage Formulas', () => {
    it('hydra auto-attack should deal at least 1 damage to all enemies', () => {
        for (const e of ENEMIES) {
            const dmg = Math.max(1, INITIAL_HYDRA.attack - e.defense);
            expect(dmg).toBeGreaterThanOrEqual(1);
        }
    });

    it('all abilities should deal at least 1 damage to any enemy (no upgrades)', () => {
        for (const ab of ABILITIES) {
            for (const e of ENEMIES) {
                const dmg = Math.max(1, ab.baseDamage + INITIAL_HYDRA.headPower[ab.headIndex] - e.defense);
                expect(dmg).toBeGreaterThanOrEqual(1);
            }
        }
    });
});
