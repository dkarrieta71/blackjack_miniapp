<script setup lang="ts">
import { computed } from 'vue'
import { state, chipState, CHIP_DENOMINATIONS, addChip, chipsToAmount } from '@/store'
import { playSound, Sounds } from '@/sound'

const player = computed(() => state.players[0])
const currentHand = computed(() => player.value.hands[0])

// Check if betting is disabled
const isDisabled = computed(() => state.isDealing || currentHand.value.bet > 0)

// Hide chip selector when bet is placed
const shouldShow = computed(() => currentHand.value.bet === 0)

function handleChipClick(denomination: number) {
  if (isDisabled.value) return

  const currentAmount = chipsToAmount(chipState.chips)
  const newAmount = currentAmount + denomination

  // Check if adding this chip would exceed bank
  if (newAmount > player.value.bank) return

  addChip(denomination)
  playSound(Sounds.Click)
}

// Arrange chips in rows of 3
const chipRows = computed(() => {
  const rows: number[][] = []
  for (let i = 0; i < CHIP_DENOMINATIONS.length; i += 3) {
    rows.push(CHIP_DENOMINATIONS.slice(i, i + 3))
  }
  return rows
})
</script>

<template>
  <div v-if="shouldShow" class="chip-selector">
    <div v-for="(row, rowIndex) in chipRows" :key="rowIndex" class="chip-row">
      <button
        v-for="denomination in row"
        :key="denomination"
        class="chip-button"
        :class="{ disabled: isDisabled }"
        @click="handleChipClick(denomination)"
        :disabled="isDisabled || chipsToAmount(chipState.chips) + denomination > player.bank"
        :aria-label="`Add ${denomination} chip`"
      >
        <img :src="`/chip-${denomination}.svg`" alt="" class="chip-svg" />
        <div class="chip-inner">
          <span class="chip-value">{{ denomination }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chip-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  align-items: flex-start;
}

.chip-row {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
}

.chip-button {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  padding: 0;
  overflow: hidden;
  background: transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.chip-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.chip-button:hover:not(:disabled) {
  transform: translateY(-0.2rem) scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.chip-button:active:not(:disabled) {
  transform: translateY(0) scale(1.05);
}

.chip-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chip-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.chip-value {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.15rem;
  font-weight: 700;
  font-variation-settings: 'wght' 700;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.8),
    0 0 6px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 1.8rem;
  height: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(255, 255, 255, 0.2);
}

/* Adjust chip sizes for smaller denominations */
.chip-button[style*="1"] .chip-value {
  font-size: 1rem;
  width: 1.6rem;
  height: 1.6rem;
}

.chip-button[style*="5"] .chip-value,
.chip-button[style*="10"] .chip-value {
  font-size: 1.1rem;
}
</style>

