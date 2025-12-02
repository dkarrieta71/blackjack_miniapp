<template>
  <Transition name="xp-notification">
    <div v-if="isVisible" class="xp-notification">
      <div class="particles">
        <div
          class="particle"
          v-for="i in 8"
          :key="i"
          :class="`particle-${i}`"
          :style="{ '--delay': (i - 1) * 0.1 + 's' }"
        ></div>
      </div>
      <div class="star-icon">⭐</div>
      <div class="speech-bubble">
        <div class="speech-bubble-content">
          <span class="xp-label">You earned</span>
          <span class="xp-value">{{ formattedXP }}</span>
          <span class="xp-label">XP!</span>
        </div>
        <div class="speech-bubble-tail"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue'

const props = defineProps<{
  xpAmount: number
  isVisible: boolean
}>()

const animatedXP = ref(0)

// Animate XP number counting up
watch(() => props.xpAmount, (newAmount) => {
  if (props.isVisible && newAmount > 0) {
    animateNumber(newAmount)
  }
}, { immediate: true })

watch(() => props.isVisible, (visible) => {
  if (visible && props.xpAmount > 0) {
    animateNumber(props.xpAmount)
    console.log(`XP Notification showing: ${props.xpAmount} XP`)
  }
}, { immediate: true })

function animateNumber(target: number) {
  const duration = 600 // ms
  const steps = 30
  const increment = target / steps
  const stepDuration = duration / steps

  animatedXP.value = 0

  let current = 0
  const timer = setInterval(() => {
    current += increment
    if (current >= target) {
      animatedXP.value = target
      clearInterval(timer)
    } else {
      animatedXP.value = Math.min(current, target)
    }
  }, stepDuration)
}

// Format XP to show decimals when needed
const formattedXP = computed(() => {
  return animatedXP.value % 1 === 0
    ? animatedXP.value.toFixed(0)
    : animatedXP.value.toFixed(2)
})
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
  animation: float 2s ease-in-out infinite;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, rgba(255, 217, 0, 1) 0%, rgba(255, 217, 0, 0) 70%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: particleFloat 1.5s ease-out forwards;
  animation-delay: var(--delay);
  opacity: 0;
}

/* Particle positions - 8 particles in a circle */
.particle-1 { --x: 0px; --y: -60px; }
.particle-2 { --x: 42px; --y: -42px; }
.particle-3 { --x: 60px; --y: 0px; }
.particle-4 { --x: 42px; --y: 42px; }
.particle-5 { --x: 0px; --y: 60px; }
.particle-6 { --x: -42px; --y: 42px; }
.particle-7 { --x: -60px; --y: 0px; }
.particle-8 { --x: -42px; --y: -42px; }

.star-icon {
  font-size: 4rem;
  animation: starPulse 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), starGlow 2s ease-in-out infinite 0.8s;
  filter: drop-shadow(0 0 15px rgba(255, 217, 0, 0.9));
  transform-origin: center;
  position: relative;
  z-index: 1;
}

.speech-bubble {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 217, 0, 0.95) 0%, rgba(255, 193, 7, 0.95) 100%);
  border: 2px solid var(--color-gold);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(255, 217, 0, 0.4),
    0 0 50px rgba(255, 217, 0, 0.2);
  animation: bubblePop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), bubbleGlow 2s ease-in-out infinite 0.7s;
  min-width: 200px;
  text-align: center;
  position: relative;
  z-index: 1;
}

@keyframes bubbleGlow {
  0%, 100% {
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.5),
      0 0 30px rgba(255, 217, 0, 0.4),
      0 0 50px rgba(255, 217, 0, 0.2);
  }
  50% {
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(255, 217, 0, 0.6),
      0 0 60px rgba(255, 217, 0, 0.4);
  }
}

.speech-bubble-content {
  color: var(--color-black);
  font-size: 2rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.xp-label {
  font-size: 1.2rem;
  opacity: 0.9;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.xp-value {
  font-size: 3rem;
  color: var(--color-gold);
  text-shadow: 0 0 20px rgba(255, 217, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: numberPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
  font-variation-settings: 'wght' 900;
  line-height: 1;
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

@keyframes float {
  0%, 100% {
    transform: translate(-50%, calc(-50% + 0px));
  }
  50% {
    transform: translate(-50%, calc(-50% - 10px));
  }
}

@keyframes particleFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(var(--x, 0), var(--y, 0)) scale(1.5) rotate(360deg);
  }
}

@keyframes starPulse {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(180deg);
    opacity: 1;
  }
  70% {
    transform: scale(0.95) rotate(270deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

@keyframes starGlow {
  0%, 100% {
    filter: drop-shadow(0 0 15px rgba(255, 217, 0, 0.9)) drop-shadow(0 0 25px rgba(255, 217, 0, 0.5));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 217, 0, 1)) drop-shadow(0 0 35px rgba(255, 217, 0, 0.7));
    transform: scale(1.05);
  }
}

@keyframes bubblePop {
  0% {
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.15) translateY(-5px);
  }
  70% {
    transform: scale(0.95) translateY(2px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes numberPop {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(20px);
  }
  60% {
    transform: scale(1.2) translateY(-5px);
  }
  80% {
    transform: scale(0.95) translateY(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.xp-notification-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.xp-notification-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.xp-notification-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.3) translateY(30px);
  filter: blur(10px);
}

.xp-notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8) translateY(-30px);
  filter: blur(5px);
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

