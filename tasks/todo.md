# BattleArena — Task List for Agent

> Generated: 2026-02-26  
> Context: Full audit of the project was performed. This file is the single source of truth
> for all known problems. An agent picking this up with no prior context should be able to
> resolve every item below by reading only this file + the referenced source files.

---

## Active Task — 2026-02-26 — Battle progression bug (1st victory)

- [x] Read full battle progression flow in the requested files
- [x] Identify root cause for victory/next battle break after first win
- [x] Apply focused fix in game state/UI flow
- [x] Run `npm run build` and fix any build issues
- [x] Deploy to Cloudflare Pages with Wrangler
- [x] Commit and push with requested message

### Review

- Root cause identified in battle end race condition logic inside BattleArena.
- Build succeeded with only Vite chunk size warning.
- Cloudflare Pages deploy succeeded: https://a19d9a00.battlearena-3f6.pages.dev

---

## Project Overview (for agents with no context)

- **What it is**: A browser-based turn-based battle game with a Web3 twist. Players connect
  a Radix blockchain wallet, fight meme-coin enemies, earn HYDR tokens, and appear on a
  leaderboard.
- **Stack**: React 18 + TypeScript + Vite 5, Tailwind CSS 3, shadcn/ui (Radix UI primitives),
  Framer Motion, React Router v6, TanStack React Query.
- **Backend**: Cloudflare Pages Functions (serverless) + Cloudflare KV for leaderboard storage.
- **Web3**: `@radixdlt/radix-dapp-toolkit` for wallet connection on Radix Stokenet.
- **Smart contract**: Rust/Scrypto blueprint in `scrypto/` (Radix blockchain).
- **Entry point**: `src/main.tsx` → `src/App.tsx` → `src/pages/Index.tsx`
- **Key game files**: `src/game/constants.ts`, `src/game/types.ts`, `src/game/useGameState.ts`

---

## CRITICAL — Fix immediately (will cause runtime crashes or broken features)

### [BUG-NEW-01] WIN_BATTLE reseta purchases prematuramente — jogo trava na 2ª batalha

- **Severity**: CRITICAL (jogo completamente quebrado após 1ª vitória)
- **File**: `src/game/useGameState.ts:84-87`
- **Problem**: `WIN_BATTLE` zera `purchases`, `battleStartPurchases` e reseta `hydra` para `INITIAL_HYDRA` imediatamente. Quando `NEXT_BATTLE` chama `buildHydraFromPurchases(state.purchases)`, `purchases` já está vazio — Hydra entra na 2ª batalha com stats zeradas.
- **Fix**: Remover as linhas de reset do `WIN_BATTLE`. O reset deve acontecer só no `LOSE_GAME` e no `START_GAME`. O `NEXT_BATTLE` já constrói o Hydra correto via `buildHydraFromPurchases`.
  ```ts
  case 'WIN_BATTLE': {
    return {
      ...state,
      tokens: state.tokens + earnedTokens,
      totalScore: state.totalScore + earnedScore,
      screen: 'victory',
      // REMOVER: purchases: {}, battleStartPurchases: {}, hydra: { ...INITIAL_HYDRA }
    };
  }
  ```

---

### [BUG-NEW-02] `battleIndex` ausente nas deps dos useEffect de ataque — intervalos não reiniciam

- **Severity**: CRITICAL (inimigos da batalha anterior continuam atacando na nova batalha)
- **File**: `src/components/game/BattleArena.tsx:144,168`
- **Problem**: Os dois `setInterval` de ataque (Hydra e inimigo) não têm `battleIndex` nas dependências. Quando a batalha muda, os intervalos da batalha anterior continuam rodando.
- **Fix**:
  ```ts
  // Linha 144 — adicionar battleIndex:
  }, [enemy, hydra.attack, addPopup, addLog, playSfx, battleIndex]);

  // Linha 168 — adicionar battleIndex:
  }, [enemy, addPopup, addLog, playSfx, battleIndex]);
  ```

