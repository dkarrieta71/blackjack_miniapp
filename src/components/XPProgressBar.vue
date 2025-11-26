<template>
  <div class="xp-progress-container" v-if="xpInfo">
    <div class="xp-header">
      <div class="player-rank">{{ xpInfo.playerRank }}</div>
      <div class="xp-values">
        <span class="current-xp">{{ xpInfo.currentLevel.expCurrent }}</span>
        <span class="separator">/</span>
        <span class="required-xp">{{ xpInfo.nextLevel.xpRequired }}</span>
      </div>
    </div>
    <div class="progress-bar-wrapper">
      <div class="progress-bar" :style="{ width: `${xpInfo.progressPercentage}%` }"></div>
    </div>
    <div class="xp-until-next" v-if="xpInfo.xpUntilNextLevel > 0">
      {{ xpInfo.xpUntilNextLevel }} XP until {{ xpInfo.nextLevel.tier }} {{ xpInfo.nextLevel.rank }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XPInfo } from '@/api'

defineProps<{
  xpInfo: XPInfo | null
}>()
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
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.player-rank {
  color: var(--color-gold);
  font-size: 2rem;
  font-variation-settings: 'wght' 600;
  text-transform: capitalize;
  letter-spacing: 0.05rem;
}

.xp-values {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-white);
  font-size: 1.8rem;
  font-variation-settings: 'wght' 500;
}

.current-xp {
  color: var(--color-gold);
}

.separator {
  opacity: 0.6;
}

.required-xp {
  opacity: 0.8;
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
  color: var(--color-off-white);
  font-size: 1.4rem;
  text-align: center;
  opacity: 0.8;
  text-transform: capitalize;
}

@media (max-width: 768px) {
  .xp-progress-container {
    padding: 0.75rem;
  }

  .player-rank {
    font-size: 1.6rem;
  }

  .xp-values {
    font-size: 1.5rem;
  }

  .xp-until-next {
    font-size: 1.2rem;
  }
}
</style>

