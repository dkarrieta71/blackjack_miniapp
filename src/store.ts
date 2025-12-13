import { generateShoe, shuffle, CardValue, CardSuits } from '@/cards'
import type { GameState, HandResult, Player, Card, CardRank } from './types'
import { computed, nextTick, reactive } from 'vue'
import { Sounds, playSound } from './sound'
import { Hand } from './types'
import { updateBalanceOnBet, recordGameResult, syncMatch, type GameResult, type HandResult as ApiHandResult, type MatchSyncRequest, getXPInfo } from './api'
import type { XPInfo } from './api'
import { getTelegramUserId, getTelegramWebApp } from './telegram'

export const MINIMUM_BET = 1
export const MAXIMUM_BET = 10000
export const DEFAULT_STARTING_BANK = 20
const NUMBER_OF_DECKS = 6
/** Reshuffle once less than 25% of the cards are left */
const SHUFFLE_THRESHOLD = 0.25

function createInitialPlayers(startingBank: number = 0): Player[] {
  return [
    { isDealer: false, bank: startingBank, hands: [new Hand()] },
    { isDealer: true, bank: 0, hands: [new Hand()] },
  ]
}

export const state = reactive<GameState>({
  shoe: generateShoe(NUMBER_OF_DECKS),
  cardsPlayed: 0,
  players: createInitialPlayers(0), // Start with 0, will be updated from API
  activePlayer: null,
  activeHand: null,
  isDealing: true,
  showDealerHoleCard: false,
  isGameOver: false,
  isMuted: localStorage.getItem('isMuted') === 'true',
  soundLoadProgress: 0,
  insuranceOffered: false,
  isLoadingBalance: true,
  matchBets: [],
  usedCredits: localStorage.getItem('usedCredits') !== 'false', // Default to credits, use stored preference
  hasGameStarted: false, // Track if user has clicked "Start Game" at least once
})

// Track both balances separately
export const balances = reactive({
  creditBalance: 0,
  realBalance: 0,
})

// XP System state
export const xpState = reactive<{
  xpInfo: XPInfo | null
  isLoading: boolean
  lastUpdated: number | null
  earnedXP: number | null
  showXPNotification: boolean
}>({
  xpInfo: null,
  isLoading: false,
  lastUpdated: null,
  earnedXP: null,
  showXPNotification: false,
})

// Chip denominations
export const CHIP_DENOMINATIONS = [1, 5, 10, 25, 50, 100, 500, 1000] as const

// Chip state - tracks how many of each chip denomination are in the bet
export const chipState = reactive<{
  chips: Record<number, number> // denomination -> count
  showAfterXP: boolean // Show chips after XP notification finishes
}>({
  chips: {},
  showAfterXP: true,
})

// Initialize chip state
CHIP_DENOMINATIONS.forEach(denom => {
  chipState.chips[denom] = 0
})

/**
 * Convert bet amount to chips (greedy algorithm - uses largest denominations first)
 */
export function amountToChips(amount: number): Record<number, number> {
  const chips: Record<number, number> = {}
  CHIP_DENOMINATIONS.forEach(denom => {
    chips[denom] = 0
  })

  let remaining = amount
  // Sort denominations in descending order
  const sortedDenoms = [...CHIP_DENOMINATIONS].sort((a, b) => b - a)

  for (const denom of sortedDenoms) {
    const count = Math.floor(remaining / denom)
    chips[denom] = count
    remaining -= count * denom
  }

  return chips
}

/**
 * Convert chips to total amount
 */
export function chipsToAmount(chips: Record<number, number>): number {
  return Object.entries(chips).reduce((total, [denom, count]) => {
    return total + Number(denom) * count
  }, 0)
}

/**
 * Add a chip to the bet
 */
export function addChip(denomination: number) {
  chipState.chips[denomination] = (chipState.chips[denomination] || 0) + 1
}

/**
 * Remove a chip from the bet
 */
export function removeChip(denomination: number) {
  if (chipState.chips[denomination] > 0) {
    chipState.chips[denomination] = chipState.chips[denomination] - 1
  }
}

/**
 * Reset all chips
 */
export function resetChips() {
  CHIP_DENOMINATIONS.forEach(denom => {
    chipState.chips[denom] = 0
  })
}

/**
 * Set chips from an amount
 */
export function setChipsFromAmount(amount: number) {
  const chips = amountToChips(amount)
  CHIP_DENOMINATIONS.forEach(denom => {
    chipState.chips[denom] = chips[denom] || 0
  })
}

// Computed Properties

