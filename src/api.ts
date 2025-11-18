// API service for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'

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

    const response = await fetch(`/api/user/info`, {
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
    // Return default balance if API fails
    return null as unknown as UserInfo;
  }
}

