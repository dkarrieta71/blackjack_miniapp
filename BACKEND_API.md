# Backend API Endpoints Documentation

This document describes the API endpoints that need to be implemented on the backend to support the Blackjack mini app.

## Base URL
All endpoints use the base URL configured via the `VITE_API_BASE_URL` environment variable in the `.env` file.

**Example `.env` file:**
```
VITE_API_BASE_URL=https://florentino-mithridatic-caressingly.ngrok-free.dev
VITE_FORCE_DEALER_ACE=true
```

If `VITE_API_BASE_URL` is not set, it defaults to `https://florentino-mithridatic-caressingly.ngrok-free.dev` (for backward compatibility).

## Authentication
All endpoints should verify the Telegram Web App authentication using the `X-Telegram-Init-Data` header if provided. The backend should validate this header to ensure the request is coming from a legitimate Telegram Web App.

---

## 1. Update Balance on Bet

**Endpoint:** `POST /api/game/bet`

**Description:** Called when a player places a bet. This updates the player's balance by deducting the bet amount.

**Request Headers:**
```
Content-Type: application/json
X-Telegram-Init-Data: <telegram_init_data> (optional, for authentication)
```

**Request Body:**
```json
{
  "telegramId": 7497336108,
  "betAmount": 5.0,
  "newBalance": 15.0
}
```

**Request Body Fields:**
- `telegramId` (number, required): The Telegram user ID
- `betAmount` (number, required): The amount being bet
- `newBalance` (number, required): The player's new balance after deducting the bet

**Backend Actions:**
1. Verify the user exists and is authenticated
2. Validate that the user has sufficient balance (should match `newBalance + betAmount`)
3. Deduct the bet amount from the user's `creditBalance`
4. Update `totalWagered` by adding `betAmount`
5. Return success response

**Response:**
```json
{
  "success": true,
  "message": "Balance updated"
}
```

**Error Response (400/401/500):**
```json
{
  "success": false,
  "error": "Insufficient balance" | "User not found" | "Invalid request"
}
```

---

## 2. Record Game Result

**Endpoint:** `POST /api/game/result`

**Description:** Called when a game round ends. This records the game result, updates statistics, and adjusts the balance based on winnings/losses.

**Request Headers:**
```
Content-Type: application/json
X-Telegram-Init-Data: <telegram_init_data> (optional, for authentication)
```

**Request Body:**
```json
{
  "telegramId": 7497336108,
  "hands": [
    {
      "bet": 5.0,
      "insurance": 2.5,
      "result": "win",
      "payout": 7.5
    }
  ],
  "totalBet": 7.5,
  "totalPayout": 7.5,
  "newBalance": 22.5
}
```

**Request Body Fields:**
- `telegramId` (number, required): The Telegram user ID
- `hands` (array, required): Array of hand results (supports multiple hands from splits)
  - `bet` (number, required): Original bet amount for this hand
  - `insurance` (number, optional): Insurance bet amount (only present if insurance was taken)
  - `result` (string, required): One of: `"win"`, `"lose"`, `"push"`, `"bust"`, `"blackjack"`, `"surrender"`
  - `payout` (number, required): Net payout for this hand (can be negative for losses)
    - For wins: payout = (final amount) - (original bet) - (insurance)
    - For losses: payout = -(original bet) - (insurance)
    - For push: payout = 0 (bet returned)
    - For surrender: payout = -(original bet / 2) (half returned)
    - For blackjack: payout = (original bet * 2) (3x total, minus original bet)
- `totalBet` (number, required): Sum of all original bets + insurance across all hands
- `totalPayout` (number, required): Sum of all payouts across all hands (can be negative)
- `newBalance` (number, required): Player's balance after the game

**Backend Actions:**
1. Verify the user exists and is authenticated
2. Calculate the balance change: `totalPayout` (positive means winnings, negative means losses)
3. Update the user's `creditBalance` to `newBalance`
4. Update statistics:
   - `totalWagered`: Add `totalBet` (already includes insurance)
   - `totalWon`: If `totalPayout > 0`, add `totalPayout`; if negative, this represents losses
   - `totalGamesPlayed`: Increment by 1
5. Record the game history (store in database for analytics/audit):
   - User ID
   - Timestamp
   - All hand details
   - Total bet and payout
   - Final result (win/loss/push)
6. Return success response

**Response:**
```json
{
  "success": true,
  "message": "Game result recorded"
}
```

**Error Response (400/401/500):**
```json
{
  "success": false,
  "error": "User not found" | "Invalid game result" | "Database error"
}
```

