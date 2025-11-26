<script setup lang="ts">
import { state, dealer, setInitialBalances, DEFAULT_STARTING_BANK, refreshXPInfo, xpState } from '@/store'
import { computed, onMounted, ref } from 'vue'
import GameHand from '@/components/GameHand.vue'
import SvgSprite from '@/components/SvgSprite.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { playSound, Sounds, initSound } from '@/sound'
import PlayerToolbar from '@/components/PlayerToolbar.vue'
import TitleScreen from '@/components/TitleScreen.vue'
import GameHeader from '@/components/GameHeader.vue'
import PlayerBank from '@/components/PlayerBank.vue'
import BetControls from '@/components/BetControls.vue'
import XPPanel from '@/components/XPPanel.vue'
import XPProgressBar from '@/components/XPProgressBar.vue'
import { getTelegramUserId, getTelegramWebApp } from '@/telegram'
import { getUserInfo } from '@/api'

const player = computed(() => state.players[0])
const isXPPanelOpen = ref(false)

onMounted(async () => {
  initSound()

  // Fetch user balance from server
  const telegramId = getTelegramUserId()
  const tg = getTelegramWebApp()
  const initData = tg?.initData || undefined

  if (telegramId) {
    try {
      const userInfo = await getUserInfo(telegramId, initData)
      if (userInfo && userInfo.balance &&
          typeof userInfo.balance.creditBalance === 'number' &&
          typeof userInfo.balance.realBalance === 'number') {
        setInitialBalances(userInfo.balance.creditBalance, userInfo.balance.realBalance)
      } else {
        console.warn('Invalid user info received, using default balance')
        setInitialBalances(DEFAULT_STARTING_BANK, DEFAULT_STARTING_BANK)
      }

      // Fetch XP info if available in userInfo, otherwise fetch separately
      if (userInfo.xp) {
        xpState.xpInfo = userInfo.xp
        xpState.lastUpdated = Date.now()
      } else {
        // Fetch XP info separately
        refreshXPInfo().catch(err => {
          console.error('Failed to load XP info:', err)
        })
      }
    } catch (error) {
      console.error('Failed to load balance:', error)
      // Use default balance if fetch fails
      setInitialBalances(DEFAULT_STARTING_BANK, DEFAULT_STARTING_BANK)
    }
  } else {
    // Not in Telegram, use default balance
    setInitialBalances(DEFAULT_STARTING_BANK, DEFAULT_STARTING_BANK)
  }
})

function onClickCapture(e: MouseEvent) {
  const target = e.target as HTMLButtonElement
  if (target?.tagName === 'BUTTON' && !target?.disabled) {
    playSound(Sounds.Click)
  }
}
</script>

<template>
  <SvgSprite />
  <AnimatedBackground />
  <GameHeader />
  <main @click.capture="onClickCapture">
    <!-- Watermark -->
    <div class="watermark">Blackjack365</div>

    <!-- Balance Display - Top Center -->
    <div class="balance-section">
      <PlayerBank />
    </div>

    <!-- Top Section: Bet Controls -->
    <div class="top-section">
      <BetControls />
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Middle Section: Cards (Dealer and Player) -->
    <section class="cards-section">
      <!-- Dealer's Hand -->
      <div class="dealer-hand">
        <GameHand
          v-for="hand in dealer.hands"
          :hand="hand"
          :player="dealer"
          :key="hand.id"
        />
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Player's Hand -->
      <div class="player-hand">
        <GameHand
          v-for="hand in player.hands"
          :hand="hand"
          :player="player"
          :key="hand.id"
        />
      </div>
    </section>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Bottom Section: Action Buttons -->
    <section class="actions-section">
      <PlayerToolbar />
    </section>

    <!-- XP Rank and Progress Bar Row (Footer) -->
    <div class="xp-rank-section" v-if="xpState.xpInfo">
      <div class="player-rank-display">
        <button @click="isXPPanelOpen = true" class="xp-button" aria-label="Open XP Panel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </button>
        <span class="rank-label">{{ xpState.xpInfo.playerRank }}</span>
      </div>
      <div class="xp-progress-wrapper">
        <XPProgressBar :xp-info="xpState.xpInfo" />
      </div>
    </div>
  </main>
  <TitleScreen />
  <XPPanel v-model:is-open="isXPPanelOpen" />
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0.5rem;
  gap: 0.5rem;
  overflow: hidden;
  position: relative;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-family: 'Frijole', cursive;
  font-size: 8rem;
  color: var(--color-gold);
  opacity: 0.1;
  pointer-events: none;
  z-index: 0;
  white-space: nowrap;
  letter-spacing: 0.2rem;
  text-transform: uppercase;
}