---

### [BUG-NEW-03] Inimigo não espelhado — personagens ficam virados para o mesmo lado

- **Severity**: HIGH (visual quebrado — ambos personagens olham para a mesma direção)
- **File**: `src/components/game/BattleArena.tsx:294-299`
- **Problem**: A imagem do inimigo não tem `transform: scaleX(-1)`, ficando virada para o mesmo lado que o Hydra.
- **Fix**:
  ```tsx
  <img
    src={enemyImg}
    alt={enemy.name}
    className='w-32 md:w-48 h-auto pixelated object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]'
    style={{ transform: 'scaleX(-1)' }}
  />
  ```

---

### [BUG-NEW-04] `Leaderboard.tsx` não salva nem busca scores — leaderboard sempre vazio

- **Severity**: HIGH (feature principal do jogo não funciona)
- **File**: `src/components/game/Leaderboard.tsx`
- **Problem**: O componente é 100% local — não faz nenhum `fetch` para a API em `/api/leaderboard`. O leaderboard mostra só o próprio jogador e nunca persiste nada entre sessões.
- **Fix**: Adicionar `useEffect` para POST do score e GET dos scores globais da Cloudflare Function já existente em `functions/api/leaderboard.ts`.

---

### [BUG-01] Hook called inside a callback — violates React Rules of Hooks

- **Severity**: CRITICAL (runtime crash / undefined behavior)
- **File**: `src/components/game/BattleArena.tsx:325`
- **Problem**: `useAbility` is called inside an `onClick` arrow function passed to a `<button>`.
  React Hooks must only be called at the top level of a React component or custom hook — never
  inside callbacks, conditions, or loops. This will crash or behave unpredictably.
- **Current broken code** (line 325):
  ```tsx
  onClick={() => useAbility(i)}
  ```
- **Fix**: `useAbility` is almost certainly NOT a hook — it is a plain function defined inside
  `BattleArena` that handles game ability logic. Rename it or confirm it doesn't start with
  `use` to silence the linter and avoid confusion. If it truly needs to be a hook, extract
  the call to the top of the component and pass the result down.
  ```tsx
  // Rename the function from useAbility to handleAbility (or applyAbility, etc.)
  // Then the button becomes:
  onClick={() => handleAbility(i)}
  ```
- **Lint error**: `react-hooks/rules-of-hooks`

---

### [BUG-02] Corrupted text leaked into JSX className

- **Severity**: CRITICAL (visual bug — broken CSS class on cooldown overlay)
- **File**: `src/components/game/BattleArena.tsx:342`
- **Problem**: A className string contains literal instruction text that was accidentally
  left in the code. The string reads:
  ```
  'absolute inset-0 bg-blackFix: add null checks for onWin/onLose and rename floki to early to match assets/60 flex items-center justify-center font-pixel text-xs text-white rounded-sm'
  ```
  The intended class was `bg-black/60` but it got merged with a note.
- **Fix**: Replace the entire className with the correct value:
  ```tsx
  // Current (line 342):
  <div className='absolute inset-0 bg-blackFix: add null checks for onWin/onLose and rename floki to early to match assets/60 flex items-center justify-center font-pixel text-xs text-white rounded-sm'>
  
  // Fixed:
  <div className='absolute inset-0 bg-black/60 flex items-center justify-center font-pixel text-xs text-white rounded-sm'>
  ```

---

### [BUG-03] Enemy image mapping mismatch — "floki" has no image

- **Severity**: HIGH (feature broken — enemy displays fallback pixel art instead of image)
- **Files**:
  - `src/game/constants.ts:95` — enemy definition uses `id: 'floki'`
  - `src/components/game/BattleArena.tsx:26-37` — `ENEMY_IMAGES` map has no `floki` key;
    it has `early` instead, which maps to `earlyEnemy` (`src/assets/early.PNG`)
- **Problem**: When the "Floki" enemy appears in battle, `ENEMY_IMAGES['floki']` is
  `undefined`, so the component falls back to pixel art rendering instead of showing the
  correct image.
