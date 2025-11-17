<script setup lang="ts">
import { canDoubleDown, canSplit, state, doubleDown, endHand, hit, split } from '@/store'
</script>

<template>
  <div role="toolbar" class="action-buttons">
    <button :disabled="state.isDealing" @click="hit" class="action-btn">Hit</button>
    <button :disabled="state.isDealing" @click="endHand" class="action-btn">Stand</button>
    <button :disabled="!canDoubleDown" @click="doubleDown" class="action-btn">Double</button>
    <button :disabled="!canSplit" @click="split" class="action-btn">Split</button>
  </div>
</template>

<style scoped>
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
}

.action-btn {
  padding: 1rem 1.5rem;
  background: var(--color-gold);
  color: var(--color-black);
  border: none;
  border-radius: 0.5rem;
  font-size: 1.8rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover {
  background: #ffed4e;
  transform: translateY(-0.1rem);
}

.action-btn:not(:disabled):active {
  transform: translateY(0);
}
</style>
