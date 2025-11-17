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
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  min-width: 10rem;
}

.balance-label {
  color: var(--color-white);
  font-size: 1rem;
  text-transform: uppercase;
  font-variation-settings: 'wght' 500;
  letter-spacing: 0.05rem;
}

.bank-amount {
  color: var(--color-gold);
  font-size: 2rem;
  font-variation-settings: 'wght' 700;
  line-height: 1;
  transition: all 0.2s ease;
}

.bank-container.is-increasing .bank-amount {
  transform: scale(1.1);
  color: #ffed4e;
}
</style>
