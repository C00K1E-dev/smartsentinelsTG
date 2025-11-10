# SmartSentinels Telegram Bot Deployment Guide

## Quick Deploy to Vercel

### 1. Push to GitHub Repository

```bash
cd tgBot
git init
git add .
git commit -m "Initial commit: SmartSentinels Telegram bot"
git branch -M main
git remote add origin https://github.com/C00K1E-dev/smartsentinelsTG.git
git push -u origin main
```

### 2. Deploy on Vercel

**Option A: Using Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import repository: `C00K1E-dev/smartsentinelsTG`
3. Configure Project:
   - Framework Preset: **Other**
   - Root Directory: `./` (leave as default)
   - Build Command: Leave empty
   - Output Directory: Leave empty
4. Add Environment Variables:
   ```
   TELEGRAM_BOT_TOKEN=8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ
   TELEGRAM_CHAT_ID=-1002711126186
   FRONTEND_URL=https://smartsentinels.net
   ```
5. Click **Deploy**

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts and set environment variables
```

### 3. Set Telegram Webhook

After deployment, you'll get a URL like: `https://smartsentinels-tg.vercel.app`

Set the webhook:

```bash
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/setWebhook?url=https://smartsentinels-tg.vercel.app/api/webhook"
```

Or visit in browser:
```
https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/setWebhook?url=https://smartsentinels-tg.vercel.app/api/webhook
```

Expected response:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 4. Verify Deployment

Check webhook status:
```bash
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/getWebhookInfo"
```

Test health endpoint:
```bash
curl "https://smartsentinels-tg.vercel.app/api/webhook"
```

### 5. Test the Bot

1. Open Telegram
2. Search for **@SmartSentinels_BOT**
3. Send `/start`
4. You should receive a welcome message with your User ID

## Environment Variables

Set these in Vercel Dashboard under Project Settings > Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `TELEGRAM_BOT_TOKEN` | `8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ` | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | `-1002711126186` | Group chat ID |
| `FRONTEND_URL` | `https://smartsentinels.net` | Your airdrop website |

## Bot Commands Setup

Configure bot commands in @BotFather:

1. Send `/setcommands` to @BotFather
2. Select your bot
3. Paste this:

```
start - Start the bot and get your User ID
verify - Verify your group membership
myid - Get your Telegram User ID
help - Show help message
```

## Group Setup Checklist

- [ ] Bot added to group: https://t.me/SmartSentinelsCommunity
- [ ] Bot has **Administrator** rights
- [ ] Bot can read messages (Privacy Mode: Disabled in @BotFather)
- [ ] Chat ID confirmed: `-1002711126186`

## Troubleshooting

### Webhook not working
```bash
# Delete webhook
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/deleteWebhook"

# Set again
curl "https://api.telegram.org/bot8562406342:AAE-MxgNZadX1hThRdVHHHiRVvRvtEh3FlQ/setWebhook?url=https://your-url.vercel.app/api/webhook"
```

### Bot not responding
1. Check Vercel logs
2. Verify environment variables
3. Check webhook status
4. Ensure bot is admin in group

### Permission errors
Make sure bot has these admin permissions:
- Can read messages
- Can delete messages (optional)
- Can invite users (optional)

## Updates & Redeployment

To update the bot:

```bash
git add .
git commit -m "Update bot logic"
git push origin main
```

Vercel will automatically redeploy.

## Monitoring

- **Vercel Dashboard**: Check function execution logs
- **Webhook Status**: `getWebhookInfo` endpoint
- **Bot Health**: GET request to `/api/webhook`

## Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use Vercel environment variables for secrets
3. ✅ Validate all user inputs
4. ✅ Rate limit requests (implement if needed)
5. ✅ Monitor bot usage and logs

---

**Deployment Completed! 🚀**

Your bot is now live at: `https://smartsentinels-tg.vercel.app`

Test it: https://t.me/SmartSentinels_BOT