- **Context**: The bug note leaked into BUG-02 confirms the intent: "rename floki to early
  to match assets". The asset file is `early.PNG` and maps to key `early`.
- **Fix (two valid options)**:

  **Option A — Rename the enemy id in constants.ts** (recommended, cleaner):
  ```ts
  // src/game/constants.ts:95
  // Before:
  id: 'floki',
  // After:
  id: 'early',
  ```

  **Option B — Add 'floki' key to ENEMY_IMAGES in BattleArena.tsx**:
  ```tsx
  // src/components/game/BattleArena.tsx — add to ENEMY_IMAGES:
  floki: earlyEnemy,
  ```
  Note: Option A keeps the data consistent; Option B is a quick patch.

---

### [BUG-04] Cloudflare KV binding missing from wrangler.jsonc

- **Severity**: HIGH (leaderboard completely broken in production)
- **Files**:
  - `wrangler.jsonc` — Cloudflare Pages config (does NOT declare the KV binding)
  - `functions/api/leaderboard.ts:6` — expects `context.env.BATTLE_ARENA_KV`
- **Problem**: The leaderboard function uses `BATTLE_ARENA_KV` KV namespace, but
  `wrangler.jsonc` has no `kv_namespaces` entry. In a Cloudflare Pages deployment,
  `context.env.BATTLE_ARENA_KV` will be `undefined`, causing every GET/POST to throw.
- **Current wrangler.jsonc** (no kv_namespaces section):
  ```jsonc
  {
    "name": "battlearena",
    "compatibility_date": "2025-09-27",
    "pages_build_output_dir": "./dist"
  }
  ```
- **Fix**:
  1. Create a KV namespace in the Cloudflare dashboard: Workers & Pages → KV → Create namespace
     → name it `BATTLE_ARENA_KV` (or anything, the binding name is what matters).
  2. Get the namespace ID from the dashboard.
  3. Add to `wrangler.jsonc`:
  ```jsonc
  {
    "name": "battlearena",
    "compatibility_date": "2025-09-27",
    "pages_build_output_dir": "./dist",
    "kv_namespaces": [
      {
        "binding": "BATTLE_ARENA_KV",
        "id": "<YOUR_KV_NAMESPACE_ID>",
        "preview_id": "<YOUR_PREVIEW_KV_NAMESPACE_ID>"
      }
    ]
  }
  ```
  4. For local development with `wrangler pages dev`, also add `preview_id` from a
     separate preview namespace.

---

### [BUG-05] `connect()` function in useRadixWallet is empty (wallet connect broken)

- **Severity**: HIGH (Web3 wallet connection is partially non-functional)
- **File**: `src/hooks/useRadixWallet.ts:120-123`
- **Problem**: The `connect` callback does nothing after getting the RDT instance:
  ```ts
  const connect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    // <-- nothing here
  }, []);
  ```
  The wallet connection UI likely relies on the native `<radix-connect-button>` web component
  (see `src/components/game/RadixConnectButton.tsx`) which handles connection automatically.
  However, if any part of the codebase calls `connect()` programmatically, it silently does
  nothing.
- **Fix**: Either implement the connect logic or document clearly that connection is handled
  by the web component. If programmatic connect is needed:
  ```ts
  const connect = useCallback(async () => {
    const rdt = getRdt();
    if (!rdt) return;
    // The RDT web component handles connect UI; if programmatic trigger is needed:
    rdt.walletApi.sendRequest();
  }, []);
  ```

---

## HIGH — Fix before next release

### [LINT-01] `useAbility` naming triggers Rules of Hooks lint error (same root as BUG-01)

Already covered in BUG-01. Renaming to `handleAbility` resolves both the runtime risk and
this lint error simultaneously.

---

### [LINT-02] `tailwind.config.ts` uses `require()` instead of ES import