export const dealer = computed(() => state.players[state.players.length - 1])

const dealerHasBlackjack = computed(() => {
  return dealer.value.hands[0].isBlackjack
})

const dealerTotal = computed(() => dealer.value.hands[0].total)

const nextPlayer = computed(() => {
  if (!state.activePlayer || state.activePlayer === dealer.value) return null
  return state.players[state.players.indexOf(state.activePlayer) + 1]
})

/** Check if bet is placed and cards are dealt */
export const canPlayActions = computed(() => {
  const playerHand = state.players[0].hands[0]
  // Must have placed a bet
  if (playerHand.bet === 0) return false
  // Must have cards dealt (at least 2 cards for player and dealer)
  if (playerHand.cards.length === 0) return false
  if (dealer.value.hands[0].cards.length === 0) return false
  // Cannot play actions if dealer has blackjack and hole card is revealed
  if (state.showDealerHoleCard && dealerHasBlackjack.value) return false
  // Cannot play actions if dealer has 17-21 and hole card is revealed (dealer must stand)
  if (state.showDealerHoleCard && dealerTotal.value >= 17 && dealerTotal.value <= 21) return false
  // Cannot play actions if hand already has a result
  if (playerHand.result) return false
  return true
})

/** Check if a hand is a soft hand (has an Ace that can be counted as 11) */
function isSoftHand(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false
  const hasAce = hand.cards.some(card => card.rank === 'A')
  if (!hasAce) return false
  // If both cards are Aces, it's not a soft hand (it's a pair)
  const aceCount = hand.cards.filter(card => card.rank === 'A').length
  if (aceCount === 2) return false
  // Check if Ace can be counted as 11 without busting
  // With 2 cards and one Ace, if the other card is 2-10, Ace can be 11
  const otherCard = hand.cards.find(card => card.rank !== 'A')
  if (!otherCard) return false
  const otherValue = CardValue[otherCard.rank as CardRank]
  // Ace as 11 + other card value should be <= 21
  return 11 + otherValue <= 21
}

export const canDoubleDown = computed(() => {
  if (!canPlayActions.value) return false
  if (state.isDealing) return false
  if (!state.activeHand || !state.activePlayer) return false
  if (state.activePlayer.isDealer) return false
  if ((state.activePlayer.bank ?? 0) < (state.activeHand.bet ?? 0)) return false

  // Must have exactly 2 cards (cannot double after hitting)
  // This check must come first to prevent doubling after any hit
  const cardCount = state.activeHand.cards.length
  if (cardCount !== 2) return false

  // Must be first hand only (cannot double on split hands)
  if (state.activePlayer.hands.length > 1) return false

  const hand = state.activeHand
  const total = hand.total
  const isSoft = isSoftHand(hand)

  // Can double on 10 or 11 (any combination)
  if (total === 10 || total === 11) return true

  // Can double on soft hands (Ace + number)
  if (isSoft) return true

  // Can double on hard 9 if dealer shows 3-6
  // Hard 9 means total is 9 and it's not a soft hand
  if (total === 9 && !isSoft) {
    const dealerUpCard = dealer.value.hands[0].cards[1] // Dealer's visible card (second card)
    if (dealerUpCard) {
      const dealerValue = CardValue[dealerUpCard.rank as CardRank]
      // Dealer shows 3, 4, 5, or 6
      if (dealerValue >= 3 && dealerValue <= 6) return true
    }
  }

  return false
})

export const canSplit = computed(() => {
  if (!canPlayActions.value) return false
  if (state.isDealing) return false
  if ((state.activePlayer?.bank ?? 0) < (state.activeHand?.bet ?? 0)) return false
  return (
    state.activeHand?.cards.length === 2 &&
    state.activePlayer?.hands.length === 1 &&
    state.activeHand?.cards[0].rank === state.activeHand!.cards[1].rank
  )
})

export const canTakeInsurance = computed(() => {
  if (!canPlayActions.value) return false
  if (!state.insuranceOffered) return false
  if (state.isDealing) return false
  const playerHand = state.players[0].hands[0]
  if (playerHand.insurance > 0) return false // Already took insurance
  if ((state.players[0].bank ?? 0) < Math.floor(playerHand.bet / 2)) return false // Can't afford insurance
  // Check if dealer's up card (second card, index 1) is an Ace
  const dealerUpCard = dealer.value.hands[0].cards[1]
  return dealerUpCard?.rank === 'A'
})

