# BattleArena — Verificacao de Bugs Corrigidos

> Checklist para testar manualmente se os bugs foram realmente resolvidos.
> Rode o app localmente com `npm run dev` e siga cada teste.

---

## CRITICOS

### BUG-NEW-01: WIN_BATTLE resetava purchases (jogo travava na 2a batalha)

**O que acontecia**: Apos vencer a 1a batalha, os upgrades comprados eram zerados. O Hydra entrava na 2a batalha com stats iniciais (120 HP, 12 ATK, sem head power).

**Como testar**:
1. Inicie o jogo (Start Game)
2. Venca a 1a batalha (Doge)
3. Na tela de vitoria, abra a **Shop** e compre um upgrade (ex: Upgrade Blast Head)
4. Volte e clique **Next Battle**
5. **Verifique**: O Hydra deve ter os stats do upgrade aplicados (ex: Liquidity Blast deve causar mais dano se comprou Blast Head)
6. Venca a 2a batalha (Pepe)
7. Clique **Next Battle**
8. **Verifique**: O Hydra ainda deve manter TODOS os upgrades das compras anteriores
9. **PASS se**: Stats acumulam corretamente entre batalhas
10. **FAIL se**: Stats resetam apos qualquer vitoria

---

### BUG-NEW-02: Intervalos de ataque nao reiniciavam entre batalhas

**O que acontecia**: Ao mudar de batalha, os setInterval da batalha anterior continuavam rodando. Isso causava ataques duplos ou fantasmas do inimigo anterior.

**Como testar**:
1. Inicie o jogo e venca a 1a batalha
2. Clique **Next Battle**
3. **Observe os logs de combate** (painel lateral ou popups de dano)
4. **Verifique**: Apenas o inimigo atual (Pepe) deve atacar, nao o Doge
5. O dano recebido deve ser consistente com os stats do Pepe (ATK 11), nao do Doge (ATK 10)
6. Repita para a 3a batalha
7. **PASS se**: Apenas ataques do inimigo corrente aparecem, sem dano fantasma
8. **FAIL se**: Dano extra aparece de inimigos anteriores, ou HP cai rapido demais

---

### BUG-NEW-03: Inimigo nao espelhado (ambos olham pro mesmo lado)

**O que acontecia**: A imagem do inimigo nao tinha `scaleX(-1)`, entao Hydra e inimigo ficavam virados para o mesmo lado.

**Como testar**:
1. Inicie uma batalha
2. **Observe visualmente**: O Hydra deve estar a esquerda olhando para a direita
3. O inimigo deve estar a direita **olhando para a esquerda** (espelhado)
4. Teste em varias batalhas (inimigos diferentes)
5. **PASS se**: Os personagens se encaram (olham um para o outro)
6. **FAIL se**: Ambos olham para a mesma direcao

---

### BUG-01: useAbility chamado dentro de onClick (violacao Rules of Hooks)

**O que acontecia**: A funcao `useAbility` era chamada dentro de um callback onClick. Isso violava as regras de hooks do React e podia causar crashes imprevistos.

**Como testar**:
1. Inicie uma batalha
2. Espere a energia acumular (barra de energia encher)
3. **Clique em cada uma das 3 habilidades**: Liquidity Blast, Scalability Strike, Atomic Swap
4. **Verifique**: Cada habilidade deve funcionar normalmente (popup de dano aparece, cooldown inicia)
5. Abra o console do navegador (F12 → Console)
6. **Verifique**: Nenhum erro de "Hooks can only be called inside..." deve aparecer
7. **PASS se**: Habilidades funcionam sem erros no console
8. **FAIL se**: Crash, freeze, ou erro de hooks no console

---

### BUG-02: Texto corrompido no className (overlay de cooldown quebrado)

**O que acontecia**: O overlay de cooldown das habilidades tinha um className com texto de instrucao misturado: `bg-blackFix: add null checks...` em vez de `bg-black/60`.

**Como testar**:
1. Inicie uma batalha
2. Use uma habilidade (ex: Liquidity Blast)
3. **Observe o botao da habilidade durante o cooldown**
4. **Verifique**: Deve aparecer um overlay semi-transparente escuro (preto 60% opacidade) sobre o botao com o tempo restante
5. O overlay NAO deve ter fundo totalmente opaco, nem estar invisivel
6. **PASS se**: Overlay de cooldown e visivel com fundo escuro semi-transparente
7. **FAIL se**: Overlay invisivel, totalmente opaco, ou com visual quebrado

---

## ALTOS

### BUG-03: Imagem do inimigo "Floki" nao aparecia

**O que acontecia**: O inimigo Floki tinha id `floki` mas o mapa de imagens so tinha a chave `early`. A imagem nao carregava.

**Como testar**:
1. Jogue ate a **8a batalha** (Floki)
2. **Verifique**: O inimigo Floki deve exibir uma imagem PNG real (nao pixel art generico de fallback)
3. **PASS se**: Imagem do Floki aparece corretamente
4. **FAIL se**: Apenas pixel art generico ou imagem quebrada

---

### BUG-NEW-04: Leaderboard nunca salvava nem buscava scores (sempre vazio)

