<script setup lang="ts">
import { type Hand } from '@/types'
import { dealer, state } from '@/store'
import { computed } from 'vue'

const props = defineProps<{ hand: Hand }>()

const total = computed(() => {
  if (props.hand.cards.length < 2) return // Wait until two cards are dealt
  const isDealer = dealer.value.hands.includes(props.hand)
  if (isDealer && !state.showDealerHoleCard) return // Hide dealer's total until hole card is revealed
  return props.hand.total
})
</script>

<template>
  <transition name="pop">
    <div v-if="total" class="hand-total" :class="{ bust: total > 21, 'twenty-one': total === 21 }">
      <span class="sr-only">Total:</span>
      {{ total }}
    </div>
  </transition>
</template>

<style scoped>
.hand-total {
  --background-color: var(--color-gold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 0rem;
  right: 0;
  min-width: 4rem;
  height: 3rem;
  font-size: 2rem;
  margin: 0;
  font-variation-settings: 'wght' 700;
  line-height: 1;
  background: var(--background-color);
  border-radius: 0.75rem;
  text-align: center;
  letter-spacing: 0.05em;
  color: var(--color-black);
  transform-origin: center center;
  z-index: 3;
  padding: 0 1rem;
}
.bust {
  --background-color: var(--color-red);
  color: var(--color-white);
}
.twenty-one {
  --background-color: var(--color-gold);
  color: var(--color-black);
}
.bust,
.twenty-one {
  filter: drop-shadow(0 0 0.5rem var(--background-color));
}
.pop-enter-active {
  transition: all 0.3s ease-out;
}
.pop-leave-active {
  transition: all 0.1s ease-in;
}
.pop-enter-from,
.pop-leave-to {
  scale: 0;
  rotate: 360deg;
}
</style>
