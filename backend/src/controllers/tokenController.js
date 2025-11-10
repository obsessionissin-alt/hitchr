const pool = require('../config/database');

// Get user's token balance and transaction history
exports.getMyTokens = async (req, res) => {
  try {
    const userId = req.user.id; // Fixed: use req.user.id not req.user.userId

    // Get balance
    const balanceResult = await pool.query(
      'SELECT token_balance FROM users WHERE id = $1',
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const balance = parseInt(balanceResult.rows[0].token_balance) || 0;

    // Get transaction history
    const transactionsResult = await pool.query(
      `SELECT 
        id, amount, type, category, source, ride_id, metadata, created_at
       FROM tokens 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId]
    );

    res.json({
      success: true,
      balance: balance,
      transactions: transactionsResult.rows.map(tx => ({
        id: tx.id,
        amount: parseInt(tx.amount),
        type: tx.type,
        category: tx.category,
        source: tx.source,
        rideId: tx.ride_id,
        metadata: tx.metadata,
        createdAt: tx.created_at,
      })),
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch token information',
    });
  }
};  