.balance-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem;
  flex-shrink: 0;
  min-height: fit-content;
}

.xp-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  margin-right: 5px;
  background: linear-gradient(
    135deg,
    rgba(255, 217, 0, 0.3) 0%,
    rgba(255, 193, 7, 0.25) 50%,
    rgba(255, 217, 0, 0.3) 100%
  );
  background-size: 200% 200%;
  border-radius: 0.5rem;
  color: var(--color-gold);
  font-size: 1.6rem;
  font-variation-settings: 'wght' 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: capitalize;
  white-space: nowrap;
  animation: gradientToSolid 4s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.xp-button:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 217, 0, 0.5) 0%,
    rgba(255, 193, 7, 0.4) 50%,
    rgba(255, 217, 0, 0.5) 100%
  );
  background-size: 200% 200%;
  transform: scale(1.08);
  box-shadow: 0 0 20px rgba(255, 217, 0, 0.5), inset 0 0 10px rgba(255, 217, 0, 0.2);
  animation: gradientToSolid 2s ease-in-out infinite;
}

@keyframes gradientToSolid {
  0% {
    background: linear-gradient(
      135deg,
      rgba(255, 217, 0, 0.3) 0%,
      rgba(255, 193, 7, 0.25) 50%,
      rgba(255, 217, 0, 0.3) 100%
    );
    background-size: 200% 200%;
    background-position: 0% 50%;
  }
  50% {
    background: rgba(255, 217, 0, 0.2);
    background-size: 100% 100%;
  }
  100% {
    background: linear-gradient(
      135deg,
      rgba(255, 217, 0, 0.3) 0%,
      rgba(255, 193, 7, 0.25) 50%,
      rgba(255, 217, 0, 0.3) 100%
    );
    background-size: 200% 200%;
    background-position: 100% 50%;
  }
}

.xp-rank-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  width: 80%;
  margin: 0 auto;
  flex-shrink: 0;
  min-height: fit-content;
}

.player-rank-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 217, 0, 0.2);
  border: 1px solid rgba(255, 217, 0, 0.4);
  border-radius: 0.5rem;
  min-height: fit-content;
}

.rank-label {
  color: var(--color-gold);
  font-size: 1.8rem;
  font-variation-settings: 'wght' 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.xp-progress-wrapper {
  flex: 3;
  min-width: 0;
}

.top-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  flex-shrink: 0;
  min-height: fit-content;
}

.divider {
  height: 1px;
  background: var(--color-gold);
  opacity: 0.3;
  flex-shrink: 0;
}

.cards-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  gap: 0.5rem;
  padding: 0.5rem;
  overflow: hidden;
  max-height: 100%;
}

.dealer-hand {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex: 0 1 auto;
  min-height: 0;
  max-height: 45%;
  overflow: hidden;
  width: 100%;
}

.player-hand {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex: 0 1 auto;
  min-height: 0;
  max-height: 45%;
  overflow: hidden;
  width: 100%;
}

.actions-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.5rem;
  min-height: fit-content;
}

@media (max-width: 768px) {
  .top-section {
    flex-direction: column;
    align-items: stretch;
  }

  main {
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .watermark {
    font-size: 5rem;
  }
}
</style>