**O que acontecia**: O componente Leaderboard era 100% local — nao fazia fetch para a API. Scores nunca eram persistidos.

**Como testar**:
1. Complete o jogo inteiro (venca todas as 10 batalhas) ou morra em alguma
2. Acesse o **Leaderboard** (via View Results apos ultima vitoria, ou pelo menu)
3. **Verifique**: Deve fazer loading dos scores globais (pode mostrar spinner/texto de loading)
4. **Verifique**: Seu score deve aparecer na lista com seu nome destacado
5. **Feche e reabra o navegador** (nova sessao)
6. Acesse o Leaderboard novamente pelo menu
7. **Verifique**: O score da sessao anterior deve estar persistido (vindo da API)
8. **PASS se**: Scores persistem entre sessoes e aparecem corretamente
9. **FAIL se**: Leaderboard vazio apos recarregar pagina

> **Nota**: Em desenvolvimento local, o KV e efemero (dados perdem ao reiniciar wrangler). Para testar persistencia real, use `npx wrangler pages dev dist --kv BATTLE_ARENA_KV` e mantenha o server rodando entre testes.

---

### BUG-05: Funcao `connect()` da wallet estava vazia

**O que acontecia**: Chamar `connect()` programaticamente nao fazia nada — a funcao era um no-op.

**Como testar**:
1. Clique no botao **Radix Connect** (canto superior)
2. **Verifique**: Deve abrir o dialogo de conexao da wallet Radix
3. Se tiver a Radix Wallet instalada, tente conectar
4. **PASS se**: Fluxo de conexao inicia normalmente
5. **FAIL se**: Nada acontece ao clicar

> **Nota**: O principal fluxo de conexao e gerenciado pelo web component `<radix-connect-button>`. Esta correcao garante que chamadas programaticas tambem funcionem.

---

## LINT / QUALIDADE

### LINT-02: require() no tailwind.config.ts

**Como verificar**: Execute `npm run lint` — nao deve haver erro `@typescript-eslint/no-require-imports` em `tailwind.config.ts`.

---

### LINT-03: @ts-ignore no RadixConnectButton.tsx

**Como verificar**: Execute `npm run lint` — nao deve haver erro `@typescript-eslint/ban-ts-comment` em `RadixConnectButton.tsx`.

---

### LINT-04: Tipos `any` no useRadixWallet.ts

**Como verificar**: Execute `npm run lint` — nao deve haver erro `@typescript-eslint/no-explicit-any` em `useRadixWallet.ts`.

---

### LINT-05: Catch blocks vazios (StartScreen + useRadixWallet)

**Como verificar**: Execute `npm run lint` — nao deve haver erro `no-empty` em `StartScreen.tsx` nem `useRadixWallet.ts`.

---

### LINT-06: Interfaces vazias (command.tsx + textarea.tsx)

**Como verificar**: Execute `npm run lint` — nao deve haver erro `@typescript-eslint/no-empty-object-type` em `command.tsx` nem `textarea.tsx`.

---

### LINT-07: Namespace em App.tsx

**Como verificar**: Execute `npm run lint` — nao deve haver erro `@typescript-eslint/no-namespace` em `App.tsx`.

---

### ARCH-04: CORS faltando no erro 500 do leaderboard

**Como testar**: Ja foi validado via `curl` no teste automatizado. Para re-testar:
```bash
npx wrangler pages dev dist --kv BATTLE_ARENA_KV --port 8788
# Em outro terminal:
curl -s -w "\nHTTP_CODE: %{http_code}\n" http://127.0.0.1:8788/api/leaderboard
# Deve retornar [] com status 200 e header Access-Control-Allow-Origin: *
```

---

## Verificacao Rapida (Comandos)

```bash
# Lint — deve dar 0 erros (apenas warnings do shadcn/ui sao aceitaveis)
npm run lint

# Build — deve compilar sem erros
npm run build

# Dev server — para testes manuais
npm run dev

# Leaderboard API (com wrangler)
npx wrangler pages dev dist --kv BATTLE_ARENA_KV --port 8788
```

---

## Resumo

| Bug | Criticidade | Status Esperado | Teste Principal |
|---|---|---|---|
| BUG-NEW-01 | CRITICO | Corrigido | Stats acumulam entre batalhas |
| BUG-NEW-02 | CRITICO | Corrigido | Sem ataques fantasmas entre batalhas |
| BUG-NEW-03 | ALTO | Corrigido | Personagens se encaram |
| BUG-01 | CRITICO | Corrigido | Habilidades funcionam sem erro de hooks |
| BUG-02 | CRITICO | Corrigido | Overlay de cooldown semi-transparente |
| BUG-03 | ALTO | Corrigido | Imagem do Floki aparece na 8a batalha |
| BUG-NEW-04 | ALTO | Corrigido | Leaderboard busca/salva via API |
| BUG-05 | ALTO | Corrigido | Botao de wallet funciona |
| LINT-02..07 | MEDIO | Corrigido | `npm run lint` sem erros |
| ARCH-04 | MEDIO | Corrigido | CORS no erro 500 |
