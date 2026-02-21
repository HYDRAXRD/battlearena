use scrypto::prelude::*;

#[blueprint]
mod battle_arena {
    struct BattleArena {
        /// Vault to store the reward tokens (HYDRA)
        reward_vault: Vault,
    }

    impl BattleArena {
        /// Instantiate a new BattleArena component using an existing reward token.
        /// reward_tokens: A bucket containing the initial HYDRA tokens for rewards.
        pub fn instantiate_battle_arena(reward_tokens: Bucket) -> Global<BattleArena> {
            // Check if the resource passed is the correct HYDRA token (Stokenet resource address provided by user)
            assert_eq!(
                reward_tokens.resource_address(),
                Address::from("resource_rdx1t4kc2yjdcqprwu70tahua3p8uwvjej9q3rktpxdr8p5pmcp4almd6r"),
                "Invalid reward token resource address"
            );

            Self {
                reward_vault: Vault::with_bucket(reward_tokens),
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
