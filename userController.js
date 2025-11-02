const pool = require('../config/database');

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar_url || user.avatar,
        kycStatus: user.kyc_status,
        tokensBalance: parseInt(user.token_balance) || 0,
        stats: {
          totalRides: parseInt(user.total_rides) || 0,
          completedRides: parseInt(user.completed_rides) || 0,
          totalKm: parseFloat(user.total_km) || 0,
          rating: parseFloat(user.rating) || 5.0,
          trustScore: parseFloat(user.trust_score) || 5.0,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get current user (same as in authController)
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar_url || user.avatar,
        kycStatus: user.kyc_status,
        tokensBalance: parseInt(user.token_balance) || 0,
        stats: {
          totalRides: parseInt(user.total_rides) || 0,
          completedRides: parseInt(user.completed_rides) || 0,
          totalKm: parseFloat(user.total_km) || 0,
          rating: parseFloat(user.rating) || 5.0,
          trustScore: parseFloat(user.trust_score) || 5.0,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, role, avatar } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (role) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (avatar) {
      updates.push(`avatar = $${paramCount}`);
      values.push(avatar);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const user = result.rows[0];
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar_url || user.avatar,
        kycStatus: user.kyc_status,
        tokensBalance: parseInt(user.token_balance) || 0,
        stats: {
          totalRides: parseInt(user.total_rides) || 0,
          completedRides: parseInt(user.completed_rides) || 0,
          totalKm: parseFloat(user.total_km) || 0,
          rating: parseFloat(user.rating) || 5.0,
          trustScore: parseFloat(user.trust_score) || 5.0,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};