export const canSurrender = computed(() => {
  if (!canPlayActions.value) return false
  if (state.isDealing) return false
  if (state.insuranceOffered) return false // Can't surrender during insurance offer
  if (!state.activeHand) return false
  if (!state.activePlayer || state.activePlayer.isDealer) return false
  // Surrender only available on initial two cards, first hand only
  // This check must come early to prevent surrender after any hit
  const cardCount = state.activeHand.cards.length
  if (cardCount !== 2) return false
  if (state.activePlayer.hands.length > 1) return false // Can't surrender split hands
  if (state.activeHand.isBlackjack) return false // Can't surrender blackjack
  if (state.activeHand.result) return false // Already has a result
  return true
})

export const resetBank = () => {
  state.players.forEach((p) => (p.bank = DEFAULT_STARTING_BANK))
}

/**
 * Set the player's initial balances from the server
 * @param creditBalance - The credit balance
 * @param realBalance - The real balance
 */
export function setInitialBalances(creditBalance: number, realBalance: number) {
  balances.creditBalance = creditBalance
  balances.realBalance = realBalance
  updatePlayerBank()
  state.isLoadingBalance = false
}

/**
 * Update the player's bank based on the current usedCredits setting
 * If the selected balance is 0, automatically switch to the other balance type
 */
export function updatePlayerBank() {
  if (state.players[0]) {
    if (state.usedCredits) {
      // Using Bonus Credits
      if (balances.creditBalance > 0) {
        state.players[0].bank = balances.creditBalance
      } else if (balances.realBalance > 0) {
        // Credit balance is 0, switch to Real Funds
        state.usedCredits = false
        localStorage.setItem('usedCredits', 'false')
        state.players[0].bank = balances.realBalance
      } else {
        // Both are 0
        state.players[0].bank = 0
      }
    } else {
      // Using Real Funds
      if (balances.realBalance > 0) {
        state.players[0].bank = balances.realBalance
      } else if (balances.creditBalance > 0) {
        // Real balance is 0, switch to Bonus Credits
        state.usedCredits = true
        localStorage.setItem('usedCredits', 'true')
        state.players[0].bank = balances.creditBalance
      } else {
        // Both are 0
        state.players[0].bank = 0
      }
    }
  }
}

/**
 * Toggle between Bonus Credits and Real Funds
 * Prevents toggling if there's an active bet or game in progress
 */
export function toggleBalanceType() {
  // Don't allow toggling if there's an active bet or game in progress
  const playerHand = state.players[0]?.hands[0]
  if (playerHand && (playerHand.bet > 0 || playerHand.cards.length > 0)) {
    return // Can't toggle during an active game
  }
  state.usedCredits = !state.usedCredits
  localStorage.setItem('usedCredits', state.usedCredits.toString())
  updatePlayerBank() // Update the displayed bank to reflect the new balance type
}

// Functions

/** Play a round of blackjack.  Reset hands, reshuffle, and wait for bet. */
export async function playRound() {
  state.hasGameStarted = true // Mark that game has started
  if (checkForGameOver()) return
  // Ensure shoe has cards - if empty, regenerate it
  if (state.shoe.length === 0) {
    state.shoe = generateShoe(NUMBER_OF_DECKS)
    state.cardsPlayed = 0
  }
  state.players.forEach((p) => (p.hands = [new Hand()]))
  state.showDealerHoleCard = false
  state.isDealing = false
  state.insuranceOffered = false
  state.matchBets = [] // Reset match bets for new round
  // Don't reset chips here if XP notification is showing - chips will be reset after showing them post-XP
  // If no XP notification, reset chips immediately to 0
  if (!xpState.showXPNotification) {
    resetChips() // Reset chips for new round (to 0)
  }
  // If XP notification is showing, chips will be preserved and shown after XP, then reset in refreshXPInfo
  // Wait for user to place bet via BetControls component
}

/** Start the round after bet is placed - deal cards and play the first turn. */
export async function startRound() {
  if (state.players[0].hands[0].bet === 0) return
  state.isDealing = true
  state.insuranceOffered = false

  chipState.showAfterXP = false

  await dealRound()
  // Check if dealer's up card is an Ace - offer insurance
  const dealerUpCard = dealer.value.hands[0].cards[1]
  if (dealerUpCard?.rank === 'A') {
    state.insuranceOffered = true
    state.isDealing = false
    // Wait for player to decide on insurance or continue
    return
  }
  if (dealerHasBlackjack.value) return endRound()
  playTurn(state.players[0])
}

/** If the player is bankrupt, end the game. */
function checkForGameOver(): boolean {
  if (state.players[0].bank < MINIMUM_BET) {
    playSound(Sounds.GameOver)
    state.isGameOver = true
    return true
  }
  return false
}

