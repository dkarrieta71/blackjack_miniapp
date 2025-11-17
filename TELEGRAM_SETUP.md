# Telegram Mini App Integration Guide

This guide explains how to connect your Telegram bot to this Blackjack mini app.

## Prerequisites

1. Your mini app must be deployed and accessible via HTTPS
2. You need a Telegram Bot Token (get it from [@BotFather](https://t.me/BotFather))

## Local Development with Tunnel (ngrok/localtunnel)

For testing locally, you need to expose your local dev server via HTTPS. Here are two options:

### Option 1: Using ngrok (Recommended)

1. **Install ngrok:**
   - Download from [ngrok.com](https://ngrok.com/download)
   - Or install via npm: `npm install -g ngrok`
   - Or via chocolatey: `choco install ngrok`
   - Sign up for a free account at [ngrok.com](https://dashboard.ngrok.com/signup)

2. **Start your dev server:**
   ```bash
   npm run dev
   ```
   Your app will run on `http://localhost:5173` (or the port Vite assigns)

3. **In a new terminal, create a tunnel:**
   ```bash
   ngrok http 5173
   ```
   Or if you want a custom subdomain (requires paid plan):
   ```bash
   ngrok http 5173 --subdomain=your-custom-name
   ```

4. **Copy the HTTPS URL** from ngrok (e.g., `https://abc123.ngrok.io`)

5. **Update your bot configuration** with the ngrok URL + base path:
   - Full URL: `https://abc123.ngrok.io/vlackjack/`

**Note:** Free ngrok URLs change each time you restart. For a stable URL, use ngrok's paid plan or localtunnel.

### Option 2: Using localtunnel (Free, No Signup)

1. **Install localtunnel globally:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In a new terminal, create a tunnel:**
   ```bash
   lt --port 5173 --subdomain your-custom-name
   ```
   Or without custom subdomain (random URL):
   ```bash
   lt --port 5173
   ```

4. **Copy the HTTPS URL** from localtunnel (e.g., `https://your-custom-name.loca.lt`)

5. **Update your bot configuration** with the localtunnel URL + base path:
   - Full URL: `https://your-custom-name.loca.lt/vlackjack/`

**Note:** Custom subdomains in localtunnel are persistent (as long as you use the same name), but random URLs change each time.

### Quick Setup Scripts

You can add these scripts to your `package.json` for convenience:

```json
{
  "scripts": {
    "tunnel:ngrok": "ngrok http 5173",
    "tunnel:lt": "lt --port 5173"
  }
}
```

### Important Notes for Local Testing

- **Always use HTTPS URLs** - Telegram requires HTTPS for mini apps
- **Include the base path** - Your `vite.config.ts` has `base: '/vlackjack/'`, so append that to your tunnel URL
- **Update bot URL when tunnel restarts** - If using free ngrok, you'll need to update your bot configuration each time
- **Keep both terminals open** - Keep both the dev server and tunnel running while testing

## Step 1: Configure Your Bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newapp` command
3. Select your bot
4. Provide your mini app URL (e.g., `https://yourusername.github.io/vlackjack/`)
5. Provide a short name for your app
6. Optionally provide a description and photo

Alternatively, you can use `/setmenubutton`:
```
/setmenubutton
```
Then select your bot and provide:
- Button text (e.g., "Play Blackjack")
- URL: `https://yourusername.github.io/vlackjack/`

## Step 2: Send a Message with Web App Button (Bot Code)

Here are examples for different bot frameworks:

### Python (python-telegram-bot)

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, ContextTypes

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(
            "🎮 Play Blackjack",
            web_app={"url": "https://yourusername.github.io/vlackjack/"}
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "Welcome! Click the button below to play Blackjack:",
        reply_markup=reply_markup
    )

def main():
    application = Application.builder().token("YOUR_BOT_TOKEN").build()
    application.add_handler(CommandHandler("start", start))
    application.run_polling()

if __name__ == "__main__":
    main()
```

### Node.js (node-telegram-bot-api)

```javascript
const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const options = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🎮 Play Blackjack',
          web_app: { url: 'https://yourusername.github.io/vlackjack/' }
        }
      ]]
    }
  };
  
  bot.sendMessage(chatId, 'Welcome! Click the button below to play Blackjack:', options);
});
```

### Using Bot API directly (cURL)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<CHAT_ID>",
    "text": "Welcome! Click the button below to play Blackjack:",
    "reply_markup": {
      "inline_keyboard": [[
        {
          "text": "🎮 Play Blackjack",
          "web_app": {
            "url": "https://yourusername.github.io/vlackjack/"
          }
        }
      ]]
    }
  }'
```

## Step 3: Update Your Mini App URL

Make sure to replace `https://yourusername.github.io/vlackjack/` with your actual deployed URL.

If you're using GitHub Pages, the URL format is:
- `https://<username>.github.io/<repository-name>/`

Based on your `vite.config.ts`, your base path is `/vlackjack/`, so your full URL should match that.

## Step 4: Test Your Integration

1. Start your bot
2. Send `/start` command to your bot
3. Click the "Play Blackjack" button
4. The mini app should open in Telegram

## Accessing Telegram User Data (Optional)

If you want to access user information in your mini app, you can use the Telegram Web App API:

```typescript
import { getTelegramWebApp } from '@/telegram'

const tg = getTelegramWebApp()
if (tg) {
  const user = tg.initDataUnsafe?.user
  console.log('User ID:', user?.id)
  console.log('User Name:', user?.first_name)
}
```

## Troubleshooting

- **Button doesn't appear**: Make sure your bot is configured with `/newapp` or `/setmenubutton`
- **App doesn't open**: Verify your URL is accessible via HTTPS
- **CORS errors**: Telegram requires HTTPS for mini apps
- **App looks broken**: Check that your base path in `vite.config.ts` matches your deployment path