---

## Example Scenarios

### Scenario 1: Simple Win
**Bet:** $5
**Result:** Win
**Payout Calculation:**
- Original bet: $5
- Final payout: $10 (bet doubled)
- Net payout: $10 - $5 = $5

**Request to `/api/game/result`:**
```json
{
  "telegramId": 7497336108,
  "hands": [{
    "bet": 5.0,
    "result": "win",
    "payout": 5.0
  }],
  "totalBet": 5.0,
  "totalPayout": 5.0,
  "newBalance": 25.0
}
```

### Scenario 2: Blackjack
**Bet:** $5
**Result:** Blackjack (pays 3x)
**Payout Calculation:**
- Original bet: $5
- Final payout: $15 (bet tripled)
- Net payout: $15 - $5 = $10

**Request to `/api/game/result`:**
```json
{
  "telegramId": 7497336108,
  "hands": [{
    "bet": 5.0,
    "result": "blackjack",
    "payout": 10.0
  }],
  "totalBet": 5.0,
  "totalPayout": 10.0,
  "newBalance": 30.0
}
```

### Scenario 3: Loss
**Bet:** $5
**Result:** Lose
**Payout Calculation:**
- Original bet: $5
- Final payout: $0
- Net payout: $0 - $5 = -$5

**Request to `/api/game/result`:**
```json
{
  "telegramId": 7497336108,
  "hands": [{
    "bet": 5.0,
    "result": "lose",
    "payout": -5.0
  }],
  "totalBet": 5.0,
  "totalPayout": -5.0,
  "newBalance": 15.0
}
```

### Scenario 4: Surrender
**Bet:** $2
**Result:** Surrender (half returned)
**Payout Calculation:**
- Original bet: $2
- Final payout: $1 (half returned)
- Net payout: $1 - $2 = -$1

**Request to `/api/game/result`:**
```json
{
  "telegramId": 7497336108,
  "hands": [{
    "bet": 2.0,
    "result": "surrender",
    "payout": -1.0
  }],
  "totalBet": 2.0,
  "totalPayout": -1.0,
  "newBalance": 19.0
}
```

### Scenario 5: Insurance Win
**Bet:** $10, Insurance: $5
**Result:** Dealer has blackjack, insurance wins (2x), main bet loses
**Payout Calculation:**
- Original bet: $10
- Insurance: $5
- Insurance payout: $10 (2x)
- Main bet: $0 (lost)
- Final payout: $10
- Net payout: $10 - $10 - $5 = -$5

**Request to `/api/game/result`:**
```json
{
  "telegramId": 7497336108,
  "hands": [{
    "bet": 10.0,
    "insurance": 5.0,
    "result": "lose",
    "payout": -5.0
  }],
  "totalBet": 15.0,
  "totalPayout": -5.0,
  "newBalance": 15.0
}
```

### Scenario 6: Split Hands
**Bet:** $5 each (split into 2 hands)
**Result:** First hand wins, second hand loses
**Payout Calculation:**
- Hand 1: $5 bet → $10 payout → net +$5
- Hand 2: $5 bet → $0 payout → net -$5
- Total payout: $0

**Request to `/api/game/result`:**
```json
{
  "telegramId": 7497336108,
  "hands": [
    {
      "bet": 5.0,
      "result": "win",
      "payout": 5.0
    },
    {
      "bet": 5.0,
      "result": "lose",
      "payout": -5.0
    }
  ],
  "totalBet": 10.0,
  "totalPayout": 0.0,
  "newBalance": 20.0
}
```

---

## Important Notes

1. **Balance Consistency:** The backend should validate that the balance changes are consistent. For example:
   - When a bet is placed: `newBalance = oldBalance - betAmount`
   - When a game ends: `newBalance = oldBalance + totalPayout`

2. **Concurrency:** Handle concurrent requests properly. Use database transactions to ensure balance updates are atomic.

3. **Error Handling:** If the API call fails on the frontend, the game will continue locally, but the backend won't be updated. Consider implementing a reconciliation mechanism.

4. **Telegram Authentication:** Always validate the `X-Telegram-Init-Data` header to prevent unauthorized access. The header contains signed data that can be verified using your bot token.

5. **Decimal Precision:** All monetary values are numbers and can include decimals (e.g., $0.5 for surrender). Handle decimal precision appropriately in your database.

6. **Game History:** It's recommended to store detailed game history for:
   - Audit purposes
   - Dispute resolution
   - Analytics and reporting
   - User game history/replay features

