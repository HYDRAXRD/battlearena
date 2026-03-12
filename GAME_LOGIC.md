# Battle Arena — Game Logic

## Conceito

Jogo de batalha automática por turnos em tempo real. O jogador controla a **Hydra**, uma criatura com 3 cabeças/habilidades, e enfrenta **10 inimigos sequenciais** (meme coins). Entre batalhas pode comprar upgrades com tokens ganhos. Não há RNG de dano — o combate é determinístico, com dodge como único elemento aleatório.

---

## Fluxo de Telas

```
NameEntry → start → battle ⇄ shop(overlay)
                  ↓           ↑
                victory → shop
                  ↓
                battle (próxima) ...
                  ↓ (após 10 batalhas)
                leaderboard

battle → defeat → start
```

| Tela        | Trigger de entrada                        | Trigger de saída              |
|-------------|-------------------------------------------|-------------------------------|
| `start`     | inicial / reset                           | startGame → `battle`          |
| `battle`    | startGame / NEXT_BATTLE                   | onWin → `victory` / onLose → `defeat` |
| `victory`   | WIN_BATTLE                                | NEXT_BATTLE → `battle` / última → `leaderboard` |
| `shop`      | botão Shop (start ou victory)             | onBack → tela anterior        |
| `defeat`    | LOSE_GAME                                 | resetGame → `start`           |
| `leaderboard`| última vitória / botão                   | onBack → `start`              |

---

## Jogador: Hydra

### Atributos iniciais

| Atributo      | Valor | Descrição                          |
|---------------|-------|------------------------------------|
| `maxHp`       | 120   | HP máximo                          |
| `hp`          | 120   | HP atual                           |
| `maxEnergy`   | 100   | Energia máxima                     |
| `energy`      | 100   | Energia atual                      |
| `attack`      | 12    | Dano base do auto-ataque           |
| `headPower`   | [0,0,0] | Bônus de dano/cura por cabeça    |
| `level`       | 1     | Apenas display                     |

### Upgrades (Shop)

| Item          | Efeito                        | Custo | Máx |
|---------------|-------------------------------|-------|-----|
| `head-0`      | `headPower[0] += 10`          | 40    | 5   |
| `head-1`      | `headPower[1] += 10`          | 40    | 5   |
| `head-2`      | `headPower[2] += 10`          | 40    | 5   |
| `max-hp`      | `maxHp += 20`, `hp += 20`     | 30    | 5   |
| `max-energy`  | `maxEnergy += 15`, `energy += 15` | 35 | 5  |
| `cooldown`    | `-500ms` em todos os cooldowns | 60   | 4   |

Ao avançar de batalha (`NEXT_BATTLE`), a Hydra é **reconstruída do zero** aplicando todas as compras acumuladas sobre `INITIAL_HYDRA`. Ao perder (`LOSE_GAME`), todas as compras são apagadas.

---

## Inimigos

10 inimigos em sequência. Campos: `maxHp`, `attack`, `defense`, `dodgeRate`, `attackSpeed (ms)`, `tokenReward`, `scoreValue`, opcionais: `healRate`, `specialThreshold`, `specialMultiplier`.

| # | Nome       | HP  | ATK | DEF | Dodge | Speed | Heal | Special (hp%) | Mult | Reward | Score |
|---|------------|-----|-----|-----|-------|-------|------|---------------|------|--------|-------|
| 1 | Doge       | 100 | 10  | 2   | 8%    | 2500  | —    | —             | —    | 50     | 100   |
| 2 | Pepe       | 130 | 11  | 6   | 5%    | 2600  | —    | —             | —    | 75     | 200   |
| 3 | Hug        | 110 | 9   | 3   | 30%   | 2200  | 4    | —             | —    | 100    | 300   |
| 4 | Wowo       | 140 | 13  | 2   | 8%    | 2000  | —    | ≤30%          | 2.5x | 150    | 500   |
| 5 | Shiba Inu  | 150 | 14  | 4   | 25%   | 1900  | —    | —             | —    | 200    | 700   |
| 6 | Bonk       | 170 | 16  | 5   | 10%   | 1800  | —    | ≤40%          | 2.0x | 250    | 900   |
| 7 | Pengu      | 190 | 15  | 9   | 12%   | 2000  | 6    | —             | —    | 300    | 1100  |
| 8 | Floki      | 210 | 18  | 7   | 15%   | 1700  | —    | ≤35%          | 2.8x | 350    | 1400  |
| 9 | Dog        | 240 | 20  | 10  | 18%   | 1600  | 8    | —             | —    | 400    | 1700  |
|10 | Trump      | 280 | 22  | 12  | 10%   | 1400  | —    | ≤25%          | 3.0x | 500    | 2000  |

---

## Sistema de Batalha

