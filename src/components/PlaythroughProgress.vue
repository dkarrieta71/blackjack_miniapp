<template>
  <div class="playthrough-container" v-if="shouldShow">
    <div class="playthrough-header">
      <div class="bonus-credits-label">Current Batch Bonus Credit</div>
      <div class="bonus-credits-amount">
        ${{ props.xpInfo ? props.xpInfo.bonusCreditsBalance.toFixed(2) : '0.00' }}
      </div>
    </div>
    <!-- <div class="balance-clarification">
      Current batch balance
    </div> -->
    <div
      class="playthrough-status"
      :class="{ complete: props.xpInfo?.isPlaythroughComplete }"
    >
      {{ statusText }}
    </div>
    <div class="progress-bar-wrapper">
      <div
        class="progress-bar"
        :class="{ complete: props.xpInfo?.isPlaythroughComplete }"
        :style="{ width: `${props.xpInfo?.playthroughPercentage ?? 0}%` }"
      ></div>
    </div>
    <div class="playthrough-details">
      <span class="progress-text">
        ${{ props.xpInfo?.playthroughProgress.toFixed(2) ?? '0.00' }} / ${{ props.xpInfo?.playthroughRequired.toFixed(2) ?? '0.00' }}
      </span>
      <span class="percentage-text">{{ Math.round(props.xpInfo?.playthroughPercentage ?? 0) }}%</span>
    </div>
    <div class="redeemable-section" v-if="(props.xpInfo?.redeemableBonusCredits ?? 0) > 0">
      <div class="redeemable-notice">
        ✓ ${{ props.xpInfo?.redeemableBonusCredits.toFixed(2) ?? '0.00' }} available to redeem
      </div>
      <button
        @click="handleRedeem"
        :disabled="isRedeeming"
        class="redeem-button"
      >
        {{ isRedeeming ? 'Redeeming...' : 'Redeem' }}
      </button>
      <div class="error-message" v-if="errorMessage">
        {{ errorMessage }}
      </div>
      <div class="success-message" v-if="successMessage">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { XPInfo } from '@/api'
import { redeemBonusCredits } from '@/api'
import { getTelegramUserId, getTelegramWebApp } from '@/telegram'
import { fetchXPInfo } from '@/store'
import { playSound, Sounds } from '@/sound'

const props = defineProps<{
  xpInfo: XPInfo | null
}>()

const emit = defineEmits<{
  redeemed: []
}>()

const isRedeeming = ref(false)
const errorMessage = ref<string>('')
const successMessage = ref<string>('')

const shouldShow = computed(() => {
  if (!props.xpInfo) return false
  return props.xpInfo.bonusCreditsBalance > 0 || props.xpInfo.playthroughRequired > 0
})

const statusText = computed(() => {
  if (!props.xpInfo) return ''
  return props.xpInfo.isPlaythroughComplete ? 'Playthrough Complete' : 'Playthrough In Progress'
})

async function handleRedeem() {
  if (!props.xpInfo || isRedeeming.value) return

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

    const result = await redeemBonusCredits(telegramId, initData)

    playSound(Sounds.Win)
    successMessage.value = `Successfully redeemed $${result.bonusCreditsRedeemed.toFixed(2)} bonus credits!`

    // Refresh XP info after redemption
    await fetchXPInfo(true)
    emit('redeemed')

    // Clear success message after a delay
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error redeeming bonus credits:', error)
    errorMessage.value = error instanceof Error ? error.message : 'Failed to redeem bonus credits'
    playSound(Sounds.Lose)

    // Clear error message after a delay
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
  } finally {
    isRedeeming.value = false
  }
}
</script>

<style scoped>
.playthrough-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  min-width: fit-content;
}

.playthrough-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.bonus-credits-label {
  color: var(--color-white);
  font-size: 2rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  opacity: 1;
}

.bonus-credits-amount {
  color: var(--color-gold);
  font-size: 2.5rem;
  font-variation-settings: 'wght' 700;
}

.balance-clarification {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
  text-align: center;
  font-variation-settings: 'wght' 500;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}

.playthrough-status {
  color: #ffa500;
  font-size: 1.8rem;
  font-variation-settings: 'wght' 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  opacity: 1;
}

.playthrough-status.complete {
  color: #4ade80;
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
  background: linear-gradient(90deg, #ffa500, #ffd700);
  border-radius: 0.4rem;
  transition: width 0.5s ease;
  box-shadow: 0 0 0.5rem rgba(255, 165, 0, 0.5);
}

.progress-bar.complete {
  background: linear-gradient(90deg, #4ade80, #22c55e);
  box-shadow: 0 0 0.5rem rgba(74, 222, 128, 0.5);
}

.playthrough-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-white);
  font-size: 1.6rem;
  opacity: 1;
  font-variation-settings: 'wght' 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

.redeemable-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.redeemable-notice {
  color: #4ade80;
  font-size: 1.6rem;
  text-align: center;
  font-variation-settings: 'wght' 600;
  padding: 0.5rem;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 0.25rem;
}

.redeem-button {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: var(--color-white);
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1.6rem;
  font-variation-settings: 'wght' 700;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
  width: 100%;
}

.redeem-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.5);
  transform: translateY(-2px);
}

.redeem-button:active:not(:disabled) {
  transform: translateY(0);
}

.redeem-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 1.3rem;
  text-align: center;
  font-variation-settings: 'wght' 600;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 0.25rem;
}

.success-message {
  color: #4ade80;
  font-size: 1.3rem;
  text-align: center;
  font-variation-settings: 'wght' 600;
  padding: 0.5rem;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 0.25rem;
}

@media (max-width: 768px) {
  .playthrough-container {
    padding: 0.75rem;
  }

  .bonus-credits-label {
    font-size: 1.8rem;
  }

  .bonus-credits-amount {
    font-size: 2.2rem;
  }

  .playthrough-status {
    font-size: 1.8rem;
  }

  .playthrough-details {
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
  }

  .balance-clarification {
    font-size: 1.1rem;
  }

  .redeemable-notice {
    font-size: 1.6rem;
  }

  .redeem-button {
    font-size: 1.4rem;
    padding: 0.65rem 1.25rem;
  }

  .error-message,
  .success-message {
    font-size: 1.2rem;
  }
}
</style>

