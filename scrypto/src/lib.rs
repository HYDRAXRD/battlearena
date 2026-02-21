use scrypto::prelude::*;

#[blueprint]
mod battle_arena {
    struct BattleArena {
        /// Cofre para armazenar os tokens de recompensa (HYDRA)
        reward_vault: Vault,
    }

    impl BattleArena {
        /// Instancia um novo componente BattleArena usando um recurso de token de recompensa existente
        /// reward_tokens: Um bucket contendo os tokens HYDRA iniciais para recompensas
        pub fn instantiate_battle_arena(reward_tokens: Bucket) -> Global<BattleArena> {
            // Verifica se o recurso passado é o token HYDRA correto (Stokenet)
            assert_eq!(
                reward_tokens.resource_address(),
                Address::from("resource_tdx_2_1t5372e5thltf7d8qx7xckn50h2ayu0lwd5qe24f96d22rfp2ckpxqh"),
                "Endereço de recurso de token de recompensa inválido"
            );

            Self {
                reward_vault: Vault::with_bucket(reward_tokens),
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .globalize()
        }

        pub fn claim_reward(&mut self, amount: Decimal) -> Bucket {
            // Lógica simples de recompensa para o torneio
            info!("Um guerreiro reivindicou {} tokens HYDRA!", amount);
            self.reward_vault.take(amount)
        }
    }
}