### Auto-ataque da Hydra
- **Intervalo:** 2000ms fixo
- **Dano:** `max(1, hydra.attack - enemy.defense)`
- **Dodge:** `Math.random() < enemy.dodgeRate` → ataque errado (MISS), sem dano
- **Sem variação randômica de dano**

### Auto-ataque do Inimigo
- **Intervalo:** `enemy.attackSpeed` (varia por inimigo, 1400–2600ms)
- **Dano base:** `enemy.attack`
- **Special attack:** se `enemy.hp / enemy.maxHp <= specialThreshold` → `floor(attack × specialMultiplier)`
- **Heal:** a cada tick de ataque, se `healRate` → `enemyHp = min(maxHp, enemyHp + healRate)`

### Energia
- Regenera `+5/s` (a cada 1000ms) até `hydra.maxEnergy`
- Consumida pelas habilidades

### Fim de batalha
- Inimigo chega a 0 HP → `onWin(tokenReward, scoreValue)` após 800ms → tela `victory`
- Hydra chega a 0 HP → `onLose()` após 800ms → tela `defeat`
- `battleOverRef` garante que apenas um evento de fim dispara

---

## Habilidades (Abilities)

Cooldowns reduzidos por `cooldownReduction × 500ms` (item do shop).

| ID                  | Nome               | Icon | Dano base | Cura | Energia | Cooldown | Head |
|---------------------|--------------------|------|-----------|------|---------|----------|------|
| `liquidity-blast`   | Liquidity Blast    | 💥   | 28        | 0    | 30      | 4500ms   | 0    |
| `scalability-strike`| Scalability Strike | ⚡   | 45        | 0    | 45      | 7000ms   | 1    |
| `atomic-swap`       | Atomic Swap        | 🔄   | 18        | 22   | 35      | 5500ms   | 2    |

### Cálculo ao usar
```
dano  = max(1, ab.baseDamage + hydra.headPower[ab.headIndex] - enemy.defense)
cura  = ab.healAmount + (ab.headIndex === 2 ? hydra.headPower[2] : 0)
cd    = ab.cooldownMs - (cooldownReduction × 500)
```
Apenas `Atomic Swap` cura (headIndex 2). O upgrade `head-2` aumenta tanto o dano quanto a cura dessa skill.

---

## Tokens e Score

- **Ganho:** apenas ao vencer batalha → `tokens += enemy.tokenReward`, `totalScore += enemy.scoreValue`
- **Gasto:** compras no shop → `tokens -= item.cost × qty`
- **Score total máximo** (sem upgrades): 8900 pontos (soma de todos `scoreValue`)
- **Tokens máximos** (sem upgrades): 2375 tokens (soma de todos `tokenReward`)
- Integração com wallet Radix: compra on-chain usa tokens da wallet e não desconta tokens in-game (`isFree: true`)

---

## Estado do Jogo (Reducer)

```
GameState {
  screen: GameScreen
  hydra: HydraStats
  currentBattle: number       // índice 0–9
  tokens: number
  totalScore: number
  purchases: Record<id, qty>
  battleStartPurchases: Record<id, qty>  // snapshot ao entrar na batalha
}
```

| Action         | Efeito principal                                                  |
|----------------|-------------------------------------------------------------------|
| `START_GAME`   | Reset tudo exceto `tokens`; `currentBattle=0`; `screen='battle'` |
| `WIN_BATTLE`   | `tokens +=`, `totalScore +=`; `screen='victory'`                 |
| `NEXT_BATTLE`  | Guard: só se `screen==='victory'`. Hydra reconstruída das compras; `currentBattle++`; `screen='battle'` |
| `LOSE_GAME`    | Limpa compras; Hydra reset; `screen='defeat'`                    |
| `PURCHASE`     | Aplica upgrade na Hydra; subtrai tokens (se `!isFree`)           |
| `RESET`        | Estado completamente inicial (tokens e score zeram)              |
| `HEAL_FULL`    | `hp = maxHp`, `energy = maxEnergy`                               |
| `SYNC_TOKENS`  | Substitui `tokens` (sincronização com wallet)                    |

---

## Problemas de Complexidade Identificados

1. **Estado de batalha duplicado** — HP em `useState` + `useRef` simultaneamente para contornar stale closures nos intervals
2. **Máquina de estados implícita** — fluxo dividido entre reducer (`screen`) e 5 estados locais em `Index.tsx`
3. **4 setInterval concorrentes** por batalha (hydra-atk, enemy-atk, energia, cooldown-tick)
4. **`battleStartPurchases`** existe no estado mas nunca é usado para consumo — campo morto
5. **`cooldown`** não modifica `HydraStats` — efeito lido diretamente de `state.purchases['cooldown']` em `BattleArena`, acoplamento implícito
