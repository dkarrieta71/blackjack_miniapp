import { CardSuits, CardValue } from '@/cards'

export type CardSuit = (typeof CardSuits)[number]
export type CardRank = keyof typeof CardValue
export type HandResult = 'win' | 'lose' | 'push' | 'blackjack' | 'bust' | 'surrender'

export type Card = {
  rank: CardRank
  suit: CardSuit
  index: number
}

export type Player = {
  name?: string
  isDealer: boolean
  bank: number
  /** The player's hands (A player can have two hands after splitting) */
  hands: Hand[]
}

export type MatchBet = {
  action: string  // e.g., "hit", "stand", "double", "split", "surrender"
  handValue: number  // The hand value at the time of this action
}

export type GameState = {
  /** The shoe of cards */
  shoe: Card[]
  /** Number of cards played */
  cardsPlayed: number
  /** The players in the game, including the dealer */
  players: Player[]
  /** The player whose turn it is */
  activePlayer: Player | null
  /** The hand that is currently being played */
  activeHand: Hand | null
  /** Whether the dealer is dealing cards (preventing interaction) */
  isDealing: boolean
  /** Whether the dealer's hole card is face up */
  showDealerHoleCard: boolean
  /** Whether the sound is muted */
  isMuted: boolean
  /** Whether the game is over due to bankruptcy */
  isGameOver: boolean
  /** The download progress of the sound files */
  soundLoadProgress: number
  /** Whether insurance is currently being offered */
  insuranceOffered: boolean
  /** Whether the balance is currently being loaded from the server */
  isLoadingBalance: boolean
  /** Match bets (actions) taken during the current match */
  matchBets: MatchBet[]
  /** Whether the player is using credits (true) or real funds (false) */
  usedCredits: boolean
}

export class Hand {
  id: number
  cards: Card[]
  bet: number
  originalBet: number  // Original bet amount before any modifications (doubling, etc.)
  result?: 'win' | 'lose' | 'push' | 'bust' | 'blackjack' | 'surrender'
  insurance: number
  originalInsurance: number  // Original insurance bet amount (before payout)

  constructor(bet = 0) {
    this.id = new Date().getTime() + Math.random()
    this.cards = []
    this.bet = bet
    this.originalBet = bet
    this.insurance = 0
    this.originalInsurance = 0
  }

  get total(): number {
    let total = 0
    let addedHighAce = false
    for (const card of this.cards) {
      total += CardValue[card.rank as CardRank]
      if (card.rank === 'A' && !addedHighAce) {
        total += 10
        addedHighAce = true
      }
    }
    if (total > 21 && addedHighAce) total -= 10
    return total
  }

  get isBust(): boolean {
    return this.total > 21
  }

  get isBlackjack(): boolean {
    return this.total === 21 && this.cards.length === 2
  }

  reset() {
    this.cards = []
    this.bet = 0
    this.originalBet = 0
    this.result = undefined
    this.insurance = 0
    this.originalInsurance = 0
  }
}
