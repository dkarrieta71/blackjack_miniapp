<template>
  <div v-if="isVisible" class="balance-toggle">
    <button
      @click="toggleBalanceType"
      class="toggle-button"
      :class="{
        'bonus-on': state.usedCredits,
        'bonus-off': !state.usedCredits,
        'disabled': isDisabled
      }"
      :disabled="isDisabled"
      :aria-label="state.usedCredits ? 'Bonus Balance: On' : 'Bonus Balance: Off'"
    >
      <div class="toggle-label">
        <div class="label-line">Bonus</div>
        <div class="label-line">Balance: {{ state.usedCredits ? 'On' : 'Off' }}</div>
      </div>
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
  justify-content: flex-end;
  align-items: center;
}

.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: none;
  background: transparent;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  width: fit-content;
  min-width: 100px;
  aspect-ratio: 1.2 / 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-button.bonus-off {
  background: #c12e2e;
  box-shadow: 0 4px 12px rgba(193, 46, 46, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-button.bonus-on {
  background: #279d27d4;
  box-shadow: 0 4px 12px rgba(39, 157, 39, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle-button:hover:not(:disabled) {
  transform: scale(1.08) translateY(-2px);
  filter: brightness(1.15);
}

.toggle-button.bonus-off:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(193, 46, 46, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4);
}

.toggle-button.bonus-on:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(39, 157, 39, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4);
}

.toggle-button:active:not(:disabled) {
  transform: scale(0.96) translateY(0);
  transition: all 0.1s ease;
}

.toggle-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.toggle-button::before {
  content: '';
  position: absolute;
  inset: -2px;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.toggle-button:hover:not(:disabled)::before {
  opacity: 1;
}

.toggle-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
}

.label-line {
  font-size: 1.3rem;
  font-variation-settings: 'wght' 600;
  color: var(--color-white);
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: text-shadow 0.3s ease;
}

.toggle-button:hover:not(:disabled) .label-line {
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.4);
}

@media (max-width: 768px) {
  .toggle-button {
    min-width: 85px;
    padding: 0.5rem 0.8rem;
  }

  .label-line {
    font-size: 1.8rem;
  }
}
</style>