/** Draw a card from the shoe. */
function drawCard() {
  reshuffleIfNeeded()
  const card = state.shoe.shift()
  if (!card) {
    // Emergency fallback: regenerate shoe if somehow empty
    state.shoe = generateShoe(NUMBER_OF_DECKS)
    state.cardsPlayed = 0
    return state.shoe.shift()
  }
  state.cardsPlayed++
  return card
}

/** Reshuffle the shoe if less than 25% of the cards are left. */
function reshuffleIfNeeded() {
  // If shoe is empty or nearly empty, regenerate it
  if (state.shoe.length === 0) {
    state.shoe = generateShoe(NUMBER_OF_DECKS)
    state.cardsPlayed = 0
    return
  }
  const remainingPercentage = 1 - state.cardsPlayed / (NUMBER_OF_DECKS * 52)
  if (remainingPercentage > SHUFFLE_THRESHOLD) return
  // Collect all cards from hands and add them back to shoe before reshuffling
  const allCards: Card[] = []
  for (const player of state.players) {
    for (const hand of player.hands) {
      allCards.push(...hand.cards)
    }
  }
  state.shoe = shuffle([...state.shoe, ...allCards])
  state.cardsPlayed = 0
}

/** Deal two cards to each player */
async function dealRound() {
  const forceDealerAce = import.meta.env.VITE_FORCE_DEALER_ACE === 'true'

  // Debug: log env variable (remove in production)
  if (import.meta.env.DEV) {
    console.log('VITE_FORCE_DEALER_ACE:', import.meta.env.VITE_FORCE_DEALER_ACE, 'forceDealerAce:', forceDealerAce)
  }

  for (let i = 0; i < 2; i++) {
    for (const player of state.players) {
      let card = drawCard()

      // Force dealer's up card (second card, index 1) to be an Ace for testing
      if (forceDealerAce && player.isDealer && i === 1) {
        // Always force an Ace for dealer's up card when env var is set
        if (!card || card.rank !== 'A') {
          // Find an Ace in the shoe
          const aceIndex = state.shoe.findIndex(c => c.rank === 'A')
          if (aceIndex !== -1) {
            // Put the current card back at the front and get the Ace
            if (card) {
              state.shoe.unshift(card)
            }
            // After unshift, the aceIndex is now aceIndex + 1
            card = state.shoe.splice(aceIndex + 1, 1)[0]
          } else {
            // Generate an Ace if none found in shoe
            if (card) {
              state.shoe.unshift(card)
            }
            card = { rank: 'A', suit: CardSuits[0], index: -1 }
          }
        }
      }

      if (card) {
        player.hands[0].cards.push(card)
        playSound(Sounds.Deal)
        await sleep(600)
      }
    }
  }
}

/** Place a bet for the player. */
export async function placeBet(player: Player, hand: Hand, amount: number) {
  // Validate bet amount
  if (amount < MINIMUM_BET || amount > MAXIMUM_BET) {
    console.error(`Bet amount ${amount} is out of range (${MINIMUM_BET}-${MAXIMUM_BET})`)
    return
  }
  state.isDealing = true
  await nextTick()
  player.bank -= amount
  // Update the appropriate balance
  if (state.usedCredits) {
    balances.creditBalance -= amount
  } else {
    balances.realBalance -= amount
  }
  hand.bet += amount
  // Track original bet amount (only set on initial bet, not on doubles)
  if (hand.originalBet === 0) {
    hand.originalBet = amount
  } else {
    // For doubles/splits, originalBet is the initial bet, don't change it
    hand.originalBet = hand.originalBet
  }
  playSound(Sounds.Bet)
  await sleep()

  // Update balance on backend
  const telegramId = getTelegramUserId()
  const tg = getTelegramWebApp()
  const initData = tg?.initData || undefined
  if (telegramId) {
    updateBalanceOnBet(telegramId, amount, player.bank, !state.usedCredits, initData).catch(err => {
      console.error('Failed to update balance on bet:', err)
    })
  }
}

