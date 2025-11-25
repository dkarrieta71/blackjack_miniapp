<template>
  <div class="balance-toggle">
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
  border: 2px solid var(--color-gold);
  border-radius: 0.5rem;
  padding: 0.25rem;
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
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
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
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  right: 50%;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 0.25rem;
  transition: all 0.3s ease;
  z-index: 0;
}

.toggle-button.active-funds::before {
  left: 50%;
  right: 0.25rem;
}

@media (max-width: 768px) {
  .toggle-option {
    padding: 0.4rem 0.8rem;
    font-size: 1rem;
  }
}
</style>

