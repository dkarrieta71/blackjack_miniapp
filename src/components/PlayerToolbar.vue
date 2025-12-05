<script setup lang="ts">
import { canDoubleDown, canSplit, canTakeInsurance, canSurrender, canPlayActions, state, doubleDown, endHand, hit, split, takeInsurance, declineInsurance, surrender } from '@/store'
</script>

<template>
  <div role="toolbar" class="action-buttons">
    <!-- Insurance options when dealer shows Ace -->
    <template v-if="state.insuranceOffered">
      <button :disabled="!canTakeInsurance" @click="takeInsurance" class="action-btn">Insurance</button>
      <button :disabled="!canPlayActions || state.isDealing" @click="declineInsurance" class="action-btn">No Insurance</button>
    </template>
    <!-- Regular game actions -->
    <template v-else>
      <button :disabled="!canPlayActions || state.isDealing" @click="hit" class="action-btn">Hit</button>
      <button :disabled="!canPlayActions || state.isDealing" @click="endHand" class="action-btn">Stand</button>
      <button :disabled="!canDoubleDown" @click="doubleDown" class="action-btn">Double</button>
      <button :disabled="!canSplit" @click="split" class="action-btn">Split</button>
      <button :disabled="!canSurrender" @click="surrender" class="action-btn surrender-btn">Surrender</button>
    </template>
  </div>
</template>

<style scoped>
.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 30rem;
  margin: 0 auto;
}

.action-btn {
  padding: 0.9rem 1.2rem;
  background: var(--color-gold);
  color: var(--color-black);
  border: none;
  border-radius: 0.5rem;
  font-size: 1.6rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.surrender-btn {
  grid-column: 1 / -1;
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
