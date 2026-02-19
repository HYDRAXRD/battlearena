

# Hydra's Crypto Clash — Implementation Plan

## Overview
A 2D battle arena game with pixel art aesthetics, hybrid combat (real-time auto-attacks + cooldown-based specials), and a dark neon Web3 theme. Session-only data, no backend needed.

---

## Screen 1: Start Screen
- Game logo "Hydra's Crypto Clash" with glowing neon animation
- Pixel art Hydra mascot (multi-headed purple/blue dragon)
- "Start Game", "Leaderboard", and "Shop" buttons
- Starry animated background with floating blockchain-themed particles

## Screen 2: Battle Arena
- **Arena**: A floating circular platform with a starry space/blockchain background
- **Hydra (left side)**: Pixel art dragon with 3 heads, health bar, energy bar, and level display
- **Enemy (right side)**: Current meme opponent with health bar and name
- **Combat flow**:
  - Hydra auto-attacks every ~2 seconds with animation
  - Enemy auto-attacks back on their own timer
  - 3 special ability buttons at the bottom with cooldown timers:
    - "Liquidity Blast" (AoE damage)
    - "Scalability Strike" (high single-target damage)
    - "Atomic Swap" (heal + damage)
  - Hit animations, damage numbers, and health bar changes via Framer Motion
- **Battle end**: Victory screen with token rewards, or defeat screen with retry option

## Screen 3: Enemy Roster (4 Battles)
Linear progression through 4 unique bosses, each with distinct pixel art and mechanics:
1. **Doge** — Space suit dog, "Much Wow" soundwave attacks, moderate stats
2. **Pepe** — Frog with shield, "Green Candle" spear attacks, high defense
3. **Chill Guy** — Relaxed character, high dodge rate, "Low Volatility" self-heal
4. **Wojak (Pink)** — When below 30% HP, triggers "Panic Sell" massive burst damage

## Screen 4: Shop
- Spend earned tokens to upgrade Hydra:
  - Upgrade each head (boost specific ability damage/effects)
  - Increase max HP or max Energy
  - Reduce cooldown times
- Pixel art item cards with cost display
- Session-only currency and upgrades

## Screen 5: Leaderboard
- Mock leaderboard with fake player names and scores
- Player's current run score displayed and ranked
- Neon-styled table with pixel art trophies

## Visual Design
- **Theme**: Dark background (#0a0a1a) with purple and teal neon accents
- **Art**: Pixel art characters and UI elements
- **Animations**: Framer Motion for attacks, hits, transitions, and UI elements
- **Typography**: Pixel/retro font for game text
- **Responsive**: Scales for desktop and mobile with touch-friendly ability buttons

## Audio (Visual Indicators)
- Since browser audio is complex, we'll use visual "sound effect" indicators (screen shake, flash effects) to simulate impact
- "Cha-ching" token reward animation with particle effects

