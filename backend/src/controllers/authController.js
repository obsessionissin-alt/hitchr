// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { client: redis } = require('../config/redis');

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    // Format phone number (ensure +91 prefix)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // Generate OTP
    const otp = process.env.NODE_ENV === 'production' 
      ? generateOTP() 
      : '123456'; // Always 123456 in development

    // Store OTP in Redis with 5 minute expiry
    const otpKey = `otp:${formattedPhone}`;
    await redis.set(otpKey, otp, 'EX', 300); // 5 minutes

    // In development, log OTP
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📱 OTP for ${formattedPhone}: ${otp}`);
    }

    // TODO: In production, send actual SMS here
    // await sendSMS(formattedPhone, `Your HITCH OTP is: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // In development only, return OTP
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP and login/register user
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // Get OTP from Redis
    const otpKey = `otp:${formattedPhone}`;
    const storedOTP = await redis.get(otpKey);

    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    if (storedOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // OTP is valid - delete it
    await redis.del(otpKey);

    // Check if user exists
    let userResult = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [formattedPhone]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const insertResult = await pool.query(
        `INSERT INTO users (
          phone, name, role, 
          token_balance, total_rides, total_km, rating, rating_count,
          is_available, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [
          formattedPhone,
          formattedPhone, // Default name is phone
          'rider', // Default role
          0, // Initial token balance
          0, // Initial rides
          0, // Initial km
          0, // Initial rating
          0, // Initial rating count
          false, // Not available by default
        ]
      );
      user = insertResult.rows[0];
      console.log(`✅ New user created: ${formattedPhone}`);
    } else {
      user = userResult.rows[0];
      console.log(`✅ Existing user logged in: ${formattedPhone}`);
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return user data and tokens
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token_balance: user.token_balance,
        total_rides: user.total_rides,
        rating: parseFloat(user.rating) || 0,
        total_km: parseFloat(user.total_km) || 0,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token_balance: user.token_balance,
      total_rides: user.total_rides,
      rating: parseFloat(user.rating) || 0,
      total_km: parseFloat(user.total_km) || 0,
      avatar_url: user.avatar_url,
      kyc_status: user.kyc_status,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Get user
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

console.log('✅ AuthController loaded (Backend OTP mode)');