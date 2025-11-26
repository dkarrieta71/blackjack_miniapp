<template>
  <div class="xp-panel-overlay" v-if="isOpen" @click.self="close">
    <div class="xp-panel">
      <div class="xp-panel-header">
        <h2>XP SYSTEM</h2>
        <button @click="close" class="close-button" aria-label="Close XP Panel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="xp-panel-content">
        <XPProgressBar :xp-info="xpState.xpInfo" />
        <PlaythroughProgress :xp-info="xpState.xpInfo" />
        <XPRedemption :xp-info="xpState.xpInfo" @redeemed="handleRedeemed" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { xpState, refreshXPInfo } from '@/store'
import XPProgressBar from './XPProgressBar.vue'
import PlaythroughProgress from './PlaythroughProgress.vue'
import XPRedemption from './XPRedemption.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

function close() {
  emit('update:isOpen', false)
}

async function handleRedeemed() {
  // Refresh XP info after redemption
  await refreshXPInfo(true)
}

// Refresh XP info when panel opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    refreshXPInfo(true)
  }
})
</script>

<style scoped>
.xp-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.xp-panel {
  background: #1a1508;
  border-radius: 1rem;
  border: 2px solid var(--color-gold);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 2rem rgba(255, 217, 0, 0.3);
}

.xp-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid rgba(255, 217, 0, 0.3);
  background: rgba(0, 0, 0, 0.3);
}

.xp-panel-header h2 {
  color: var(--color-gold);
  font-size: 2.5rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  margin: 0;
}

.close-button {
  background: transparent;
  border: none;
  color: var(--color-white);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-gold);
}

.xp-panel-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

@media (max-width: 768px) {
  .xp-panel {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .xp-panel-header {
    padding: 1rem;
  }

  .xp-panel-header h2 {
    font-size: 2rem;
  }

  .xp-panel-content {
    padding: 1rem;
    gap: 1rem;
  }
}
</style>

