# Especificacao de Gameplay - BattleArena

## Modelo de dominio

Entidades:
- `HydraStats`: `maxHp`, `hp`, `maxEnergy`, `energy`, `level`, `attack`, `headPower[3]`
- `EnemyConfig`: `maxHp`, `attack`, `defense`, `dodgeRate`, `attackSpeed`, `tokenReward`, `scoreValue`, opcionais `specialThreshold`, `specialMultiplier`, `healRate`
- `Ability`: `baseDamage`, `healAmount`, `energyCost`, `cooldownMs`, `headIndex`
- `ShopItem`: `cost`, `maxPurchases`, efeito em `HydraStats` ou cooldown global

Invariantes:
- `hp` sempre em `[0, maxHp]`
- `energy` sempre em `[0, maxEnergy]`
- dano da Hydra nunca menor que `1`
- `purchases[itemId] <= maxPurchases`
- `currentBattle` avanca apenas a partir de `victory`

## Maquina de estados

Estados (`GameScreen`):
- `start`
- `battle`
- `victory`
- `defeat`
- `shop`
- `leaderboard`

Transicoes:
- `start --START_GAME--> battle`
- `battle --WIN_BATTLE--> victory`
- `battle --LOSE_GAME--> defeat`
- `victory --NEXT_BATTLE (ha proxima)--> battle`
- `victory --NEXT_BATTLE (fim)--> leaderboard`
- `start|victory --SET_SCREEN(shop)--> shop`
- `shop --SET_SCREEN(shopReturn)--> start|victory`
- `defeat --RESET--> start`
- `leaderboard --SET_SCREEN(start)--> start`

Guarda de progressao:
- `NEXT_BATTLE` no reducer so executa se `screen === 'victory'`.

## Loop de combate (pseudo-codigo)

```text
onBattleStart:
  battleOver = false
  enemy = ENEMIES[currentBattle]
  hydraHp = hydra.hp
  hydraEnergy = hydra.energy
  enemyHp = enemy.maxHp
  cooldowns = {}

every 2000ms (hydra auto-attack):
  if battleOver: return
  if random() < enemy.dodgeRate: MISS; return
  dmg = max(1, hydra.attack - enemy.defense)
  enemyHp = max(0, enemyHp - dmg)
  if enemyHp == 0 and not battleOver:
    battleOver = true
    after 800ms -> onWin(enemy.tokenReward, enemy.scoreValue)

every enemy.attackSpeed ms (enemy auto-attack):
  if battleOver or enemyHp <= 0: return
  dmg = enemy.attack
  if has special and enemyHp/enemy.maxHp <= specialThreshold:
    dmg = floor(enemy.attack * specialMultiplier)
  hydraHp = max(0, hydraHp - dmg)
  if hydraHp == 0 and not battleOver:
    battleOver = true
    after 800ms -> onLose()
  if enemy.healRate:
    enemyHp = min(enemy.maxHp, enemyHp + enemy.healRate)

every 1000ms (energy regen):
  if not battleOver:
    hydraEnergy = min(hydra.maxEnergy, hydraEnergy + 5)

every 100ms (cooldown tick):
  for each ability in cooldowns:
    cooldown = max(0, cooldown - 100)

onAbilityCast(i):
  if battleOver: return
  if cooldown > 0 or energy < cost: return
  dmg = max(1, baseDamage + headPower[headIndex] - enemy.defense)
  heal = healAmount + (headIndex == 2 ? headPower[2] : 0)
  energy -= cost
  enemyHp = max(0, enemyHp - dmg)
  if enemyHp == 0 and not battleOver:
    battleOver = true
    after 800ms -> onWin(reward, score)
  if heal > 0:
    hydraHp = min(maxHp, hydraHp + heal)
  cooldown = cooldownMs - cooldownReduction * 500
```

## Formulas exatas

- Dodge check: `Math.random() < enemy.dodgeRate`
- Dano auto Hydra: `max(1, hydra.attack - enemy.defense)`
- Dano habilidade: `max(1, ability.baseDamage + hydra.headPower[ability.headIndex] - enemy.defense)`
- Cura habilidade: `ability.healAmount + (ability.headIndex === 2 ? hydra.headPower[2] : 0)`
- Dano especial inimigo: `floor(enemy.attack * enemy.specialMultiplier)` se `enemyHp / enemy.maxHp <= enemy.specialThreshold`
- Regen energia: `+5` por segundo ate `hydra.maxEnergy`
- Cooldown final ao cast: `ability.cooldownMs - cooldownReduction * 500`

## Economia

Ganhos por vitoria:
- `tokens += enemy.tokenReward`
- `totalScore += enemy.scoreValue`

Gastos no shop:
- `totalCost = item.cost * qtyEfetiva`
- `tokens -= totalCost` (exceto `isFree=true`)

Persistencia de upgrades na run:
- `purchases` acumulam entre vitorias
- em `NEXT_BATTLE`, Hydra e reconstruida de `INITIAL_HYDRA + purchases`
- em `LOSE_GAME`, upgrades/compras sao zerados

## Dados concretos do balance atual

Hydra inicial:
- `maxHp=120`, `hp=120`, `maxEnergy=100`, `energy=100`, `attack=12`, `headPower=[0,0,0]`

Habilidades:
- `liquidity-blast`: dano `28`, cura `0`, energia `30`, cd `4500`, head `0`
- `scalability-strike`: dano `45`, cura `0`, energia `45`, cd `7000`, head `1`
- `atomic-swap`: dano `18`, cura `22`, energia `35`, cd `5500`, head `2`

Itens de shop:
- `head-0`: `+10` Liquidity Blast, custo `40`, max `5`
- `head-1`: `+10` Scalability Strike, custo `40`, max `5`
- `head-2`: `+10` Atomic Swap dano/cura, custo `40`, max `5`
- `max-hp`: `+20` Max HP, custo `30`, max `5`
- `max-energy`: `+15` Max Energy, custo `35`, max `5`
- `cooldown`: `-0.5s` cooldown global, custo `60`, max `4`

Inimigos (ordem):
- Doge, Pepe, Hug, Wowo, Shiba Inu, Bonk, Pengu, Floki, Dog, Trump

## Complexidade acidental (resumo)

- Combate usa `useState` + `useRef` para os mesmos atributos (HP), aumentando carga mental.
- Quatro timers independentes (ataque Hydra, ataque inimigo, energia, cooldown) criam comportamento temporal dificil de rastrear.
- Regras de progressao espalhadas entre reducer e logica de pagina (`Index.tsx`).
- Economia possui dois caminhos (in-game vs wallet), adicionando ramificacoes de estado.
