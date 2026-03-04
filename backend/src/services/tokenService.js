const pool = require('../config/database');

/**
 * Calculate ride tokens for both rider and pilot
 * Based on dual-role system specification
 */
const calculateRideTokens = async (riderId, pilotId, distanceMeters) => {
  try {
    // Base tokens (fixed per ride)
    const RIDER_BASE = 10;
    const PILOT_BASE = 15;

    let riderTokens = RIDER_BASE;
    let pilotTokens = PILOT_BASE;
    const bonuses = [];

    // Distance bonus (if > 10km)
    const distanceKm = distanceMeters / 1000;
    if (distanceKm > 10) {
      riderTokens += 5;
      pilotTokens += 5;
      bonuses.push({ type: 'distance', amount: 5, description: 'Long distance (>10km)' });
    }

    // Streak bonus (check last ride date)
    const riderStreak = await calculateStreakBonus(riderId);
    const pilotStreak = await calculateStreakBonus(pilotId);

    if (riderStreak.bonus > 0) {
      riderTokens += riderStreak.bonus;
      bonuses.push({ type: 'streak', amount: riderStreak.bonus, description: `${riderStreak.days}-day streak (rider)` });
    }

    if (pilotStreak.bonus > 0) {
      pilotTokens += pilotStreak.bonus;
      bonuses.push({ type: 'streak', amount: pilotStreak.bonus, description: `${pilotStreak.days}-day streak (pilot)` });
    }

    // Subscription multiplier (if active)
    // TODO: Check for active subscription
    // const hasSubscription = await checkSubscription(riderId);
    // if (hasSubscription) {
    //   riderTokens = Math.floor(riderTokens * 1.25);
    //   pilotTokens = Math.floor(pilotTokens * 1.25);
    // }

    return {
      riderTokens: Math.floor(riderTokens),
      pilotTokens: Math.floor(pilotTokens),
      bonuses,
    };
  } catch (error) {
    console.error('Calculate tokens error:', error);
    throw error;
  }
};

/**
 * Calculate streak bonus for a user
 */
const calculateStreakBonus = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT last_ride_date, streak_days FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { bonus: 0, days: 0 };
    }

    const { last_ride_date, streak_days } = result.rows[0];

    if (!last_ride_date) {
      // First ride
      await pool.query(
        `UPDATE users SET streak_days = 1 WHERE id = $1`,
        [userId]
      );
      return { bonus: 0, days: 0 };
    }

    const lastRide = new Date(last_ride_date);
    const today = new Date();
    const daysSince = Math.floor((today - lastRide) / (1000 * 60 * 60 * 24));

    let newStreak = streak_days || 0;
    let bonus = 0;

    if (daysSince === 1) {
      // Consecutive day
      newStreak += 1;
      
      if (newStreak >= 7) {
        bonus = 15;
      } else if (newStreak >= 5) {
        bonus = 10;
      } else if (newStreak >= 3) {
        bonus = 5;
      }

      await pool.query(
        `UPDATE users SET streak_days = $1 WHERE id = $2`,
        [newStreak, userId]
      );
    } else if (daysSince > 1) {
      // Streak broken
      newStreak = 1;
      await pool.query(
        `UPDATE users SET streak_days = 1 WHERE id = $1`,
        [userId]
      );
    }
    // If daysSince === 0 (same day), keep current streak

    return { bonus, days: newStreak };
  } catch (error) {
    console.error('Calculate streak error:', error);
    return { bonus: 0, days: 0 };
  }
};

/**
 * Award tokens to a user
 */
const awardTokens = async (userId, amount, type, category, source, rideId = null) => {
  try {
    await pool.query(
      `INSERT INTO tokens (user_id, amount, type, category, source, ride_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, amount, type, category, source, rideId]
    );

    await pool.query(
      `UPDATE users SET token_balance = token_balance + $1 WHERE id = $2`,
      [amount, userId]
    );

    return { success: true, amount };
  } catch (error) {
    console.error('Award tokens error:', error);
    throw error;
  }
};

/**
 * Redeem/spend tokens
 */
const redeemTokens = async (userId, amount, category, source) => {
  try {
    // Check balance
    const userResult = await pool.query(
      'SELECT token_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentBalance = userResult.rows[0].token_balance;

    if (currentBalance < amount) {
      throw new Error('Insufficient token balance');
    }

    // Deduct tokens
    await pool.query(
      `INSERT INTO tokens (user_id, amount, type, category, source, created_at)
       VALUES ($1, $2, 'spend', $3, $4, NOW())`,
      [userId, -amount, category, source]
    );

    await pool.query(
      `UPDATE users SET token_balance = token_balance - $1 WHERE id = $2`,
      [amount, userId]
    );

    return {
      success: true,
      newBalance: currentBalance - amount,
      amountSpent: amount,
    };
  } catch (error) {
    console.error('Redeem tokens error:', error);
    throw error;
  }
};

/**
 * Get token transaction history for a user
 */
const getTransactionHistory = async (userId, limit = 20, offset = 0) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tokens 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Get transaction history error:', error);
    throw error;
  }
};

module.exports = {
  calculateRideTokens,
  calculateStreakBonus,
  awardTokens,
  redeemTokens,
  getTransactionHistory,
};
