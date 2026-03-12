# BattleArena — Como o Jogo Deve Funcionar

> Referencia para testes manuais. Descreve o fluxo completo, mecanicas e valores esperados.

---

## 1. Fluxo de Telas

```
NameEntry -> start (menu) -> battle -> victory -> shop (opcional) -> battle -> ... -> victory (ultimo inimigo) -> leaderboard
                |                                                                          |
                +-> shop -> start                                                          +-> defeat -> start
                +-> leaderboard -> start
```

### Telas disponiveis

| Tela | Descricao |
|---|---|
| **NameEntry** | Campo para digitar nome (1-16 chars). Obrigatorio antes de qualquer tela. |
| **start** | Menu principal. Botoes: Start Game, Shop, Leaderboard. Musica de menu toca. |
| **battle** | Combate automatico em tempo real. Pode abrir shop como overlay durante a batalha. |
| **victory** | Aparece apos derrotar inimigo. Mostra tokens/score ganhos. Botoes: Next Battle, Shop. No ultimo inimigo: View Results. |
| **shop** | Loja de upgrades. Pode ser acessada do menu, da vitoria ou como overlay na batalha. |
| **defeat** | Aparece quando Hydra morre. Botoes: Try Again, Main Menu. Reseta todo progresso. |
| **leaderboard** | Ranking global (top 20). Score do jogador e destacado. Busca dados da API. |

---

## 2. Mecanicas de Combate

### Auto-Ataque do Hydra
- **Intervalo**: a cada **2000ms** (2 segundos)
- **Dano**: `max(1, hydra.attack - enemy.defense)`
- **Miss**: se `Math.random() < enemy.dodgeRate` → MISS (0 dano)

### Auto-Ataque do Inimigo
- **Intervalo**: varia por inimigo (campo `attackSpeed` em ms)
- **Dano base**: `enemy.attack`
- **Modo panico**: se HP do inimigo cai abaixo de `specialThreshold` (% do maxHp), dano vira `floor(enemy.attack * specialMultiplier)`
- **Auto-heal**: alguns inimigos curam `healRate` HP a cada tick de ataque (limitado ao maxHp)

### Energia do Hydra
- Regenera **+5 por segundo** (a cada 1000ms)
- Maximo: `hydra.maxEnergy` (100 base, +15 por upgrade)

### Habilidades (3 cabecas)

| # | Nome | Dano Base | Cura | Custo Energia | Cooldown Base |
|---|---|---|---|---|---|
| 0 | **Liquidity Blast** | 28 | 0 | 30 | 4500ms |
| 1 | **Scalability Strike** | 45 | 0 | 45 | 7000ms |
| 2 | **Atomic Swap** | 18 | 22 | 35 | 5500ms |

- **Formula de dano**: `max(1, baseDamage + hydra.headPower[headIndex] - enemy.defense)`
- **Formula de cura** (Atomic Swap): `healAmount + hydra.headPower[2]`
- **Cooldown efetivo**: `ability.cooldownMs - (compras_de_cooldown * 500ms)`
- Cooldowns decrementam **100ms a cada 100ms**
- Habilidades **nunca erram** (sem dodge check)
- So podem ser usadas com energia suficiente E cooldown zerado

### Condicoes de Vitoria/Derrota
- **Vitoria**: HP do inimigo chega a 0. Transicao para tela `victory` apos 800ms.
- **Derrota**: HP do Hydra chega a 0. Transicao para tela `defeat` apos 800ms.

---

## 3. Progressao de Inimigos (10 batalhas)

| # | Nome | HP | ATK | DEF | Dodge | Vel. Ataque | Especial | Heal | Tokens | Score |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Doge | 100 | 10 | 2 | 8% | 2500ms | — | — | 50 | 100 |
| 2 | Pepe | 130 | 11 | 6 | 5% | 2600ms | — | — | 75 | 200 |
| 3 | Hug | 110 | 9 | 3 | 30% | 2200ms | — | 4/tick | 100 | 300 |
| 4 | Wowo | 140 | 13 | 2 | 8% | 2000ms | <=30% HP → x2.5 dmg | — | 150 | 500 |
| 5 | Shiba Inu | 150 | 14 | 4 | 25% | 1900ms | — | — | 200 | 700 |
| 6 | Bonk | 170 | 16 | 5 | 10% | 1800ms | <=40% HP → x2.0 dmg | — | 250 | 900 |
| 7 | Pengu | 190 | 15 | 9 | 12% | 2000ms | — | 6/tick | 300 | 1100 |
| 8 | Floki | 210 | 18 | 7 | 15% | 1700ms | <=35% HP → x2.8 dmg | — | 350 | 1400 |
| 9 | Dog | 240 | 20 | 10 | 18% | 1600ms | — | 8/tick | 400 | 1700 |
| 10 | Trump | 280 | 22 | 12 | 10% | 1400ms | <=25% HP → x3.0 dmg | — | 500 | 2000 |

