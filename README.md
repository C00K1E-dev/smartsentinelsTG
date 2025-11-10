# SmartSentinels Telegram Verification Bot

A Telegram bot that verifies user membership in the SmartSentinels community group for the SSTL airdrop campaign.

## Features

- ✅ Verify Telegram group membership
- 🆔 Provide users with their Telegram User ID
- 🔗 Link wallet addresses with Telegram accounts
- 🤖 Automated verification process
- 🚀 Serverless deployment on Vercel

## Bot Commands

- `/start` - Start the bot and get your User ID
- `/verify` - Verify your group membership
- `/myid` - Get your Telegram User ID
- `/help` - Show help message

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Your Telegram group Chat ID
- Vercel account for deployment

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_group_chat_id_here
   FRONTEND_URL=https://smartsentinels.net
   ```

3. **Run the bot locally:**
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel:**
   
   Go to your project settings on Vercel Dashboard and add:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `FRONTEND_URL`

5. **Set up webhook:**
   
   After deployment, set the webhook URL:
   ```bash
   curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-bot.vercel.app/api/webhook"}'
   ```

   Or visit this URL in your browser:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-bot.vercel.app/api/webhook
   ```

## How It Works

### User Flow

1. **User joins Telegram group** (https://t.me/SmartSentinelsCommunity)
2. **User starts the bot** by sending `/start` or `/verify`
3. **Bot provides User ID** - A numeric ID needed for verification
4. **Bot verifies membership** using Telegram API
5. **User uses their ID** on the airdrop website for verification

### Verification Process

```javascript
// Bot checks if user is a member
const chatMember = await bot.getChatMember(CHAT_ID, USER_ID);

// Valid statuses: creator, administrator, member, restricted
const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(chatMember.status);
```

## API Endpoints

### `POST /api/webhook`
Receives updates from Telegram (messages, commands, callbacks)

### `GET /api/webhook`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "bot": "SmartSentinels Telegram Verification Bot",
  "timestamp": "2025-11-10T20:30:00.000Z"
}
```

## Integration with Frontend

Users get their Telegram User ID from the bot and use it on your airdrop website:

```typescript
// Frontend verification call
const response = await fetch(`${BACKEND_URL}/verify-telegram`, {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: '0x...',
    telegramUserId: '123456789' // From bot
  })
});
```

## Bot Setup with BotFather

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Get your bot token
4. Set bot commands:
   ```
   /setcommands
   
   start - Start the bot and get your User ID
   verify - Verify your group membership  
   myid - Get your Telegram User ID
   help - Show help message
   ```

5. Add bot to your group as administrator

## Group Setup

1. Add the bot to your Telegram group
2. Make the bot an **administrator** with these permissions:
   - ✅ Manage chat (required)
   - Optional: Other permissions as needed

3. Get your group Chat ID:
   ```bash
   # Send a message in your group, then visit:
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   
   # Look for "chat":{"id":-1001234567890}
   ```

## Security Notes

- ⚠️ **Never commit `.env` file** - It contains sensitive tokens
- 🔒 **Keep bot token secret** - Anyone with it can control your bot
- 👥 **Bot needs admin rights** - Required to check membership
- 🛡️ **Validate all user inputs** - Prevent injection attacks

## Troubleshooting

### Bot not responding
- ✅ Check webhook is set correctly
- ✅ Verify environment variables on Vercel
- ✅ Check Vercel function logs

### Verification fails
- ✅ Ensure bot is admin in the group
- ✅ Confirm user has joined the group
- ✅ Check Chat ID is correct (negative for groups)

### Webhook errors
```bash
# Check webhook status
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## Support

- 📧 Email: support@smartsentinels.net
- 💬 Telegram: https://t.me/SmartSentinelsCommunity
- 🐦 Twitter: https://twitter.com/SmartSentinels_

## License

MIT License - see LICENSE file for details

---

Built with ❤️ by SmartSentinels Team