/** Take insurance when dealer shows an Ace. */
export async function takeInsurance() {
  if (!canTakeInsurance.value) return
  const playerHand = state.players[0].hands[0]
  const player = state.players[0]
  const insuranceAmount = Math.floor(playerHand.bet / 2)
  // Deduct insurance from player's bank
  player.bank = player.bank - insuranceAmount
  // Update the appropriate balance
  if (state.usedCredits) {
    balances.creditBalance -= insuranceAmount
  } else {
    balances.realBalance -= insuranceAmount
  }
  playerHand.insurance = insuranceAmount
  playerHand.originalInsurance = insuranceAmount
  playSound(Sounds.Bet)
  await sleep()
  // After insurance decision, check for dealer blackjack
  state.insuranceOffered = false
  await revealDealerHoleCard()
  if (dealerHasBlackjack.value) return endRound()
  // If dealer has 17-21, dealer must stand, so automatically settle
  if (dealerTotal.value >= 17 && dealerTotal.value <= 21) {
    return endRound()
  }
  playTurn(state.players[0])
}

/** Decline insurance and continue with the round. */
export async function declineInsurance() {
  if (!state.insuranceOffered) return
  state.insuranceOffered = false
  // Check for dealer blackjack after declining insurance
  await revealDealerHoleCard()
  if (dealerHasBlackjack.value) return endRound()
  // If dealer has 17-21, dealer must stand, so automatically settle
  if (dealerTotal.value >= 17 && dealerTotal.value <= 21) {
    return endRound()
  }
  playTurn(state.players[0])
}

/** Surrender the hand - player gets back half of their bet and round ends. */
export async function surrender() {
  if (!canSurrender.value) return
  if (!state.activeHand) return
  state.isDealing = true
  const handValue = state.activeHand.total
  trackMatchBet('surrender', handValue)
  state.activeHand.result = 'surrender'
  // Player gets back half of their bet
  const halfBet = state.activeHand.bet / 2
  state.activeHand.bet = halfBet
  await sleep()
  playSound(Sounds.Lose)
  await sleep(300)
  // End the round immediately
  endRound()
}

/** Start a player's turn by making them the active player and starting their first hand. */
function playTurn(player: Player) {
  state.activePlayer = player
  if (player.isDealer) return playDealerHand(player.hands[0])
  playHand(player.hands[0])
}

/** Set a hand as the active hand. End immediately if the player has blackjack. Deal additional cards to split hands. */
async function playHand(hand: Hand): Promise<void> {
  state.isDealing = true
  state.activeHand = hand
  if (await checkForBlackjack(hand)) return
  if (hand.cards.length === 1) {
    // Newly split hand
    await hit()
    if (hand.cards[0].rank === 'A') return endHand() // Player cannot hit after splitting aces
  }
  state.isDealing = false
}

/** Check if the player has blackjack. If so, award the player and end the hand. */
async function checkForBlackjack(hand: Hand): Promise<boolean> {
  if (hand.isBlackjack) {
    if (!state.activePlayer?.isDealer) {
      trackMatchBet('blackjack', hand.total)
    }
    hand.result = 'blackjack'
    await sleep(100)
    playSound(Sounds.BlackjackBoom)
    await sleep(500)
    playSound(Sounds.Blackjack)
    await sleep(1200)
    hand.bet *= 3
    endHand()
    return true
  }
  return false
}

/** Play the dealer's hand. */
async function playDealerHand(hand: Hand) {
  state.isDealing = true
  state.activeHand = hand
  await revealDealerHoleCard()
  const allPlayersDone = state.players.every(
    (p) => p.isDealer || p.hands.every((h: Hand) => !!h.result),
  )
  if (allPlayersDone) return endRound()
  if (dealerTotal.value < 17) {
    await hit()
    if (!dealer.value.hands[0].result) return playDealerHand(hand)
  }
  endRound()
}

/** Track a match bet action */
function trackMatchBet(action: string, handValue: number) {
  if (!state.activePlayer?.isDealer && state.activeHand) {
    state.matchBets.push({ action, handValue })
  }
}

/** Deal one more card to the active hand, and check for 21 or a bust. */
export async function hit() {
  // Prevent hitting if dealer has blackjack and hole card is revealed
  if (state.showDealerHoleCard && dealerHasBlackjack.value) return
  // Prevent hitting if hand already has a result
  if (state.activeHand?.result) return
  state.isDealing = true
  const handValue = state.activeHand!.total
  state.activeHand!.cards.push(drawCard()!)
  trackMatchBet('hit', handValue)
  playSound(Sounds.Deal)
  if (await checkForTwentyOne(state.activeHand!)) return
  if (await checkForBust(state.activeHand!)) return
  await sleep()
  if (!state.activePlayer?.isDealer) state.isDealing = false
}

/** Check if the player has 21.  If so, end the hand. */
async function checkForTwentyOne(hand: Hand): Promise<boolean> {
  if (hand.total === 21) {
    if (!state.activePlayer?.isDealer) playSound(Sounds.GoodHit)
    await sleep()
    endHand()
    return true
  }
  return false
}

