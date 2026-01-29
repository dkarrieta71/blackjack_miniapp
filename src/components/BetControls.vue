<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { state, placeBet, startRound, chipState, chipsToAmount, setChipsFromAmount, xpState } from '@/store'
import { MINIMUM_BET, MAXIMUM_BET } from '@/store'

const betAmount = ref(0)
const lastBetAmount = ref(0)
const player = computed(() => state.players[0])
const currentHand = computed(() => player.value.hands[0])
const maxBet = computed(() => Math.min(player.value.bank, MAXIMUM_BET))

// Track if we're updating from chips (to avoid circular updates)
const updatingFromChips = ref(false)
// Track if we're resetting (to prevent chip updates during reset)
const isResetting = ref(false)

// Initialize on mount - don't auto-set chips or bet amount
onMounted(() => {
  // Chips and bet amount start at 0, player must set them manually
})

// Remember bet amount when a new round starts
watch(() => currentHand.value.bet, (newBet) => {
  if (newBet === 0) {
    isResetting.value = true
    const rememberedBet = Math.min(lastBetAmount.value, maxBet.value)
    betAmount.value = rememberedBet >= MINIMUM_BET
      ? rememberedBet
      : Math.min(MINIMUM_BET, maxBet.value)
    // Don't reset chips here - playRound() handles that
    // Chips will be reset to 0; bet amount is remembered in the input
    nextTick(() => {
      setTimeout(() => {
        isResetting.value = false
      }, 150)
    })
  }
})

// Watch chip changes and update bet amount
watch(() => chipState.chips, () => {
  if (!updatingFromChips.value && !isResetting.value) {
    const chipAmount = chipsToAmount(chipState.chips)
    if (chipAmount !== betAmount.value) {
      betAmount.value = Math.min(chipAmount, maxBet.value)
    }
  }
}, { deep: true })

// Watch bet amount changes and update chips (only if not resetting, XP notification is not showing, and no bet is placed yet)
watch(betAmount, (newAmount) => {
  // Clamp bet amount to valid range (allow 0, but cap at maxBet)
  if (newAmount > maxBet.value) {
    betAmount.value = maxBet.value
    return
  }
  // Allow 0, don't force MINIMUM_BET here - validation happens when placing bet
  if (newAmount < 0) {
    betAmount.value = 0
    return
  }

  if (!updatingFromChips.value && !isResetting.value && !xpState.showXPNotification && currentHand.value.bet === 0) {
    updatingFromChips.value = true
    setChipsFromAmount(newAmount)
    nextTick(() => {
      updatingFromChips.value = false
    })
  }
})

// Watch for when XP notification finishes - chips should already be reset to 0
watch(() => xpState.showXPNotification, (isShowing) => {
  if (!isShowing && currentHand.value.bet === 0 && !isResetting.value) {
    // XP notification just finished, chips should be at 0, player must set them manually
    // No need to auto-set chips
  }
})

function setBetAmount(amount: number) {
  betAmount.value = Math.max(0, Math.min(amount, maxBet.value))
}

function halveBet() {
  setBetAmount(Math.floor(betAmount.value / 2))
}

function doubleBet() {
  setBetAmount(betAmount.value * 2)
}

function clearBet() {
  setBetAmount(0)
}

async function placeBetHandler() {
  if (state.isDealing || currentHand.value.bet > 0) return
  if (betAmount.value < MINIMUM_BET || betAmount.value > maxBet.value) return

  lastBetAmount.value = betAmount.value
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
          :min="0"
          :max="maxBet"
          :disabled="state.isDealing || currentHand.bet > 0"
        />
        <div class="bet-multipliers">
          <button
            class="multiplier-btn"
            @click="halveBet"
            :disabled="state.isDealing || currentHand.bet > 0 || betAmount <= 0"
          >
            1/2
          </button>
          <button
            class="multiplier-btn"
            @click="doubleBet"
            :disabled="state.isDealing || currentHand.bet > 0 || betAmount * 2 > maxBet"
          >
            2x
          </button>
          <button
            class="multiplier-btn clear-btn"
            @click="clearBet"
            :disabled="state.isDealing || currentHand.bet > 0 || betAmount <= 0"
            aria-label="Clear bet"
          >
            X
          </button>
        </div>
      </div>
    </div>
    <button
      class="bet-button"
      @click="placeBetHandler"
      :disabled="state.isDealing || currentHand.bet > 0 || betAmount < MINIMUM_BET || betAmount > maxBet"
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

.clear-btn {
  background: #d63c3c;
  color: var(--color-white);
}

.clear-btn:not(:disabled):hover {
  background: #b72f2f;
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

