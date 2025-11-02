// backend/src/routes/tokens.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');

// All token routes require authentication
router.use(authMiddleware);

// Get user's token balance and transactions
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current balance
    const userResult = await pool.query(
      'SELECT token_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent transactions
    const transactionsResult = await pool.query(
      `SELECT id, amount, type, category, source, created_at
       FROM token_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      balance: userResult.rows[0].token_balance,
      transactions: transactionsResult.rows,
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get token information' });
  }
});

// Get transaction history with filters
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT id, amount, type, category, source, created_at
      FROM token_transactions
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    // Add filters
    if (type && ['earn', 'spend'].includes(type)) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      transactions: result.rows,
      count: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Award tokens (internal use - can be called by ride completion)
router.post('/award', async (req, res) => {
  try {
    const { userId, amount, category, source } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user balance
      await client.query(
        'UPDATE users SET token_balance = token_balance + $1 WHERE id = $2',
        [amount, userId]
      );

      // Record transaction
      const txResult = await client.query(
        `INSERT INTO token_transactions (user_id, amount, type, category, source, created_at)
         VALUES ($1, $2, 'earn', $3, $4, NOW())
         RETURNING *`,
        [userId, amount, category || 'ride', source || 'system']
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        transaction: txResult.rows[0],
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Award tokens error:', error);
    res.status(500).json({ error: 'Failed to award tokens' });
  }
});

// Spend tokens (for redemptions)
router.post('/spend', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, category, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check balance
      const userResult = await client.query(
        'SELECT token_balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentBalance = userResult.rows[0].token_balance;

      if (currentBalance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Insufficient balance',
          required: amount,
          available: currentBalance,
        });
      }

      // Deduct tokens
      await client.query(
        'UPDATE users SET token_balance = token_balance - $1 WHERE id = $2',
        [amount, userId]
      );

      // Record transaction
      const txResult = await client.query(
        `INSERT INTO token_transactions (user_id, amount, type, category, source, created_at)
         VALUES ($1, $2, 'spend', $3, $4, NOW())
         RETURNING *`,
        [userId, amount, category || 'redemption', description || 'Token redemption']
      );

      await client.query('COMMIT');

      // Get new balance
      const newBalanceResult = await pool.query(
        'SELECT token_balance FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        transaction: txResult.rows[0],
        new_balance: newBalanceResult.rows[0].token_balance,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Spend tokens error:', error);
    res.status(500).json({ error: 'Failed to spend tokens' });
  }
});

module.exports = router;