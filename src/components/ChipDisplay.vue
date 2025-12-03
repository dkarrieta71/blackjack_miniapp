<script setup lang="ts">
import { computed } from 'vue'
import { chipState, CHIP_DENOMINATIONS, state } from '@/store'

// Get chips that have a count > 0, sorted by denomination
const activeChips = computed(() => {
  return CHIP_DENOMINATIONS.filter(denom => chipState.chips[denom] > 0)
    .map(denom => ({
      denomination: denom,
      count: chipState.chips[denom]
    }))
})

// Check if there are any chips to display
// Only show when placing a bet (no cards dealt yet)
const hasChips = computed(() => {
  const playerHand = state.players[0]?.hands[0]
  const canShow = !playerHand || playerHand.cards.length === 0
  return activeChips.value.length > 0 && canShow
})
</script>

<template>
  <div v-if="hasChips" class="chip-display">
    <div class="chip-circle">
      <div
        v-for="chip in activeChips"
        :key="chip.denomination"
        class="chip-stack"
      >
        <div
          v-for="i in chip.count"
          :key="i"
          class="chip"
          :style="{
            '--stack-offset': (i - 1) * 2,
            '--rotation': (i - 1) * 5
          }"
        >
          <img :src="`/chip-${chip.denomination}.svg`" alt="" class="chip-svg" />
          <div class="chip-inner">
            <span class="chip-value">{{ chip.denomination }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chip-display {
  position: absolute;
  bottom: -5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
  width: 100%;
  display: flex;
  justify-content: center;
}

.chip-circle {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  padding: 0.5rem;
  min-width: 8rem;
  min-height: 8rem;
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 217, 0, 0.3);
}

.chip-stack {
  position: relative;
  display: inline-block;
}

.chip {
  position: absolute;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(calc(var(--stack-offset, 0) * -1px)) rotate(calc(var(--rotation, 0) * 1deg));
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
}

.chip:first-child {
  position: relative;
}

.chip-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
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
  font-size: 1rem;
  font-weight: 700;
  font-variation-settings: 'wght' 700;
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.8),
    0 0 6px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(255, 255, 255, 0.2);
}

/* Adjust chip sizes for smaller denominations */
.chip[style*="1"] .chip-value {
  font-size: 0.9rem;
  width: 1.4rem;
  height: 1.4rem;
}

.chip[style*="5"] .chip-value,
.chip[style*="10"] .chip-value {
  font-size: 0.95rem;
}
</style>

