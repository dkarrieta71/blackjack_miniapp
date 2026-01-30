<template>
  <div class="xp-progress-container" v-if="xpInfo">
    <div class="xp-header">
      <div class="xp-values">
        <span class="current-xp">{{ currentXPLabel }}</span>
        <span class="separator">/</span>
        <span class="required-xp">{{ requiredXPLabel }}</span>
      </div>
    </div>
    <div class="progress-bar-wrapper">
      <div class="progress-bar" :style="{ width: `${progressPercentage}%` }"></div>
    </div>
    <div class="xp-until-next" v-if="xpInfo.xpUntilNextLevel > 0 && xpInfo.nextLevel">
      {{ xpUntilNextLabel }} XP until {{ xpInfo.nextLevel.tier }} {{ xpInfo.nextLevel.rank }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { XPInfo } from '@/api'

const props = defineProps<{
  xpInfo: XPInfo | null
}>()

const isMaxLevel = computed(() => !props.xpInfo?.nextLevel)
const currentXPLabel = computed(() => {
  if (!props.xpInfo) return ''
  return props.xpInfo.currentLevel.expCurrent.toFixed(2)
})
const requiredXPLabel = computed(() => {
  if (!props.xpInfo) return ''
  if (!props.xpInfo.nextLevel) return 'MAX'
  return props.xpInfo.nextLevel.expRequired.toFixed(2)
})
const xpUntilNextLabel = computed(() => {
  if (!props.xpInfo) return ''
  return props.xpInfo.xpUntilNextLevel.toFixed(2)
})
const progressPercentage = computed(() => {
  if (!props.xpInfo) return 0
  return isMaxLevel.value ? 100 : props.xpInfo.progressPercentage
})
</script>

<style scoped>
.xp-progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  min-width: fit-content;
}

.xp-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.xp-values {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-white);
  font-size: 2rem;
  font-variation-settings: 'wght' 600;
}

.current-xp {
  color: var(--color-gold);
  text-shadow: 0 0 8px rgba(255, 217, 0, 0.5);
}

.separator {
  opacity: 1;
  color: var(--color-white);
}

.required-xp {
  opacity: 1;
  color: var(--color-white);
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
  background: linear-gradient(90deg, var(--color-gold), #ffed4e);
  border-radius: 0.4rem;
  transition: width 0.5s ease;
  box-shadow: 0 0 0.5rem rgba(255, 217, 0, 0.5);
}

.xp-until-next {
  color: var(--color-white);
  font-size: 2.2rem;
  text-align: center;
  opacity: 1;
  text-transform: capitalize;
  font-variation-settings: 'wght' 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .xp-progress-container {
    padding: 0.75rem;
  }

  .xp-values {
    font-size: 1.5rem;
  }

  .xp-until-next {
    font-size: 1.8rem;
  }
}
</style>

