<script setup lang="ts">
import { state, dealer } from '@/store'
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

const player = computed(() => state.players[0])

onMounted(() => {
  initSound()
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
}
</style>
