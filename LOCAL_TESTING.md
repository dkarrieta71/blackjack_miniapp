# Quick Local Testing Guide

## Quick Start with ngrok

1. **Install ngrok:**
   ```bash
   # Windows (Chocolatey)
   choco install ngrok
   
   # Or download from https://ngrok.com/download
   # Or npm
   npm install -g ngrok
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```
   Note the port (usually `5173`)

3. **Start tunnel (in new terminal):**
   ```bash
   npm run tunnel:ngrok
   # Or directly: ngrok http 5173
   ```

4. **Copy the HTTPS URL** from ngrok output (e.g., `https://abc123.ngrok.io`)

5. **Use in bot:** `https://abc123.ngrok.io/vlackjack/`

## Quick Start with localtunnel

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Start tunnel (in new terminal):**
   ```bash
   npm run tunnel:lt
   # Or with custom subdomain: lt --port 5173 --subdomain my-blackjack
   # Or directly: lt --port 5173
   ```

4. **Copy the HTTPS URL** from localtunnel output (e.g., `https://my-blackjack.loca.lt`)

5. **Use in bot:** `https://my-blackjack.loca.lt/vlackjack/`

## Finding Your Port

If Vite uses a different port, check the terminal output when running `npm run dev`. It will show:
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Use the port number (e.g., `5173`) in your tunnel command.

## Updating Bot Configuration

### Using BotFather
1. Send `/setmenubutton` to [@BotFather](https://t.me/BotFather)
2. Select your bot
3. Enter button text: `Play Blackjack`
4. Enter URL: `https://your-tunnel-url/vlackjack/`

### Using Bot API
Update your bot code with the new URL whenever the tunnel restarts (if using free ngrok).

## Troubleshooting

- **"Invalid URL"**: Make sure to include `/vlackjack/` at the end
- **"Connection refused"**: Make sure your dev server is running
- **"Tunnel not found"**: Make sure the tunnel is running in a separate terminal
- **App doesn't load**: Check browser console for errors, verify HTTPS is working

