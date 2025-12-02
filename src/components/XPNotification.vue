<template>
  <Transition name="xp-notification">
    <div v-if="isVisible" class="xp-notification">
      <div class="star-icon">⭐</div>
      <div class="speech-bubble">
        <div class="speech-bubble-content">
          You earned {{ xpAmount }} XP!
        </div>
        <div class="speech-bubble-tail"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  xpAmount: number
  isVisible: boolean
}>()

// Debug logging
watch(() => props.isVisible, (visible) => {
  if (visible) {
    console.log(`XP Notification showing: ${props.xpAmount} XP`)
  }
}, { immediate: true })

watch(() => props.xpAmount, (amount) => {
  console.log(`XP Notification amount updated: ${amount}`)
}, { immediate: true })
</script>

<style scoped>
.xp-notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 10000;
  pointer-events: none;
  user-select: none;
}

.star-icon {
  font-size: 4rem;
  animation: starPulse 0.6s ease-out;
  filter: drop-shadow(0 0 10px rgba(255, 217, 0, 0.8));
}

.speech-bubble {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 217, 0, 0.95) 0%, rgba(255, 193, 7, 0.95) 100%);
  border: 2px solid var(--color-gold);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 217, 0, 0.4);
  animation: bubblePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 200px;
  text-align: center;
}

.speech-bubble-content {
  color: var(--color-black);
  font-size: 2rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.speech-bubble-tail {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 12px solid var(--color-gold);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.speech-bubble-tail::before {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 217, 0, 0.95);
}

@keyframes starPulse {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

@keyframes bubblePop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.xp-notification-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.xp-notification-leave-active {
  transition: all 0.4s ease-in;
}

.xp-notification-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.xp-notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8) translateY(-20px);
}

@media (max-width: 768px) {
  .star-icon {
    font-size: 3rem;
  }

  .speech-bubble {
    padding: 0.8rem 1.2rem;
    min-width: 180px;
  }

  .speech-bubble-content {
    font-size: 1.6rem;
  }
}
</style>

