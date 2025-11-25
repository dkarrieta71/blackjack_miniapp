<template>
  <div v-if="isVisible" class="balance-toggle">
    <button
      @click="toggleBalanceType"
      class="toggle-button"
      :class="{
        'active-credits': state.usedCredits,
        'active-funds': !state.usedCredits,
        'disabled': isDisabled
      }"
      :disabled="isDisabled"
      :aria-label="state.usedCredits ? 'Using Bonus Credits' : 'Using Real Funds'"
    >
      <span class="toggle-option" :class="{ active: state.usedCredits }">
        Bonus Credits
      </span>
      <span class="toggle-option" :class="{ active: !state.usedCredits }">
        Real Funds
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { state, toggleBalanceType } from '@/store'

const isDisabled = computed(() => {
  const playerHand = state.players[0]?.hands[0]
  return !!(playerHand && (playerHand.bet > 0 || playerHand.cards.length > 0))
})

// Hide toggle on title screen (when sounds are loading or game hasn't started yet)
const isVisible = computed(() => {
  // Hide if sounds are still loading (initial title screen)
  if (state.soundLoadProgress < 100) return false

  // Hide if game is over (title screen showing "Play Again")
  if (state.isGameOver) return false

  // Show only when game has started (user clicked "Start Game")
  return state.hasGameStarted
})
</script>

<style scoped>
.balance-toggle {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.toggle-button {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border: 3px solid var(--color-gold);
  border-radius: 0.75rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.toggle-button:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.6);
  border-color: #ffed4e;
}

.toggle-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-option {
  padding: 0.75rem 1.5rem;
  font-size: 2.4rem;
  font-variation-settings: 'wght' 500;
  color: var(--color-white);
  opacity: 0.6;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  position: relative;
  z-index: 1;
}

.toggle-option.active {
  color: var(--color-gold);
  opacity: 1;
  font-variation-settings: 'wght' 700;
}

.toggle-button::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 0.5rem;
  right: 45%;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  z-index: 0;
}

.toggle-button.active-funds::before {
  left: 50%;
  right: 0.5rem;
}

@media (max-width: 768px) {
  .toggle-option {
    padding: 0.6rem 1.2rem;
    font-size: 2.0rem;
  }

  .toggle-button {
    border-width: 2px;
    padding: 0.4rem;
  }
}
</style>