- **File**: `tailwind.config.ts:99`
- **Lint error**: `@typescript-eslint/no-require-imports`
- **Fix**:
  ```ts
  // Before:
  plugins: [require("tailwindcss-animate")],
  
  // After:
  import tailwindcssAnimate from "tailwindcss-animate";
  // ...
  plugins: [tailwindcssAnimate],
  ```
  Also add `export default` if the file uses module syntax consistently.

---

### [LINT-03] `@ts-ignore` in RadixConnectButton.tsx should be `@ts-expect-error`

- **File**: `src/components/game/RadixConnectButton.tsx:58`
- **Lint error**: `@typescript-eslint/ban-ts-comment`
- **Fix**:
  ```ts
  // Before:
  // @ts-ignore
  
  // After:
  // @ts-expect-error -- radix-connect-button is a custom element not in JSX.IntrinsicElements
  ```

---

### [LINT-04] `any` types in useRadixWallet and useGameAudio

- **Files**:
  - `src/hooks/useRadixWallet.ts:70` — `item: any`
  - `src/hooks/useRadixWallet.ts:74` — `r: any`
  - `src/hooks/useGameAudio.ts:29` — parameter typed as `any`
- **Lint error**: `@typescript-eslint/no-explicit-any`
- **Fix for useRadixWallet** — define minimal interfaces for the Gateway API response:
  ```ts
  interface GatewayFungibleResource {
    resource_address: string;
    amount: string;
  }
  interface GatewayAccountItem {
    address: string;
    fungible_resources?: { items: GatewayFungibleResource[] };
  }
  // Then replace any casts:
  const accountData = data.items?.find((item: GatewayAccountItem) => item.address === address);
  const hydrResource = fungibleResources.find((r: GatewayFungibleResource) => r.resource_address === HYDR_TOKEN);
  ```

---

### [LINT-05] Empty block statement in `catch` — errors silently swallowed

- **Files**:
  - `src/components/game/StartScreen.tsx:43` — empty `catch` block
  - `src/hooks/useRadixWallet.ts:116` — `catch (_) {}` (unsubscribe error silenced)
- **Lint error**: `no-empty`
- **Fix** (at minimum, add a comment to document intentional suppression):
  ```ts
  // useRadixWallet.ts:116
  try {
    subscription?.unsubscribe();
  } catch (_) {
    // Intentionally ignored — unsubscribe errors are non-recoverable at teardown
  }
  ```
  For `StartScreen.tsx:43`, inspect what the try block is attempting and decide whether
  the error should be logged or rethrown.

---

### [LINT-06] Empty interface declarations in UI components

- **Files**:
  - `src/components/ui/command.tsx:24` — `interface CommandDialogProps` extends without adding members
  - `src/components/ui/textarea.tsx:5` — `interface TextareaProps` same issue
- **Lint error**: `@typescript-eslint/no-empty-object-type`
- **Fix** — use a type alias instead:
  ```ts
  // Before:
  interface CommandDialogProps extends DialogProps {}
  
  // After:
  type CommandDialogProps = DialogProps;
  ```

---

### [LINT-07] `App.tsx` uses TS namespace instead of ES module syntax

- **File**: `src/App.tsx:13`
- **Lint error**: `@typescript-eslint/no-namespace`
- **Problem**: A `declare namespace` or `namespace` block is used where an ES module
  `declare global` or module augmentation should be.
- **Fix**: Replace the namespace with proper JSX type augmentation:
  ```ts
  // Before (somewhere in App.tsx):
  namespace JSX {
    interface IntrinsicElements {
      'radix-connect-button': React.DetailedHTMLProps<...>
    }
  }
  
  // After:
  declare global {
    namespace JSX {
      interface IntrinsicElements {
        'radix-connect-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      }
    }
  }
  ```

---

## MEDIUM — Technical debt, should be resolved

### [PERF-01] Main JS bundle is 663 kB (over 500 kB threshold)

