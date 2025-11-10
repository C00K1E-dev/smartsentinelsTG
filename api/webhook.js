import TelegramBot from 'node-telegram-bot-api';

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://smartsentinels.net';

// In-memory storage for user verification data (in production, use a database)
const verifiedUsers = new Map();

// Initialize bot
let bot;

// For Vercel serverless, we use webhook mode
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST') {
    try {
      // Initialize bot if not already done
      if (!bot) {
        bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
      }

      // Process incoming update
      const update = req.body;
      
      // Telegram expects a 200 response immediately
      res.status(200).json({ ok: true });
      
      // Process update asynchronously (don't await here)
      processUpdate(update).catch(err => {
        console.error('Error processing update:', err);
      });

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(200).json({ ok: true }); // Still return 200 to Telegram
    }
  } else if (req.method === 'GET') {
    // Health check endpoint
    res.status(200).json({ 
      status: 'ok', 
      bot: 'SmartSentinels Telegram Verification Bot',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

async function processUpdate(update) {
  if (!bot) {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  }

  // Handle messages
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from.id;
    const username = message.from.username || message.from.first_name;
    const text = message.text || '';

    // Handle /start command
    if (text.startsWith('/start')) {
      await handleStartCommand(chatId, userId, username, text);
    }
    // Handle /verify command
    else if (text.startsWith('/verify')) {
      await handleVerifyCommand(chatId, userId, username);
    }
    // Handle /myid command
    else if (text.startsWith('/myid')) {
      await handleMyIdCommand(chatId, userId, username);
    }
    // Handle /help command
    else if (text.startsWith('/help')) {
      await handleHelpCommand(chatId);
    }
  }

  // Handle callback queries (button clicks)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  }
}

async function handleStartCommand(chatId, userId, username, text) {
  // Check if there's a wallet address parameter
  const params = text.split(' ');
  const walletAddress = params[1];

  const welcomeMessage = `
🤖 *Welcome to SmartSentinels Verification Bot!*

I help verify your Telegram membership for the SSTL Airdrop Campaign.

*Your Telegram User ID:* \`${userId}\`

*How it works:*
1️⃣ Join our community: https://t.me/SmartSentinelsCommunity
2️⃣ Use the /verify command to check your membership
3️⃣ Use your User ID (${userId}) in the airdrop website

*Available Commands:*
/verify - Check if you're a member
/myid - Get your Telegram User ID
/help - Show this help message

🌐 Visit: ${FRONTEND_URL}
`;

  if (walletAddress) {
    // Store verification data
    verifiedUsers.set(userId, {
      walletAddress,
      username,
      timestamp: Date.now(),
      verified: false
    });

    await bot.sendMessage(chatId, welcomeMessage + `\n\n✅ Wallet address linked: \`${walletAddress}\``, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Verify Membership', callback_data: 'verify_membership' }],
          [{ text: '🌐 Go to Airdrop', url: FRONTEND_URL }]
        ]
      }
    });
  } else {
    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }
}

async function handleVerifyCommand(chatId, userId, username) {
  try {
    // Check if user is a member of the group
    const chatMember = await bot.getChatMember(TELEGRAM_CHAT_ID, userId);
    const status = chatMember.status;
    const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);

    if (isMember) {
      // Update verification status
      const userData = verifiedUsers.get(userId) || {};
      userData.verified = true;
      userData.verificationTime = Date.now();
      verifiedUsers.set(userId, userData);

      await bot.sendMessage(chatId, `
✅ *Verification Successful!*

You are a verified member of SmartSentinels Community!

*Your User ID:* \`${userId}\`
*Username:* @${username}
*Status:* ${status}

Use your User ID (\`${userId}\`) on the airdrop website to claim your points!

🌐 ${FRONTEND_URL}
`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎁 Claim Airdrop Points', url: FRONTEND_URL }]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, `
❌ *Verification Failed*

You are not a member of SmartSentinels Community.

*Status:* ${status}

Please join the group first:
👉 https://t.me/SmartSentinelsCommunity

After joining, use /verify again to confirm your membership.
`, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    await bot.sendMessage(chatId, `
⚠️ *Verification Error*

Unable to verify your membership. Please make sure:
1. You've joined https://t.me/SmartSentinelsCommunity
2. The bot has admin rights in the group
3. Try again in a few seconds

Error: ${error.message}
`, { parse_mode: 'Markdown' });
  }
}

async function handleMyIdCommand(chatId, userId, username) {
  await bot.sendMessage(chatId, `
🆔 *Your Telegram Information*

*User ID:* \`${userId}\`
*Username:* ${username ? `@${username}` : 'Not set'}

Use this User ID on the SmartSentinels airdrop website to verify your membership!

💡 Tip: You can click on your User ID to copy it.
`, { parse_mode: 'Markdown' });
}

async function handleHelpCommand(chatId) {
  await bot.sendMessage(chatId, `
📖 *SmartSentinels Bot Help*

*Available Commands:*
/start - Start the bot and get your User ID
/verify - Verify your group membership
/myid - Get your Telegram User ID
/help - Show this help message

*How to participate in the airdrop:*
1️⃣ Join our Telegram group
2️⃣ Use /verify to confirm membership
3️⃣ Visit the airdrop website
4️⃣ Enter your User ID to verify
5️⃣ Complete tasks and earn SSTL tokens!

🌐 Airdrop Website: ${FRONTEND_URL}
👥 Telegram Group: https://t.me/SmartSentinelsCommunity
🐦 Twitter: https://twitter.com/SmartSentinels_

Need help? Contact the team in our Telegram group!
`, { parse_mode: 'Markdown' });
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const username = callbackQuery.from.username || callbackQuery.from.first_name;
  const data = callbackQuery.data;

  // Answer the callback query to remove loading state
  await bot.answerCallbackQuery(callbackQuery.id);

  if (data === 'verify_membership') {
    await handleVerifyCommand(chatId, userId, username);
  }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  console.log('Starting bot in development mode...');
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on('message', async (msg) => {
    await processUpdate({ message: msg });
  });

  bot.on('callback_query', async (query) => {
    await processUpdate({ callback_query: query });
  });

  console.log('✅ Bot is running in polling mode');
}
