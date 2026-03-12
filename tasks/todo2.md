# Planejamento Inicial & Levantamento (Battle Arena)

## 1. Ideia Central e Objetivo
O **Battle Arena** é um jogo de batalha automática por turnos em tempo real rodando no navegador, integrado com a blockchain Radix (Web3).
O jogador controla uma **Hydra** (que possui 3 cabeças, representando 3 habilidades diferentes: Liquidity Blast, Scalability Strike, Atomic Swap) e deve enfrentar uma sequência de **10 inimigos temáticos de meme coins** (Doge, Pepe, Shiba Inu, etc.). 
Entre as batalhas, o jogador ganha tokens que podem ser usados em uma loja interativa (Shop) para comprar upgrades de HP, dano, redução de recarga, etc. O modelo de combate é determinístico, sendo a chance de "esquiva" (dodge) o único fator de aleatoriedade no dano.

## 2. Tecnologias Utilizadas (Stack)
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui.
- **Animações e Roteamento**: Framer Motion, React Router v6.
- **Integração Web3**: `@radixdlt/radix-dapp-toolkit` (conecta à Radix Wallet na rede Stokenet).
- **Contratos Inteligentes**: Blueprint em Rust/Scrypto (pasta `scrypto/`).
- **Backend/Deploy**: Cloudflare Pages para hospedagem, Cloudflare Functions (Serveless) + Cloudflare KV para gerenciar o Leaderboard global de pontuações.

## 3. Análise de Status e Commits
- **Commits Recentes**: A análise dos últimos commits (`git log`) mostra ajustes recentes voltados para correção no build e resolução de problemas logísticos de assets (como configurar o Vite para aceitar imagens `.PNG` maiúsculas/minúsculas e correções de mapeamento para o inimigo "Floki").
- **Condição Atual e Bugs Identificados**: O projeto passou por uma auditoria recente (documentada extensamente no arquivo já existente `tasks/todo.md`). O fluxo principal do jogo já se encontra construído, mas essa auditoria lista débitos técnicos e bugs variados. Um bug crítico que travava o jogo após a primeira vitória foi recentemente mitigado. Há diversos outros pontos de melhoria estipulados (resolução de CORS no leaderboard, inclusão do Cloudflare KV, etc).

## 4. O que o projeto deve fazer (Fluxo Ideal)
1. **Início**: O usuário acessa, (opcionalmente) conecta sua carteira Radix e inicia a partida.
2. **Combate Automático**: A Hydra luta contra o inimigo. A barra de energia enche e as habilidades disparam de acordo com o tempo de recarga (cooldown), e ataques automáticos ocorrem em intervalos fixos.
3. **Progressão (Roguelite)**: Ao vencer, ganham-se Tokens. Na tela de Vitória, o jogador pode ir à Loja (Shop) para comprar melhorias para aquela "Run". Sendo derrotado (Derrota), os upgrades são reiniciados.
4. **Fim de Jogo**: Ao derrotar todos os 10 inimigos, a pontuação obtida é enviada ao "Leaderboard" gerenciado pela Cloudflare.

As próximas tarefas a serem implementadas devem se basear no Backlog definido no `tasks/todo.md`.