- **File**: `vite.config.ts`
- **Problem**: Build outputs a single `index-*.js` chunk of ~664 kB (214 kB gzipped).
  Vite warns about chunks over 500 kB.
- **Fix**: Add manual chunk splitting in `vite.config.ts`:
  ```ts
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', '@radix-ui/react-dialog', /* other radix */],
          'vendor-radix-dapp': ['@radixdlt/radix-dapp-toolkit'],
          'vendor-query': ['@tanstack/react-query'],
        }
      }
    }
  }
  ```

---

### [PERF-02] Game assets are unoptimized (PNG images up to 2.2 MB each)

- **Files**: All PNGs in `src/assets/` — some exceed 2 MB uncompressed.
- **Fix**: Compress images using tools like `sharp`, `squoosh`, or `imagemin` as a
  pre-build step. Consider converting to WebP format for better compression.
  Alternatively add `vite-plugin-imagemin` to `vite.config.ts`.

---

### [ARCH-01] `useGameAudio` instantiated in two places — mute state is split

- **Files**:
  - `src/pages/Index.tsx:37`
  - `src/components/game/BattleArena.tsx:68`
- **Problem**: Each call to `useGameAudio()` creates its own Web Audio context and mute
  state. A user toggling mute in the UI may only affect one of the two instances.
- **Fix**: Lift `useGameAudio` to a React Context so it is a singleton:
  ```tsx
  // Create GameAudioContext, wrap app root with <GameAudioProvider>,
  // and replace each useGameAudio() call with useGameAudioContext().
  ```

---

### [ARCH-02] `@tanstack/react-query` is configured but never used

- **Files**: `src/App.tsx` (QueryClientProvider is present), no `useQuery`/`useMutation`
  calls found anywhere in `src/`.
- **Problem**: Adds ~45 kB to the bundle for no benefit currently.
- **Fix** (two options):
  - **Option A**: Remove QueryClientProvider and the dependency if it won't be used.
  - **Option B**: Migrate `fetchBalance` in `useRadixWallet.ts` to use `useQuery`, which
    is the intended use case and would also give automatic caching and refetch.

---

### [ARCH-03] `NavLink.tsx` component is unused

- **File**: `src/components/NavLink.tsx`
- **Problem**: The component is not imported anywhere in the project.
- **Fix**: Delete the file or integrate it where needed.

---

### [ARCH-04] `useRadixWallet.ts` leaderboard error response missing CORS header

- **File**: `functions/api/leaderboard.ts:53`
- **Problem**: The `catch` in `onRequestPost` returns a `500` response without the
  `Access-Control-Allow-Origin: *` header, which will cause browser CORS errors when
  the fetch fails.
- **Fix**:
  ```ts
  // Before:
  return new Response(String(e), { status: 500 });
  
  // After:
  return new Response('Internal Server Error', {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
  ```
  Also consider not leaking the raw error string (`String(e)`) to the client.

---

## LOW — Quality improvements

### [SEC-01] `.gitignore` does not exclude `.env` files

- **File**: `.gitignore`
- **Problem**: If anyone adds a `.env` or `.env.local` file, it will be committed.
- **Fix**: Add to `.gitignore`:
  ```
  .env
  .env.*
  !.env.example
  ```

### [SEC-02] Wrangler not in devDependencies

- **File**: `package.json`
- **Problem**: `wrangler` is not listed as a dev dependency. Deployment commands rely on
  a globally installed `wrangler` CLI, which breaks reproducibility.
- **Fix**:
  ```
  npm install -D wrangler
  ```
  Then add to `package.json` scripts:
  ```json
  "deploy": "wrangler pages deploy dist"
  ```

### [TS-01] TypeScript strictness is disabled — consider enabling incrementally

- **File**: `tsconfig.app.json`
- **Current settings**: `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`
- **Impact**: Many potential null-reference and type errors go undetected.
- **Fix** (incremental): Enable `strictNullChecks: true` first (lowest disruption), fix
  errors, then enable `noImplicitAny: true`, fix, then `strict: true`.

