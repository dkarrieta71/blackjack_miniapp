<script setup lang="ts">
import { computed } from 'vue'
import { chipState, CHIP_DENOMINATIONS, state, xpState, removeChip } from '@/store'
import { playSound, Sounds } from '@/sound'

// Get chips that have a count > 0, sorted by denomination
const activeChips = computed(() => {
  return CHIP_DENOMINATIONS.filter(denom => chipState.chips[denom] > 0)
    .map(denom => ({
      denomination: denom,
      count: chipState.chips[denom]
    }))
})

// Check if there are any chips to display
// Show chips when they exist and:
// - XP notification is not showing, OR
// - We should show chips after XP notification (showAfterXP)
const hasChips = computed(() => {
  const canShow = !xpState.showXPNotification || chipState.showAfterXP
  return activeChips.value.length > 0 && canShow
})

// Check if a bet has been placed
const hasBet = computed(() => {
  const playerHand = state.players[0]?.hands[0]
  return (playerHand?.bet ?? 0) > 0
})

// Check if chips can be removed (same conditions as adding - no bet placed, not dealing, and not showing after XP)
const canRemoveChips = computed(() => {
  const playerHand = state.players[0]?.hands[0]
  return !state.isDealing && (playerHand?.bet ?? 0) === 0 && !chipState.showAfterXP
})

function handleChipClick(denomination: number) {
  if (!canRemoveChips.value) return
  removeChip(denomination)
  playSound(Sounds.Click)
}
</script>

<template>
  <div v-if="hasChips" class="chip-display" :class="{ 'has-bet': hasBet, 'clickable': canRemoveChips }">
    <div v-if="!hasBet" class="chip-circle">
      <div
        v-for="chip in activeChips"
        :key="chip.denomination"
        class="chip-stack"
        :class="{ 'clickable-stack': canRemoveChips }"
        @click="canRemoveChips && handleChipClick(chip.denomination)"
        :aria-label="canRemoveChips ? `Remove ${chip.denomination} chip` : undefined"
      >
        <div
          v-for="i in chip.count"
          :key="i"
          class="chip"
          :class="{ 'clickable-chip': canRemoveChips }"
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
    <div v-else class="chip-list">
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
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
  width: 100%;
  display: flex;
  justify-content: center;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.chip-display.clickable {
  pointer-events: auto;
}

.chip-display.has-bet {
  position: static;
  bottom: auto;
  left: auto;
  transform: none;
  width: auto;
  justify-content: flex-start;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-start;
}

.chip-circle {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  align-items: center;
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  border-radius: 50%;
  padding: 1rem;
  min-width: 10rem;
  min-height: 10rem;
  backdrop-filter: blur(12px);
  position: relative;
  box-shadow:
    0 0 25px rgba(255, 217, 0, 0.4),
    0 0 50px rgba(255, 217, 0, 0.2),
    inset 0 0 25px rgba(255, 217, 0, 0.15),
    0 4px 15px rgba(0, 0, 0, 0.6);
  animation: chipCircleGlow 3s ease-in-out infinite;
  border: 3px solid rgba(255, 217, 0, 0.6);
}

.chip-circle::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 217, 0, 0.5) 0%,
    rgba(255, 193, 7, 0.3) 50%,
    transparent 100%
  );
  z-index: -1;
  filter: blur(10px);
  animation: chipCirclePulse 2s ease-in-out infinite;
  opacity: 0.8;
}

@keyframes chipCircleGlow {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(255, 217, 0, 0.3),
      0 0 40px rgba(255, 217, 0, 0.15),
      inset 0 0 20px rgba(255, 217, 0, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.5);
  }
  50% {
    box-shadow:
      0 0 30px rgba(255, 217, 0, 0.5),
      0 0 60px rgba(255, 217, 0, 0.25),
      inset 0 0 30px rgba(255, 217, 0, 0.15),
      0 4px 12px rgba(0, 0, 0, 0.5);
  }
}

@keyframes chipCirclePulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.chip-stack {
  position: relative;
  display: inline-block;
  z-index: 1;
  transition: z-index 0s;
}

.chip-stack.clickable-stack {
  cursor: pointer;
}

.chip-stack.clickable-stack:hover {
  z-index: 100;
}

.chip-stack.clickable-stack:hover .chip {
  transform: translateY(calc(var(--stack-offset, 0) * -1px)) rotate(calc(var(--rotation, 0) * 1deg)) scale(1.05);
}

.chip-stack.clickable-stack:hover .chip:first-child {
  transform: translateY(0) rotate(0deg) scale(1.1);
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
  transition: all 0.2s ease;
  pointer-events: none;
}

.chip:first-child {
  position: relative;
}

.chip.clickable-chip {
  pointer-events: auto;
}

.chip-stack.clickable-stack:active .chip {
  transform: translateY(calc(var(--stack-offset, 0) * -1px)) rotate(calc(var(--rotation, 0) * 1deg)) scale(1.02);
}

.chip-stack.clickable-stack:active .chip:first-child {
  transform: translateY(0) rotate(0deg) scale(1.05);
}

.chip.clickable-chip:active {
  transform: translateY(calc(var(--stack-offset, 0) * -1px)) rotate(calc(var(--rotation, 0) * 1deg)) scale(1.05);
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
