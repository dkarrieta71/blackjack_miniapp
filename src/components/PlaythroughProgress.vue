<template>
  <div class="playthrough-container" v-if="shouldShow">
    <div class="playthrough-header">
      <div class="bonus-credits-label">BONUS CREDITS</div>
      <div class="bonus-credits-amount">
        ${{ props.xpInfo ? props.xpInfo.bonusCreditsBalance.toFixed(2) : '0.00' }}
      </div>
    </div>
    <div
      class="playthrough-status"
      :class="{ complete: props.xpInfo?.isPlaythroughComplete }"
    >
      {{ statusText }}
    </div>
    <div class="progress-bar-wrapper">
      <div
        class="progress-bar"
        :class="{ complete: props.xpInfo?.isPlaythroughComplete }"
        :style="{ width: `${props.xpInfo?.playthroughPercentage ?? 0}%` }"
      ></div>
    </div>
    <div class="playthrough-details">
      <span class="progress-text">
        ${{ props.xpInfo?.playthroughProgress.toFixed(2) ?? '0.00' }} / ${{ props.xpInfo?.playthroughRequired.toFixed(2) ?? '0.00' }}
      </span>
      <span class="percentage-text">{{ Math.round(props.xpInfo?.playthroughPercentage ?? 0) }}%</span>
    </div>
    <div class="redeemable-notice" v-if="props.xpInfo?.isPlaythroughComplete && (props.xpInfo?.redeemableBonusCredits ?? 0) > 0">
      ✓ ${{ props.xpInfo?.redeemableBonusCredits.toFixed(2) ?? '0.00' }} ready to use
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { XPInfo } from '@/api'

const props = defineProps<{
  xpInfo: XPInfo | null
}>()

const shouldShow = computed(() => {
  if (!props.xpInfo) return false
  return props.xpInfo.bonusCreditsBalance > 0 || props.xpInfo.playthroughRequired > 0
})

const statusText = computed(() => {
  if (!props.xpInfo) return ''
  return props.xpInfo.isPlaythroughComplete ? 'Playthrough Complete' : 'Playthrough In Progress'
})
</script>

<style scoped>
.playthrough-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  min-width: fit-content;
}

.playthrough-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.bonus-credits-label {
  color: var(--color-white);
  font-size: 1.8rem;
  font-variation-settings: 'wght' 500;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
}

.bonus-credits-amount {
  color: var(--color-gold);
  font-size: 2.5rem;
  font-variation-settings: 'wght' 700;
}

.playthrough-status {
  color: #ffa500;
  font-size: 1.6rem;
  font-variation-settings: 'wght' 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
}

.playthrough-status.complete {
  color: #4ade80;
}

.progress-bar-wrapper {
  width: 100%;
  height: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.4rem;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffa500, #ffd700);
  border-radius: 0.4rem;
  transition: width 0.5s ease;
  box-shadow: 0 0 0.5rem rgba(255, 165, 0, 0.5);
}

.progress-bar.complete {
  background: linear-gradient(90deg, #4ade80, #22c55e);
  box-shadow: 0 0 0.5rem rgba(74, 222, 128, 0.5);
}

.playthrough-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-off-white);
  font-size: 1.4rem;
  opacity: 0.8;
}

.redeemable-notice {
  color: #4ade80;
  font-size: 1.4rem;
  text-align: center;
  font-variation-settings: 'wght' 600;
  padding: 0.5rem;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 0.25rem;
}

@media (max-width: 768px) {
  .playthrough-container {
    padding: 0.75rem;
  }

  .bonus-credits-label {
    font-size: 1.5rem;
  }

  .bonus-credits-amount {
    font-size: 2rem;
  }

  .playthrough-status {
    font-size: 1.4rem;
  }

  .playthrough-details {
    font-size: 1.2rem;
  }

  .redeemable-notice {
    font-size: 1.2rem;
  }
}
</style>