/** Check if the player has busted.  If so, end the hand. */
async function checkForBust(hand: Hand): Promise<boolean> {
  if (hand.isBust) {
    if (!state.activePlayer?.isDealer) {
      trackMatchBet('bust', hand.total)
      playSound(Sounds.BadHit)
    }
    await sleep()
    state.activeHand = null
    await sleep(300)
    hand.result = 'bust'
    if (!state.activePlayer?.isDealer) playSound(Sounds.Bust)
    endHand()
    return true
  }
  return false
}

/** Split the active hand into two hands, and restart the player's turn. */
export async function split(): Promise<void> {
  if (!canSplit.value) return
  // Prevent splitting if dealer has blackjack and hole card is revealed
  if (state.showDealerHoleCard && dealerHasBlackjack.value) return
  state.isDealing = true
  const handValue = state.activeHand!.total
  trackMatchBet('split', handValue)
  const bet = state.activeHand!.bet
  const originalBet = state.activeHand!.originalBet
  const splitHands = [new Hand(bet), new Hand(0)]
  // Preserve original bet for both split hands
  splitHands[0].originalBet = originalBet
  splitHands[1].originalBet = originalBet
  splitHands[0].cards = state.activeHand!.cards.slice(0, 1)
  splitHands[1].cards = state.activeHand!.cards.slice(1)
  state.activeHand = null
  await sleep()
  state.activePlayer!.hands = splitHands
  await placeBet(state.activePlayer!, state.activePlayer!.hands[1], bet)
  playTurn(state.activePlayer!)
}

/** Double the bet for the active hand, and hit only once. */
export async function doubleDown(): Promise<void> {
  if (!canDoubleDown.value) return
  // Prevent doubling if dealer has blackjack and hole card is revealed
  if (state.showDealerHoleCard && dealerHasBlackjack.value) return
  const handValue = state.activeHand!.total
  trackMatchBet('double', handValue)
  await placeBet(state.activePlayer!, state.activeHand!, state.activeHand!.bet)
  await hit()
  endHand()
}

/** Advance to the next hand or player. */
export async function endHand() {
  // Track "stand" action when player ends their hand (not dealer, no result set yet)
  // Results are set for: blackjack, bust, surrender - these are tracked separately
  if (state.activeHand && !state.activePlayer?.isDealer && !state.activeHand.result) {
    trackMatchBet('stand', state.activeHand.total)
  }
  const isSplit = state.activePlayer && state.activePlayer.hands.length > 1
  if (isSplit && state.activePlayer?.hands[1].cards.length === 1) {
    return playHand(state.activePlayer?.hands[1])
  }
  if (nextPlayer.value) playTurn(nextPlayer.value)
}

/** Determine any remaining results, settle bets, collect winnings, and reset hands before starting a new round. */
async function endRound() {
  state.isDealing = true
  if (!state.showDealerHoleCard) await revealDealerHoleCard()
  if (dealerHasBlackjack.value) playSound(Sounds.DealerBlackjack)
  state.activeHand = null
  state.activePlayer = null
  await determineResults()
  await settleBets()
  await collectWinnings()
  await resetHands()
  playRound()
}

/** Reveal the dealer's hole card. */
async function revealDealerHoleCard() {
  if (state.showDealerHoleCard) return
  await sleep()
  playSound(Sounds.Deal)
  state.showDealerHoleCard = true
  await sleep()
}

/** Determine the result for each hand (e.g. win, lose, push, blackjack, bust). */
async function determineResults() {
  for (const player of state.players) {
    if (player.isDealer) continue
    for (const hand of player.hands) {
      if (hand.result) continue
      // If dealer has blackjack, player loses unless they also have blackjack (push)
      if (dealerHasBlackjack.value) {
        if (hand.isBlackjack) {
          hand.result = 'push'
        } else {
          hand.result = 'lose'
        }
      } else if (dealerTotal.value > 21) {
        hand.result = 'win'
      } else if (dealerTotal.value === hand.total) {
        hand.result = 'push'
      } else if (dealerTotal.value < hand.total) {
        hand.result = 'win'
      } else {
        hand.result = 'lose'
      }
      playSoundForResult(hand.result)
      await sleep()
    }
  }
}

/** Play a sound for the result of a hand. */
function playSoundForResult(result: HandResult) {
  if (result === 'win') {
    playSound(Sounds.Win)
  } else if (result === 'push') {
    playSound(Sounds.Push)
  } else if (!dealerHasBlackjack.value) {
    playSound(Sounds.Lose)
  }
}