### [TEST-01] Test coverage is effectively 0% of real application code

- **File**: `src/test/example.test.ts` — contains only `expect(true).toBe(true)`
- **Fix**: Add meaningful tests. Priority order:
  1. `src/game/useGameState.ts` — pure reducer logic, easiest to test
  2. `src/game/constants.ts` — validate enemy/ability data shapes
  3. `functions/api/leaderboard.ts` — unit test with mocked KV

### [DOCS-01] README has a malformed URL

- **File**: `README.md:7`
- **Problem**: URL `https://hydra/battlearena.vercel.app` is malformed (missing TLD between
  `hydra` and `battlearena`).
- **Fix**: Update to the correct production URL.

### [CONF-01] `tsconfig.node.json` does not include `vitest.config.ts`

- **File**: `tsconfig.node.json`
- **Problem**: Only `vite.config.ts` is included in the `node` tsconfig. The `vitest.config.ts`
  is not covered, which can lead to type inconsistencies in editors.
- **Fix**: Add `vitest.config.ts` to the `include` array in `tsconfig.node.json`.

---

## Summary Table

| ID | Severity | File(s) | Description |
|---|---|---|---|
| BUG-01 | CRITICAL | `BattleArena.tsx:325` | Hook called inside onClick callback |
| BUG-02 | CRITICAL | `BattleArena.tsx:342` | Instruction text leaked into JSX className |
| BUG-03 | HIGH | `constants.ts:95`, `BattleArena.tsx:34` | Enemy id `floki` has no image mapping |
| BUG-04 | HIGH | `wrangler.jsonc`, `leaderboard.ts` | KV binding missing — leaderboard broken in prod |
| BUG-05 | HIGH | `useRadixWallet.ts:120` | `connect()` function is empty |
| LINT-01 | HIGH | `BattleArena.tsx:325` | (same as BUG-01) |
| LINT-02 | HIGH | `tailwind.config.ts:99` | `require()` instead of ES import |
| LINT-03 | MEDIUM | `RadixConnectButton.tsx:58` | `@ts-ignore` → `@ts-expect-error` |
| LINT-04 | MEDIUM | `useRadixWallet.ts:70,74`, `useGameAudio.ts:29` | Untyped `any` params |
| LINT-05 | MEDIUM | `StartScreen.tsx:43`, `useRadixWallet.ts:116` | Empty catch blocks |
| LINT-06 | MEDIUM | `command.tsx:24`, `textarea.tsx:5` | Empty interface declarations |
| LINT-07 | MEDIUM | `App.tsx:13` | TS namespace instead of ES module syntax |
| PERF-01 | MEDIUM | `vite.config.ts` | 663 kB bundle — no code splitting |
| PERF-02 | MEDIUM | `src/assets/` | Images up to 2.2 MB — not optimized |
| ARCH-01 | MEDIUM | `Index.tsx:37`, `BattleArena.tsx:68` | Dual `useGameAudio` instances, split mute state |
| ARCH-02 | MEDIUM | `App.tsx` | React Query configured but never used |
| ARCH-03 | LOW | `NavLink.tsx` | Component unused — dead code |
| ARCH-04 | MEDIUM | `leaderboard.ts:53` | CORS header missing on 500 error response |
| SEC-01 | LOW | `.gitignore` | `.env` files not excluded |
| SEC-02 | LOW | `package.json` | `wrangler` not in devDependencies |
| TS-01 | LOW | `tsconfig.app.json` | TypeScript strict mode fully disabled |
| TEST-01 | LOW | `src/test/` | Zero real test coverage |
| DOCS-01 | LOW | `README.md:7` | Malformed production URL |
| CONF-01 | LOW | `tsconfig.node.json` | `vitest.config.ts` not included |

---

## Verification commands

After resolving issues, run these to confirm correctness:

```bash
# Must pass with 0 errors, 0 warnings:
npm run lint

# Must pass:
npm run build

# Must pass:
npm run test
```
