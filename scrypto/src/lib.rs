use scrypto::prelude::*;

#[blueprint]
mod battle_arena {
    struct BattleArena {
        /// Vault to store the reward tokens (HYDRA)
        reward_vault: Vault,
    }

    impl BattleArena {
        /// Instantiate a new BattleArena component with an initial supply of reward tokens.
        pub fn instantiate_battle_arena() -> Global<BattleArena> {
            // Create the reward token (HYDRA)
            let reward_bucket: Bucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_MAXIMUM)
                .metadata(metadata! {
                    init {
                        "name" => "Hydra Reward Token", locked;
                        "symbol" => "HYDRA", locked;
                        "description" => "Official reward token for the Battle Arena", locked;
                    }
                })
                .mint_initial_supply(1_000_000)
                .into();

            Self {
                reward_vault: Vault::with_bucket(reward_bucket),
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .globalize()
        }

        /// Claim a reward from the battle arena.
        pub fn claim_reward(&mut self, amount: Decimal) -> Bucket {
            info!("A warrior claims {} HYDRA tokens!", amount);
            self.reward_vault.take(amount)
        }
    }
}