/** Add each hand's winnings to the hand's bet amount (so it can be collected later).*/
async function settleBets() {
  let total = 0
  for (const player of state.players) {
    if (player.isDealer) continue
    for (const hand of player.hands) {
      // Handle insurance payouts first
      if (hand.insurance > 0) {
        if (dealerHasBlackjack.value) {
          // Insurance pays even money (2x the insurance bet)
          hand.insurance *= 2
        } else {
          // Insurance is lost
          hand.insurance = 0
        }
      }
      // Blackjack is paid out immediately, so it is not handled here
      // Surrender: bet is already set to half in surrender() function, so just collect it
      if (hand.result === 'win') hand.bet *= 1.97
      if (['lose', 'bust'].includes(hand.result!)) hand.bet = 0
      // For surrender, bet is already half, so we don't modify it
      total += hand.bet + hand.insurance
    }
  }
  playSound(total > 1 ? Sounds.ChipUp : Sounds.ChipDown)
  await sleep()
}

/** Collect the total winnings (from each hand's bet) and add it to the player's bank. */
async function collectWinnings() {
  for (const player of state.players) {
    if (player.isDealer) continue

    // Calculate game results before resetting hands
    const apiHands: ApiHandResult[] = []
    let totalBet = 0
    let totalPayout = 0

    for (const hand of player.hands) {
      // Calculate payout: final amount - original bet - insurance
      // Note: hand.bet and hand.insurance are already settled (wins doubled, losses zeroed)
      const finalPayout = hand.bet + hand.insurance
      const originalBetAmount = hand.originalBet || 0
      const insuranceAmount = hand.originalInsurance || 0
      const payout = finalPayout - originalBetAmount - insuranceAmount

      apiHands.push({
        bet: originalBetAmount,
        insurance: insuranceAmount > 0 ? insuranceAmount : undefined,
        result: hand.result || 'lose',
        payout: payout,
      })

      totalBet += originalBetAmount + insuranceAmount
      totalPayout += payout
    }

    const total = player.hands.reduce((acc: number, hand: Hand) => acc + hand.bet + hand.insurance, 0)
    player.bank += total
    // Update the appropriate balance
    if (state.usedCredits) {
      balances.creditBalance += total
    } else {
      balances.realBalance += total
    }
    if (total > 0) playSound(Sounds.Bank)

    // Record game result on backend
    const telegramId = getTelegramUserId()
    const tg = getTelegramWebApp()
    const initData = tg?.initData || undefined
    if (telegramId && apiHands.length > 0) {
      const gameResult: GameResult = {
        hands: apiHands,
        totalBet: totalBet,
        totalPayout: totalPayout,
        newBalance: player.bank,
      }
      recordGameResult(telegramId, gameResult, state.usedCredits, initData).catch(err => {
        console.error('Failed to record game result:', err)
      })

      // Sync match data to backend
      // Determine overall match result
      let matchResult: string | null = null
      let winAmount: number | null = null

      // Check for special results first (blackjack, bust, surrender)
      const hasBlackjack = apiHands.some(h => h.result === 'blackjack')
      const hasBust = apiHands.some(h => h.result === 'bust')
      const hasSurrender = apiHands.some(h => h.result === 'surrender')

      if (hasBlackjack) {
        matchResult = 'Blackjack'
      } else if (hasBust) {
        matchResult = 'Bust'
      } else if (hasSurrender) {
        matchResult = 'Surrender'
      } else if (totalPayout > 0) {
        matchResult = 'Win'
      } else if (totalPayout < 0) {
        matchResult = 'Loss'
      } else {
        matchResult = 'Push'
      }

      // Calculate win amount (null if lost or pushed)
      if (totalPayout > 0) {
        winAmount = totalPayout
      } else {
        winAmount = null
      }

      const matchData: MatchSyncRequest = {
        telegramId: telegramId,
        gameType: 'blackjack',
        usedCredits: state.usedCredits,
        betAmount: totalBet,
        winAmount: winAmount,
        result: matchResult,
        matchBets: state.matchBets.length > 0 ? state.matchBets.map(bet => ({
          action: bet.action,
          handValue: bet.handValue,
        })) : undefined,
      }

      syncMatch(matchData, initData).catch(err => {
        console.error('Failed to sync match:', err)
      })
    }

    // Show XP notification after finishing bet
    // Determine result: win, lose, or push
    let gameResult: 'win' | 'lose' | 'push'
    if (totalPayout > 0) {
      gameResult = 'win'
    } else if (totalPayout < 0) {
      gameResult = 'lose'
    } else {
      gameResult = 'push'
    }
    refreshXPInfo(gameResult, state.usedCredits)

    // Reset hands after recording
    for (const hand of player.hands) {
      hand.bet = 0
      hand.insurance = 0
    }
  }
  await sleep(300)
}

