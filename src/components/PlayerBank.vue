<template>
  <div role="status" class="bank-container" :class="{ 'is-increasing': isIncreasing }">
    <div class="balance-label">BALANCE</div>
    <div class="bank-amount">${{ state.players[0].bank.toFixed(2) }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { state } from '../store'

const isIncreasing = ref(false)

watch(
  () => state.players[0].bank,
  (current, previous) => {
    if (current > previous) {
      isIncreasing.value = true
      setTimeout(() => {
        isIncreasing.value = false
      }, 1000)
    }
  },
)
</script>

<style scoped>
.bank-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  min-width: fit-content;
}

.balance-label {
  color: var(--color-white);
  font-size: 1.8rem;
  text-transform: uppercase;
  font-variation-settings: 'wght' 500;
  letter-spacing: 0.1rem;
}

.bank-amount {
  color: var(--color-gold);
  font-size: 5.5rem;
  font-variation-settings: 'wght' 700;
  line-height: 1;
  transition: all 0.2s ease;
}

.bank-container.is-increasing .bank-amount {
  transform: scale(1.1);
  color: #ffed4e;
}

@media (max-width: 768px) {
  .bank-container {
    padding: 0.75rem 1.5rem;
  }

  .balance-label {
    font-size: 2rem;
  }

  .bank-amount {
    font-size: 4rem;
  }
}
</style>
