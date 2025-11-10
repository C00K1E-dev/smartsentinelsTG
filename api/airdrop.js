// Simple in-memory storage for airdrop data
// For production, replace with a real database (MongoDB, PostgreSQL, etc.)

// In-memory storage
const airdropData = new Map();
const telegramLinks = new Map(); // telegramUserId -> walletAddress

// Helper to get or create user data
function getUserData(walletAddress) {
  const key = walletAddress.toLowerCase();
  if (!airdropData.has(key)) {
    airdropData.set(key, {
      walletAddress: key,
      points: 0,
      completedTasks: [],
      telegramUserId: null,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    });
  }
  return airdropData.get(key);
}

// API Handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { walletAddress, taskId, points, telegramUserId } = req.body || {};

  try {
    // GET - Retrieve user progress
    if (method === 'GET') {
      const wallet = req.query.wallet?.toLowerCase();
      
      if (!wallet) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      const userData = getUserData(wallet);
      return res.status(200).json({
        success: true,
        data: userData
      });
    }

    // POST - Complete a task
    if (method === 'POST') {
      const action = req.query.action;

      // Verify Telegram and complete task
      if (action === 'complete-task') {
        if (!walletAddress || !taskId || points === undefined) {
          return res.status(400).json({ 
            error: 'Missing required fields: walletAddress, taskId, points' 
          });
        }

        const userData = getUserData(walletAddress);

        // Check if task already completed
        if (userData.completedTasks.includes(taskId)) {
          return res.status(400).json({
            success: false,
            error: 'Task already completed'
          });
        }

        // Special handling for Telegram task
        if (taskId === 'join-telegram') {
          if (!telegramUserId) {
            return res.status(400).json({
              success: false,
              error: 'Telegram User ID required'
            });
          }

          // Check if Telegram ID is already linked to another wallet
          const existingWallet = telegramLinks.get(telegramUserId);
          if (existingWallet && existingWallet !== walletAddress.toLowerCase()) {
            return res.status(400).json({
              success: false,
              error: 'This Telegram account is already linked to another wallet'
            });
          }

          // Link Telegram to wallet
          telegramLinks.set(telegramUserId, walletAddress.toLowerCase());
          userData.telegramUserId = telegramUserId;
        }

        // Complete the task
        userData.completedTasks.push(taskId);
        userData.points += points;
        userData.lastUpdated = Date.now();

        return res.status(200).json({
          success: true,
          data: userData
        });
      }

      // Check if Telegram ID is available
      if (action === 'check-telegram') {
        if (!telegramUserId) {
          return res.status(400).json({ error: 'Telegram User ID required' });
        }

        const existingWallet = telegramLinks.get(telegramUserId);
        const isAvailable = !existingWallet || (walletAddress && existingWallet === walletAddress.toLowerCase());

        return res.status(200).json({
          success: true,
          available: isAvailable,
          linkedWallet: existingWallet || null
        });
      }

      // Get leaderboard
      if (action === 'leaderboard') {
        const limit = parseInt(req.query.limit) || 10;
        
        const leaderboard = Array.from(airdropData.values())
          .sort((a, b) => b.points - a.points)
          .slice(0, limit)
          .map((user, index) => ({
            rank: index + 1,
            address: user.walletAddress,
            points: user.points,
            tasksCompleted: user.completedTasks.length
          }));

        return res.status(200).json({
          success: true,
          data: leaderboard
        });
      }

      // Export all data (for theMiracle or other integrations)
      if (action === 'export') {
        const format = req.query.format || 'json';
        
        // Get all users with points > 0
        const allUsers = Array.from(airdropData.values())
          .filter(user => user.points > 0)
          .sort((a, b) => b.points - a.points);

        if (format === 'csv') {
          // CSV format
          const csvHeader = 'Wallet Address,Points,Tasks Completed,Telegram User ID,Created At,Last Updated\n';
          const csvRows = allUsers.map(user => 
            `${user.walletAddress},${user.points},${user.completedTasks.length},${user.telegramUserId || 'N/A'},${new Date(user.createdAt).toISOString()},${new Date(user.lastUpdated).toISOString()}`
          ).join('\n');
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="airdrop_data_${Date.now()}.csv"`);
          return res.status(200).send(csvHeader + csvRows);
        }

        if (format === 'themiracle') {
          // theMiracle API format
          const miracleFormat = allUsers.map(user => ({
            address: user.walletAddress,
            allocation: user.points,
            metadata: {
              tasksCompleted: user.completedTasks.length,
              telegramVerified: !!user.telegramUserId,
              timestamp: user.lastUpdated
            }
          }));

          return res.status(200).json({
            success: true,
            totalParticipants: miracleFormat.length,
            totalPoints: allUsers.reduce((sum, u) => sum + u.points, 0),
            data: miracleFormat,
            exportedAt: new Date().toISOString()
          });
        }

        // Default JSON format with full details
        return res.status(200).json({
          success: true,
          totalParticipants: allUsers.length,
          totalPoints: allUsers.reduce((sum, u) => sum + u.points, 0),
          data: allUsers,
          exportedAt: new Date().toISOString()
        });
      }

      // Get statistics
      if (action === 'stats') {
        const totalUsers = airdropData.size;
        const totalPoints = Array.from(airdropData.values()).reduce((sum, u) => sum + u.points, 0);
        const totalTelegramLinks = telegramLinks.size;
        
        const taskCompletionStats = {};
        Array.from(airdropData.values()).forEach(user => {
          user.completedTasks.forEach(taskId => {
            taskCompletionStats[taskId] = (taskCompletionStats[taskId] || 0) + 1;
          });
        });

        return res.status(200).json({
          success: true,
          stats: {
            totalParticipants: totalUsers,
            totalPointsDistributed: totalPoints,
            totalTelegramLinks: totalTelegramLinks,
            averagePointsPerUser: totalUsers > 0 ? (totalPoints / totalUsers).toFixed(2) : 0,
            taskCompletionRates: taskCompletionStats
          }
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Airdrop API error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