/** Reset all hands to an initial state. */
async function resetHands() {
  for (const player of state.players) {
    for (const hand of player.hands) {
      state.shoe.push(...hand.cards)
      hand.reset()
    }
  }
  await sleep()
}

/** Sleep for a given number of milliseconds. This paces the game and gives time for animations and sounds. */
function sleep(ms: number = 900) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch and update XP information from the backend
 * @param forceRefresh - Force refresh even if recently updated
 * @returns XP information
 */
export async function fetchXPInfo(forceRefresh: boolean = false): Promise<XPInfo | null> {
  const telegramId = getTelegramUserId()
  const tg = getTelegramWebApp()
  const initData = tg?.initData || undefined

  if (!telegramId) {
    return null // Can't fetch XP without Telegram ID
  }

  // Don't refresh if recently updated (within last 2 seconds) unless forced
  if (!forceRefresh && xpState.lastUpdated && Date.now() - xpState.lastUpdated < 2000) {
    return xpState.xpInfo
  }

  xpState.isLoading = true
  try {
    const xpInfo = await getXPInfo(telegramId, initData)
    xpState.xpInfo = xpInfo
    xpState.lastUpdated = Date.now()
    return xpInfo
  } catch (error) {
    console.error('Failed to fetch XP info:', error)
    // Don't throw - allow game to continue even if XP fetch fails
    return null
  } finally {
    xpState.isLoading = false
  }
}

/**
 * Show XP notification after finishing a bet and update XP progress
 * @param result - The game result: 'win', 'lose', or 'push'
 * @param usedCredits - Whether bonus credits were used (true) or real funds (false)
 * @returns The amount of XP earned
 */
export function refreshXPInfo(result: 'win' | 'lose' | 'push', usedCredits: boolean): number {
  // Calculate XP based on result and balance type
  // Real funds: win=2xp, lose=1xp, push=0.5xp
  // Bonus credit: win=1xp, lose=0.5xp, push=0.25xp
  let earnedXP: number
  if (usedCredits) {
    // Bonus credit rates
    earnedXP = result === 'win' ? 1 : result === 'lose' ? 0.5 : 0.25
  } else {
    // Real funds rates
    earnedXP = result === 'win' ? 2 : result === 'lose' ? 1 : 0.5
  }

  console.log(`XP earned: ${earnedXP} (${result}, ${usedCredits ? 'bonus credit' : 'real funds'})`)

  // Update XP info if it exists
  if (xpState.xpInfo) {
    // Update total XP
    xpState.xpInfo.totalXP += earnedXP

    // Update current level XP
    xpState.xpInfo.currentLevel.expCurrent += earnedXP

    // Check if leveled up (expCurrent exceeds expRequired)
    if (xpState.xpInfo.currentLevel.expCurrent >= xpState.xpInfo.currentLevel.expRequired) {
      // Leveled up - need to fetch from backend to get accurate level info
      const telegramId = getTelegramUserId()
      if (telegramId) {
        fetchXPInfo(true).catch(err => {
          console.error('Failed to refresh XP info after level up:', err)
        })
      }
    } else {
      // Update progress percentage for current level
      xpState.xpInfo.progressPercentage =
        (xpState.xpInfo.currentLevel.expCurrent / xpState.xpInfo.currentLevel.expRequired) * 100

      // Update XP until next level
      xpState.xpInfo.xpUntilNextLevel =
        Math.max(0, xpState.xpInfo.currentLevel.expRequired - xpState.xpInfo.currentLevel.expCurrent)
    }
  }

  // Show notification
  xpState.earnedXP = earnedXP
  xpState.showXPNotification = true

  // Auto-hide notification after 2.5 seconds, then show chips
  setTimeout(() => {
    xpState.showXPNotification = false
    // Show chips after XP notification disappears
    chipState.showAfterXP = true
    // Clear earned XP after animation completes
    setTimeout(() => {
      xpState.earnedXP = null
    }, 400)
    // Hide chips after showing them for a short time, then reset for new round
    setTimeout(() => {
      //chipState.showAfterXP = false
      // Reset chips to 0 for new round - player must set them manually
      resetChips()
    }, 1500) // Show chips for 1.5 seconds
  }, 2500)

  return earnedXP
}
