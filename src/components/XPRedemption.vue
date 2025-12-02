<template>
  <div class="redemption-container" v-if="xpInfo">
    <div class="redemption-header">
      <div class="title">REDEEM XP</div>
      <div class="available-xp">Available: {{ xpInfo.redeemableXP }} XP</div>
    </div>
    <div class="conversion-info">
      <div class="rate">50 XP = $1.00</div>
      <div class="minimum">Minimum: 50 XP</div>
    </div>
    <div class="input-section">
      <input
        v-model.number="xpAmount"
        type="number"
        :min="50"
        :max="xpInfo.redeemableXP"
        :step="50"
        placeholder="Enter XP amount (min 50)"
        class="xp-input"
        :disabled="isRedeeming"
        @input="handleInputChange"
        @blur="handleInputBlur"
      />
      <button
        @click="handleRedeem"
        :disabled="!canRedeem || isRedeeming"
        class="redeem-button"
      >
        {{ isRedeeming ? 'Redeeming...' : 'Redeem' }}
      </button>
    </div>
    <div class="preview" v-if="xpAmount >= 50 && canRedeem">
      <div class="preview-label">You will receive:</div>
      <div class="preview-amount">${{ bonusCreditsPreview.toFixed(2) }}</div>
    </div>
    <div class="validation-message" v-if="xpAmount > 0 && xpAmount < 50">
      Minimum redemption is 50 XP
    </div>
    <div class="validation-message" v-if="xpInfo && xpAmount > xpInfo.redeemableXP">
      You only have {{ xpInfo.redeemableXP }} XP available
    </div>
    <div class="validation-message" v-if="xpAmount >= 50 && xpAmount <= (xpInfo?.redeemableXP || 0) && xpAmount % 50 !== 0">
      Amount must be a multiple of 50 XP
    </div>
    <div class="error-message" v-if="errorMessage">
      {{ errorMessage }}
    </div>
    <div class="success-message" v-if="successMessage">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { XPInfo } from '@/api'
import { redeemXP } from '@/api'
import { getTelegramUserId, getTelegramWebApp } from '@/telegram'
import { playSound, Sounds } from '@/sound'

const props = defineProps<{
  xpInfo: XPInfo | null
}>()

const emit = defineEmits<{
  redeemed: []
}>()

const xpAmount = ref<number>(0)
const isRedeeming = ref(false)
const errorMessage = ref<string>('')
const successMessage = ref<string>('')

const bonusCreditsPreview = computed(() => {
  if (xpAmount.value < 50) return 0
  return xpAmount.value / 50
})

const canRedeem = computed(() => {
  if (!props.xpInfo) return false
  if (xpAmount.value < 50) return false
  if (xpAmount.value > props.xpInfo.redeemableXP) return false
  // Round to nearest 50 for validation
  const rounded = Math.round(xpAmount.value / 50) * 50
  if (rounded !== xpAmount.value) return false // Must be multiple of 50
  return true
})

// Auto-round input to nearest 50
function roundToNearest50(value: number): number {
  return Math.round(value / 50) * 50
}

function handleInputChange() {
  errorMessage.value = ''
  successMessage.value = ''
}

function handleInputBlur() {
  if (xpAmount.value && xpAmount.value >= 50) {
    const rounded = roundToNearest50(xpAmount.value)
    if (rounded >= 50 && rounded <= (props.xpInfo?.redeemableXP || 0)) {
      xpAmount.value = rounded
    }
  }
}

watch(xpAmount, () => {
  errorMessage.value = ''
  successMessage.value = ''
})

async function handleRedeem() {
  if (!canRedeem.value || !props.xpInfo) return

  errorMessage.value = ''
  successMessage.value = ''
  isRedeeming.value = true

  try {
    const telegramId = getTelegramUserId()
    const tg = getTelegramWebApp()
    const initData = tg?.initData || undefined

    if (!telegramId) {
      throw new Error('Telegram user ID not available')
    }

    const result = await redeemXP(telegramId, xpAmount.value, initData)

    playSound(Sounds.Win)
    successMessage.value = `Successfully redeemed ${result.xpRedeemed} XP for $${result.bonusCreditsAwarded.toFixed(2)} bonus credits!`
    xpAmount.value = 0

    // Emit event to refresh XP data
    emit('redeemed')
  } catch (error: any) {
    console.error('Error redeeming XP:', error)
    errorMessage.value = error.message || 'Failed to redeem XP. Please try again.'
    playSound(Sounds.Bust)
  } finally {
    isRedeeming.value = false
  }
}
</script>

<style scoped>
.redemption-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 217, 0, 0.3);
  min-width: fit-content;
}

.redemption-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.title {
  color: var(--color-gold);
  font-size: 2.2rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
}

.available-xp {
  color: var(--color-white);
  font-size: 1.8rem;
  opacity: 1;
  font-variation-settings: 'wght' 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.conversion-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 217, 0, 0.1);
  border-radius: 0.25rem;
}

.rate {
  color: var(--color-gold);
  font-size: 1.8rem;
  font-variation-settings: 'wght' 700;
  text-shadow: 0 0 8px rgba(255, 217, 0, 0.4);
}

.minimum {
  color: var(--color-white);
  font-size: 1.6rem;
  opacity: 1;
  font-variation-settings: 'wght' 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.input-section {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.xp-input {
  flex: 1;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 217, 0, 0.3);
  border-radius: 0.5rem;
  color: var(--color-white);
  font-size: 2rem;
  font-variation-settings: 'wght' 500;
  text-align: center;
  transition: border-color 0.2s ease;
}

.xp-input:focus {
  outline: none;
  border-color: var(--color-gold);
  background: rgba(255, 255, 255, 0.15);
}

.xp-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.redeem-button {
  padding: 1rem 2rem;
  background: var(--color-gold);
  color: var(--color-black);
  font-size: 2rem;
  font-variation-settings: 'wght' 700;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  white-space: nowrap;
}

.redeem-button:hover:not(:disabled) {
  background: #ffed4e;
  transform: scale(1.05);
}

.redeem-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 217, 0, 0.1);
  border-radius: 0.25rem;
}

.preview-label {
  color: var(--color-white);
  font-size: 1.6rem;
  opacity: 1;
  font-variation-settings: 'wght' 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.preview-amount {
  color: var(--color-gold);
  font-size: 2.5rem;
  font-variation-settings: 'wght' 700;
}

.validation-message {
  color: #ffa500;
  font-size: 1.3rem;
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 165, 0, 0.1);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 165, 0, 0.3);
}

.error-message {
  color: var(--color-red);
  font-size: 1.4rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 51, 51, 0.1);
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 51, 51, 0.3);
}

.success-message {
  color: #4ade80;
  font-size: 1.4rem;
  text-align: center;
  padding: 0.75rem;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 0.25rem;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

@media (max-width: 768px) {
  .redemption-container {
    padding: 1rem;
  }

  .title {
    font-size: 1.8rem;
  }

  .available-xp {
    font-size: 1.4rem;
  }

  .rate,
  .minimum {
    font-size: 1.3rem;
  }

  .xp-input {
    font-size: 1.6rem;
    padding: 0.75rem 1rem;
  }

  .redeem-button {
    font-size: 1.6rem;
    padding: 0.75rem 1.5rem;
  }

  .preview-amount {
    font-size: 2rem;
  }

  .input-section {
    flex-direction: column;
  }

  .redeem-button {
    width: 100%;
  }
}
</style>

