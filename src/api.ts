// API service for backend communication
// Note: Using relative URL /api/user/info which will be proxied by Vite or handled by the server

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://florentino-mithridatic-caressingly.ngrok-free.dev'

export interface UserBalance {
  creditBalance: number;
  realBalance: number;
  totalWagered: number;
  totalWon: number;
  totalGamesPlayed: number;
}

export interface UserLevel {
  tier: string;      // e.g. "bronze"
  rank: number;
  expCurrent: number;
  expRequired: number;
}

export interface UserReferralStats {
  totalReferrals: number;
  totalEarnedCredits: number;
}

export interface UserInfo {
  userId: string;        // "2"
  telegramId: string;    // "7497336108"
  username: string;      // "bdev92"
  firstName: string;     // "R"
  lastName: string;      // "Z"
  language: string;      // "en"
  status: string;        // "active"
  joinDate: string;      // ISO date string
  balance: UserBalance;
  level: UserLevel;
  referralStats: UserReferralStats;
  xp?: XPInfo;           // XP information (optional, may not be present in all responses)
}

export interface HandResult {
  bet: number;           // Original bet amount
  insurance?: number;    // Insurance bet amount (if taken)
  result: 'win' | 'lose' | 'push' | 'bust' | 'blackjack' | 'surrender';
  payout: number;        // Final payout amount (can be negative for losses)
}

export interface GameResult {
  hands: HandResult[];   // Results for each hand (supports splits)
  totalBet: number;      // Total amount bet (sum of all hands + insurance)
  totalPayout: number;   // Total payout (can be negative)
  newBalance: number;    // Player's balance after the game
}

export interface MatchBet {
  action: string;        // e.g., "hit", "stand", "double", "split", "surrender"
  handValue: number;     // The hand value at the time of this action
}

export interface MatchSyncRequest {
  telegramId: number | string;
  gameType: string;      // e.g., "blackjack"
  usedCredits: boolean;  // Whether the player used bonus credits (true) or real funds (false)
  betAmount: number;     // Total amount bet in this match (must be positive)
  winAmount?: number | null;  // Amount won (null if player lost)
  result?: string | null;    // Match result: "Win", "Loss", "Push", "Bust", "Blackjack", "Surrender"
  matchBets?: MatchBet[];    // Array of bet actions taken during the match
}

// XP System Types
export interface XPLevel {
  tier: string;          // e.g., "bronze", "silver", "gold"
  rank: number;          // e.g., 1, 2, 3
  expCurrent: number;    // Current XP in this level
  expRequired: number;   // XP required for this level
}

export interface XPInfo {
  totalXP: number;
  redeemableXP: number;
  bonusCreditsBalance: number;
  redeemableBonusCredits: number;
  playthroughProgress: number;
  playthroughRequired: number;
  playthroughPercentage: number;
  isPlaythroughComplete: boolean;
  currentLevel: XPLevel;
  nextLevel: XPLevel;
  xpUntilNextLevel: number;
  progressPercentage: number;
  playerRank: string;    // Formatted string like "Bronze 1"
}

export interface XPRedemptionRequest {
  telegramId: number;
  xpAmount: number;
}

export interface XPRedemptionResponse {
  xpRedeemed: number;
  bonusCreditsAwarded: number;
  newRedeemableXP: number;
  newBonusCredits: number;
  playthroughRequired: number;
}

/**
 * Fetch user information from the backend
 * @param telegramId - Telegram user ID
 * @param initData - Telegram Web App init data for authentication (optional)
 * @returns User information including balance
 */
export async function getUserInfo(telegramId: number, initData?: string): Promise<UserInfo> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Include Telegram init data if available for backend authentication
    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(`${API_BASE_URL}/api/user/info`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telegramId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`)
    }

    const { data }  = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching user info:', error)
    // Throw error so caller can handle it appropriately
    throw error
  }
}

/**
 * Update user balance when a bet is placed
 * @param telegramId - Telegram user ID
 * @param betAmount - Amount being bet
 * @param newBalance - New balance after bet deduction
 * @param useRealFunds - Whether the bet is using real funds (true) or bonus credit balance (false)
 * @param initData - Telegram Web App init data for authentication (optional)
 */
export async function updateBalanceOnBet(
  telegramId: number,
  betAmount: number,
  newBalance: number,
  useRealFunds: boolean,
  initData?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(`${API_BASE_URL}/api/game/update-balance-on-bet`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telegramId,
        betAmount,
        newBalance,
        useRealFunds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update balance on bet: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error updating balance on bet:', error)
    // Don't throw - allow game to continue even if API call fails
  }
}

/**
 * Record game result when a round ends
 * @param telegramId - Telegram user ID
 * @param gameResult - Game result details
 * @param initData - Telegram Web App init data for authentication (optional)
 */
export async function recordGameResult(
  telegramId: number,
  gameResult: GameResult,
  usedCredits: boolean,
  initData?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(`${API_BASE_URL}/api/game/result`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telegramId,
        useRealFunds: !usedCredits,
        ...gameResult,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to record game result: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error recording game result:', error)
    // Don't throw - allow game to continue even if API call fails
  }
}

/**
 * Sync match data when a game match is completed
 * @param matchData - Match sync data including bets and results
 * @param initData - Telegram Web App init data for authentication (optional)
 */
export async function syncMatch(
  matchData: MatchSyncRequest,
  initData?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(`${API_BASE_URL}/api/match/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify(matchData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to sync match: ${response.statusText} - ${errorData.error || ''}`)
    }
  } catch (error) {
    console.error('Error syncing match:', error)
    // Don't throw - allow game to continue even if API call fails
  }
}

/**
 * Fetch XP information for a user
 * @param telegramId - Telegram user ID
 * @param initData - Telegram Web App init data for authentication (optional)
 * @returns XP information including level, progress, and bonus credits
 */
export async function getXPInfo(telegramId: number, initData?: string): Promise<XPInfo> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(`${API_BASE_URL}/api/xp/info`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telegramId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch XP info: ${response.statusText}`)
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching XP info:', error)
    throw error
  }
}

/**
 * Redeem XP for bonus credits
 * @param telegramId - Telegram user ID
 * @param xpAmount - Amount of XP to redeem (minimum 50)
 * @param initData - Telegram Web App init data for authentication (optional)
 * @returns Redemption details
 */
export async function redeemXP(
  telegramId: number,
  xpAmount: number,
  initData?: string
): Promise<XPRedemptionResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (initData) {
      headers['X-Telegram-Init-Data'] = initData
    }

    const response = await fetch(`${API_BASE_URL}/api/xp/redeem`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        telegramId,
        xpAmount,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to redeem XP: ${response.statusText}`)
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('Error redeeming XP:', error)
    throw error
  }
}

