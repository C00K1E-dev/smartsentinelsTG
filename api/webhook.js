// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://smartsentinels.net';

// Telegram API helper using native fetch
async function telegramRequest(method, params = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.json();
}

// Main handler for Vercel
export default async function handler(req, res) {
  // Handle GET requests (health check)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      bot: 'SmartSentinels',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle POST requests (webhook)
  if (req.method === 'POST') {
    // Respond immediately to Telegram
    res.status(200).json({ ok: true });
    
    // Process update async
    try {
      const update = req.body;
      await processUpdate(update);
    } catch (error) {
      console.error('Error:', error);
    }
    
    return;
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// Process incoming updates
async function processUpdate(update) {
  try {
    // Handle messages
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username || msg.from.first_name || 'User';
      const text = msg.text || '';

      if (text.startsWith('/start')) {
        await handleStart(chatId, userId, username);
      } else if (text.startsWith('/verify')) {
        await handleVerify(chatId, userId, username);
      } else if (text.startsWith('/myid')) {
        await handleMyId(chatId, userId);
      } else if (text.startsWith('/help')) {
        await handleHelp(chatId);
      }
    }
    
    // Handle callback queries
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message.chat.id;
      const userId = query.from.id;
      const username = query.from.username || query.from.first_name || 'User';
      
      await telegramRequest('answerCallbackQuery', {
        callback_query_id: query.id,
        text: 'Processing...'
      });
      
      if (query.data === 'verify_membership') {
        await handleVerify(chatId, userId, username);
      }
    }
  } catch (error) {
    console.error('Process update error:', error);
  }
}

// Command handlers
async function handleStart(chatId, userId, username) {
  const message = `🤖 *Welcome to SmartSentinels Bot!*

I help verify your Telegram membership for the SSTL Airdrop.

*Your Telegram User ID:* \`${userId}\`

*How it works:*
1️⃣ Join: https://t.me/SmartSentinelsCommunity
2️⃣ Use /verify to check membership
3️⃣ Use your User ID (${userId}) on the website

*Commands:*
/verify - Check membership
/myid - Get your User ID
/help - Show help

🌐 ${FRONTEND_URL}`;

  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Verify Membership', callback_data: 'verify_membership' }],
        [{ text: '🌐 Go to Airdrop', url: FRONTEND_URL }]
      ]
    }
  });
}

async function handleVerify(chatId, userId, username) {
  try {
    // Check membership
    const result = await telegramRequest('getChatMember', {
      chat_id: TELEGRAM_CHAT_ID,
      user_id: userId
    });
    
    if (!result.ok) {
      throw new Error(result.description || 'Failed to verify');
    }
    
    const status = result.result.status;
    const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
    
    if (isMember) {
      await telegramRequest('sendMessage', {
        chat_id: chatId,
        text: `✅ *Verification Successful!*

You are a verified member!

*User ID:* \`${userId}\`
*Username:* @${username}
*Status:* ${status}

Use your User ID (\`${userId}\`) on the airdrop website!

🌐 ${FRONTEND_URL}`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎁 Claim Points', url: FRONTEND_URL }
          ]]
        }
      });
    } else {
      await telegramRequest('sendMessage', {
        chat_id: chatId,
        text: `❌ *Not a Member*

Please join first:
👉 https://t.me/SmartSentinelsCommunity

Then use /verify again.`,
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error('Verify error:', error);
    await telegramRequest('sendMessage', {
      chat_id: chatId,
      text: `⚠️ *Error*

Unable to verify. Please:
1. Join https://t.me/SmartSentinelsCommunity
2. Try /verify again

Error: ${error.message}`,
      parse_mode: 'Markdown'
    });
  }
}

async function handleMyId(chatId, userId) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: `🆔 *Your Telegram ID*

*User ID:* \`${userId}\`

Use this on the SmartSentinels airdrop website!`,
    parse_mode: 'Markdown'
  });
}

async function handleHelp(chatId) {
  await telegramRequest('sendMessage', {
    chat_id: chatId,
    text: `📖 *Bot Help*

*Commands:*
/start - Start & get User ID
/verify - Verify membership
/myid - Get User ID
/help - Show this help

*Airdrop Steps:*
1️⃣ Join Telegram group
2️⃣ Use /verify
3️⃣ Visit website
4️⃣ Enter your User ID
5️⃣ Earn SSTL tokens!

🌐 ${FRONTEND_URL}
👥 https://t.me/SmartSentinelsCommunity`,
    parse_mode: 'Markdown'
  });
}
