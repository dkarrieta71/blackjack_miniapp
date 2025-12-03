<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { state, placeBet, startRound, chipState, chipsToAmount, setChipsFromAmount, resetChips } from '@/store'
import { MINIMUM_BET } from '@/store'

const betAmount = ref(MINIMUM_BET)
const player = computed(() => state.players[0])
const currentHand = computed(() => player.value.hands[0])

// Track if we're updating from chips (to avoid circular updates)
const updatingFromChips = ref(false)

// Reset bet amount when a new round starts
watch(() => currentHand.value.bet, (newBet) => {
  if (newBet === 0) {
    betAmount.value = MINIMUM_BET
    resetChips()
  }
})

// Watch chip changes and update bet amount
watch(() => chipState.chips, () => {
  if (!updatingFromChips.value) {
    const chipAmount = chipsToAmount(chipState.chips)
    if (chipAmount !== betAmount.value) {
      betAmount.value = Math.max(MINIMUM_BET, Math.min(chipAmount, player.value.bank))
    }
  }
}, { deep: true })

// Watch bet amount changes and update chips
watch(betAmount, (newAmount) => {
  if (!updatingFromChips.value) {
    updatingFromChips.value = true
    setChipsFromAmount(newAmount)
    nextTick(() => {
      updatingFromChips.value = false
    })
  }
})

function setBetAmount(amount: number) {
  const maxBet = player.value.bank
  betAmount.value = Math.max(MINIMUM_BET, Math.min(amount, maxBet))
}

function halveBet() {
  setBetAmount(Math.floor(betAmount.value / 2))
}

function doubleBet() {
  setBetAmount(betAmount.value * 2)
}

async function placeBetHandler() {
  if (state.isDealing || currentHand.value.bet > 0) return
  if (betAmount.value < MINIMUM_BET || betAmount.value > player.value.bank) return

  await placeBet(player.value, currentHand.value, betAmount.value)
  await startRound()
}
</script>

<template>
  <div class="bet-controls">
    <div class="bet-input-group">
      <label for="bet-amount">Bet Amount</label>
      <div class="input-wrapper">
        <input
          id="bet-amount"
          type="number"
          v-model.number="betAmount"
          :min="MINIMUM_BET"
          :max="player.bank"
          :disabled="state.isDealing || currentHand.bet > 0"
        />
        <div class="bet-multipliers">
          <button
            class="multiplier-btn"
            @click="halveBet"
            :disabled="state.isDealing || currentHand.bet > 0 || betAmount <= MINIMUM_BET"
          >
            1/2
          </button>
          <button
            class="multiplier-btn"
            @click="doubleBet"
            :disabled="state.isDealing || currentHand.bet > 0 || betAmount * 2 > player.bank"
          >
            2x
          </button>
        </div>
      </div>
    </div>
    <button
      class="bet-button"
      @click="placeBetHandler"
      :disabled="state.isDealing || currentHand.bet > 0 || betAmount < MINIMUM_BET || betAmount > player.bank"
    >
      BET
    </button>
  </div>
</template>

<style scoped>
.bet-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.75rem;
  width: 80%;
  margin: 0 auto;
}

.bet-input-group {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
}

.bet-input-group label {
  color: var(--color-white);
  font-size: 2rem;
  text-transform: uppercase;
  font-variation-settings: 'wght' 500;
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex: 1;
}

.input-wrapper input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--color-gold);
  border-radius: 0.5rem;
  color: var(--color-white);
  font-size: 1.8rem;
  font-variation-settings: 'wght' 600;
  text-align: center;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-white);
}

.input-wrapper input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bet-multipliers {
  display: flex;
  gap: 0.5rem;
}

.multiplier-btn {
  padding: 0.75rem 1rem;
  background: var(--color-gold);
  color: var(--color-black);
  border: none;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  font-variation-settings: 'wght' 700;
  cursor: pointer;
  min-width: 3.5rem;
}

.multiplier-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.multiplier-btn:not(:disabled):hover {
  background: #ffed4e;
  transform: translateY(-0.1rem);
}

.bet-button {
  padding: 1rem 1.5rem;
  background: var(--color-gold);
  color: var(--color-black);
  border: none;
  border-radius: 0.5rem;
  font-size: 2rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
}

.bet-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bet-button:not(:disabled):hover {
  background: #ffed4e;
  transform: translateY(-0.1rem);
}
</style>

