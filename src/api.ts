// API service for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com'

export interface UserInfo {
  balance: number
  // Add other user info fields as needed
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

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching user info:', error)
    // Return default balance if API fails
    return { balance: 20 }
  }
}

