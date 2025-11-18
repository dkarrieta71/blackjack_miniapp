<script setup lang="ts">
import { state, dealer, setInitialBalance } from '@/store'
import { computed, onMounted } from 'vue'
import GameHand from '@/components/GameHand.vue'
import SvgSprite from '@/components/SvgSprite.vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { playSound, Sounds, initSound } from '@/sound'
import PlayerToolbar from '@/components/PlayerToolbar.vue'
import TitleScreen from '@/components/TitleScreen.vue'
import GameHeader from '@/components/GameHeader.vue'
import PlayerBank from '@/components/PlayerBank.vue'
import BetControls from '@/components/BetControls.vue'
import { getTelegramUserId, getTelegramWebApp } from '@/telegram'
import { getUserInfo } from '@/api'

const player = computed(() => state.players[0])

onMounted(async () => {
  initSound()

  // Fetch user balance from server
  const telegramId = getTelegramUserId()
  const tg = getTelegramWebApp()
  const initData = tg?.initData || undefined

  console.log(telegramId, initData);

  if (telegramId) {
    try {
      const userInfo = await getUserInfo(telegramId, initData)
      setInitialBalance(userInfo.balance)
    } catch (error) {
      console.error('Failed to load balance:', error)
      // Use default balance if fetch fails
      setInitialBalance(20)
    }
  } else {
    // Not in Telegram, use default balance
    setInitialBalance(20)
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
  </main>
  <TitleScreen />
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
  padding: 0.5rem;
  flex-shrink: 0;
  min-height: fit-content;
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
}

.dealer-hand {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.player-hand {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
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