**Score maximo possivel** (todas as vitorias): 100+200+300+500+700+900+1100+1400+1700+2000 = **8900**
**Tokens maximo possivel**: 50+75+100+150+200+250+300+350+400+500 = **2375**

---

## 4. Stats Iniciais do Hydra

| Stat | Valor |
|---|---|
| Max HP | 120 |
| HP | 120 |
| Max Energia | 100 |
| Energia | 100 |
| Ataque | 12 |
| Head Power | [0, 0, 0] |
| Level | 1 |

---

## 5. Loja (Shop)

| Item | Efeito | Custo | Max Compras |
|---|---|---|---|
| **Upgrade Blast Head** | +10 dano Liquidity Blast | 40 tokens | 5 |
| **Upgrade Strike Head** | +10 dano Scalability Strike | 40 tokens | 5 |
| **Upgrade Swap Head** | +10 dano/cura Atomic Swap | 40 tokens | 5 |
| **Reinforce Scales** | +20 Max HP e +20 HP atual | 30 tokens | 5 |
| **Expand Energy Core** | +15 Max Energia e +15 Energia atual | 35 tokens | 5 |
| **Temporal Flux** | -0.5s em todos os cooldowns | 60 tokens | 4 |

- Seletor de quantidade: 1, 2 ou 3 por compra (limitado pelo maximo restante)
- Se wallet Radix conectada e tem saldo HYDR: compra via transacao blockchain (tokens in-game nao descontados)
- Se wallet nao conectada: usa tokens in-game

---

## 6. Fluxo Pos-Batalha

### Apos Vitoria
1. Tela `victory` aparece com tokens e score ganhos
2. **Compras sao mantidas** — Hydra entra na proxima batalha com todos os upgrades acumulados
3. Hydra e reconstruido via `buildHydraFromPurchases(state.purchases)` no NEXT_BATTLE
4. Botoes:
   - **Next Battle** → proxima batalha (ou Leaderboard se era o ultimo inimigo)
   - **Shop** → loja para comprar upgrades

### Apos Derrota
1. Tela `defeat` aparece
2. **Tudo reseta**: purchases zeradas, Hydra volta ao estado inicial, battleIndex volta a 0
3. Botoes:
   - **Try Again** → volta ao menu (start)
   - **Main Menu** → volta ao menu (start)

---

## 7. Leaderboard

- **Submissao**: POST automatico ao montar o componente (se `playerName` existe e `totalScore > 0`)
  - Endpoint: `POST /api/leaderboard`
  - Body: `{ name: string, score: number, tokens: number }`
  - Guarda de duplicata via `useRef` (submete apenas 1x por mount)
- **Consulta**: GET automatico ao montar
  - Endpoint: `GET /api/leaderboard`
  - Retorna array de `{ name, score, tokens }` ordenado por score desc (top 20)
- **Upsert**: se jogador ja existe, so atualiza se score novo for maior
- **Jogador atual** e destacado visualmente na lista

---

## 8. Web3 / Radix Wallet

- **Opcional** para jogar — o jogo funciona 100% sem wallet
- Botao `<radix-connect-button>` sempre visivel no canto superior
- Se conectado:
  - Compras na loja enviam transacao real na Radix Stokenet
  - Retira HYDR da conta do jogador e deposita na conta da loja
  - Tokens in-game nao sao descontados (compra "gratis" no jogo)
- Se nao conectado:
  - Compras usam apenas tokens in-game
- Rede: Radix **Stokenet** (testnet)

---

## 9. Audio

| Tela | Comportamento |
|---|---|
| `start` | Musica de menu (loop) |
| `battle` | Musica de batalha (loop) |
| `victory` | Continua musica anterior |
| `defeat` | Para toda musica |
| `leaderboard` | Para toda musica |

- SFX: hit, win, lose, ability, buy
- Toggle mute disponivel na UI
- Audio gerado proceduralmente via Web Audio API (sem arquivos de audio)
