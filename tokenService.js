const db = require('../config/database');

const TOKENS_PER_KM = parseInt(process.env.TOKENS_PER_KM) || 10;

const awardTokens = async (riderId, pilotId, distanceMeters, rideId) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    const distanceKm = distanceMeters / 1000;
    const baseTokens = Math.round(distanceKm * TOKENS_PER_KM);
    
    const riderTokens = Math.round(baseTokens * 0.6);
    const pilotTokens = Math.round(baseTokens * 0.4);

    await client.query(
      `INSERT INTO tokens (user_id, amount, type, category, source, ride_id)
       VALUES ($1, $2, 'earn', 'ride', 'ride_completion', $3)`,
      [riderId, riderTokens, rideId]
    );

    await client.query(
      `UPDATE users SET token_balance = token_balance + $1 WHERE id = $2`,
      [riderTokens, riderId]
    );

    await client.query(
      `INSERT INTO tokens (user_id, amount, type, category, source, ride_id)
       VALUES ($1, $2, 'earn', 'ride', 'ride_completion', $3)`,
      [pilotId, pilotTokens, rideId]
    );

    await client.query(
      `UPDATE users SET token_balance = token_balance + $1 WHERE id = $2`,
      [pilotTokens, pilotId]
    );

    const streakResult = await client.query(
      `SELECT COUNT(*) as streak
       FROM rides
       WHERE rider_id = $1 
         AND status = 'completed'
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      [riderId]
    );

    const streak = parseInt(streakResult.rows[0].streak);
    let bonusTokens = 0;

    if (streak === 3) {
      bonusTokens = parseInt(process.env.BONUS_TOKENS_STREAK_3) || 50;
    } else if (streak === 7) {
      bonusTokens = parseInt(process.env.BONUS_TOKENS_STREAK_7) || 150;
    } else if (streak === 30) {
      bonusTokens = parseInt(process.env.BONUS_TOKENS_STREAK_30) || 500;
    }

    if (bonusTokens > 0) {
      await client.query(
        `INSERT INTO tokens (user_id, amount, type, category, source, ride_id)
         VALUES ($1, $2, 'earn', 'streak', $3, $4)`,
        [riderId, bonusTokens, `${streak}_ride_streak`, rideId]
      );

      await client.query(
        `UPDATE users SET token_balance = token_balance + $1 WHERE id = $2`,
        [bonusTokens, riderId]
      );
    }

    await client.query('COMMIT');

    return {
      total: riderTokens + pilotTokens + bonusTokens,
      rider: riderTokens + bonusTokens,
      pilot: pilotTokens,
      bonus: bonusTokens,
      streak,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const redeemTokens = async (userId, amount, category, source) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT token_balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentBalance = userResult.rows[0].token_balance;

    if (currentBalance < amount) {
      throw new Error('Insufficient token balance');
    }

    await client.query(
      `INSERT INTO tokens (user_id, amount, type, category, source)
       VALUES ($1, $2, 'spend', $3, $4)`,
      [userId, -amount, category, source]
    );

    await client.query(
      `UPDATE users SET token_balance = token_balance - $1 WHERE id = $2`,
      [amount, userId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      newBalance: currentBalance - amount,
      amountSpent: amount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  awardTokens,
  redeemTokens,
};

