<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { state, placeBet, startRound, chipState, chipsToAmount, setChipsFromAmount, xpState } from '@/store'
import { MINIMUM_BET, MAXIMUM_BET } from '@/store'

const betAmount = ref(MINIMUM_BET)
const player = computed(() => state.players[0])
const currentHand = computed(() => player.value.hands[0])
const maxBet = computed(() => Math.min(player.value.bank, MAXIMUM_BET))

// Track if we're updating from chips (to avoid circular updates)
const updatingFromChips = ref(false)
// Track if we're resetting (to prevent chip updates during reset)
const isResetting = ref(false)

// Initialize chips to MINIMUM_BET on mount if no bet is placed
onMounted(() => {
  if (currentHand.value.bet === 0) {
    const chipAmount = chipsToAmount(chipState.chips)
    if (chipAmount === 0) {
      updatingFromChips.value = true
      setChipsFromAmount(MINIMUM_BET)
      nextTick(() => {
        updatingFromChips.value = false
      })
    }
  }
})

// Reset bet amount when a new round starts
watch(() => currentHand.value.bet, (newBet) => {
  if (newBet === 0) {
    isResetting.value = true
    betAmount.value = MINIMUM_BET
    // Don't reset chips here - playRound() handles that
    // Just wait a bit and then set chips to MINIMUM_BET if they're 0
    nextTick(() => {
      setTimeout(() => {
        isResetting.value = false
        // Set chips to show MINIMUM_BET if they're still 0 (playRound might have reset them)
        const chipAmount = chipsToAmount(chipState.chips)
        if (chipAmount === 0) {
          updatingFromChips.value = true
          setChipsFromAmount(MINIMUM_BET)
          nextTick(() => {
            updatingFromChips.value = false
          })
        }
      }, 150)
    })
  }
})

// Watch chip changes and update bet amount
watch(() => chipState.chips, () => {
  if (!updatingFromChips.value && !isResetting.value) {
    const chipAmount = chipsToAmount(chipState.chips)
    if (chipAmount !== betAmount.value) {
      betAmount.value = Math.max(MINIMUM_BET, Math.min(chipAmount, maxBet.value))
    }
  }
}, { deep: true })

// Watch bet amount changes and update chips (only if not resetting, XP notification is not showing, and no bet is placed yet)
watch(betAmount, (newAmount) => {
  // Clamp bet amount to valid range
  if (newAmount > maxBet.value) {
    betAmount.value = maxBet.value
    return
  }
  if (newAmount < MINIMUM_BET) {
    betAmount.value = MINIMUM_BET
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

// Watch for when XP notification finishes and ensure chips are set to MINIMUM_BET
watch(() => xpState.showXPNotification, (isShowing) => {
  if (!isShowing && currentHand.value.bet === 0 && !isResetting.value) {
    // XP notification just finished, check if chips need to be set
    const chipAmount = chipsToAmount(chipState.chips)
    if (chipAmount === 0) {
      updatingFromChips.value = true
      setChipsFromAmount(MINIMUM_BET)
      nextTick(() => {
        updatingFromChips.value = false
      })
    }
  }
})

function setBetAmount(amount: number) {
  betAmount.value = Math.max(MINIMUM_BET, Math.min(amount, maxBet.value))
}

function halveBet() {
  setBetAmount(Math.floor(betAmount.value / 2))
}

function doubleBet() {
  setBetAmount(betAmount.value * 2)
}

async function placeBetHandler() {
  if (state.isDealing || currentHand.value.bet > 0) return
  if (betAmount.value < MINIMUM_BET || betAmount.value > maxBet.value) return

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
          :max="maxBet"
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
            :disabled="state.isDealing || currentHand.bet > 0 || betAmount * 2 > maxBet"
          >
            2x
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

