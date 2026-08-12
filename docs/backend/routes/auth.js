const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Register user or ESP device account (with Auto-Login Token)
router.post('/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists. Please log in.' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      fullName: req.body.fullName || 'User',
      email: req.body.email,
      password: hashedPassword,
      deviceId: req.body.deviceId
    });

    await user.save();

    // 💡 Issue JWT Token on registration so new user is immediately logged in
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        deviceId: user.deviceId
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login user or ESP32 device
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    // Generate JWT (24h expiration)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        deviceId: user.deviceId
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Request Password Reset
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account with that email.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // Check if email credentials exist on server environment
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ EMAIL_USER or EMAIL_PASS environment variables are missing.');
      return res.status(500).json({ error: 'Server email configuration is missing.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `https://uglyboy77.github.io/AQ-GLD-G2/password-reset-ui/index.html?token=${token}`;

    await transporter.sendMail({
      to: user.email,
      from: `"AQ-GLD-G2 Systems" <${process.env.EMAIL_USER}>`,
      subject: 'Password Reset - AQ-GLD-G2',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4e7ec; padding: 24px; border-radius: 8px;">
          <h2 style="color: #2f6fed; margin-top:0;">Reset Your Password</h2>
          <p>Hello ${user.fullName || 'User'},</p>
          <p>We received a request to reset your password. Click the button below to set a new one:</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" 
               style="background-color: #2f6fed; color: #ffffff; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="font-size: 13px; color: #64748b;">This link will expire in <strong>15 minutes</strong>.</p>
          <p style="font-size: 13px; color: #64748b;">If you didn’t request this, you can safely ignore this email.</p>
          <hr style="margin-top:24px; border:none; border-top:1px solid #eee;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">© ${new Date().getFullYear()} AQ-GLD-G2 Engineering Systems</p>
        </div>
      `
    });

    res.json({ message: 'Password reset link sent to email.' });
  } catch (err) {
    console.error('Reset request error:', err);
    res.status(500).json({ error: err.message || 'Failed to send recovery email.' });
  }
});

// Reset Password confirmation
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('Reset confirm error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile (/me)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('fullName email deviceId');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get detailed profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('fullName email phoneNumber whatsappNumber deviceId');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const updates = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      whatsappNumber: req.body.whatsappNumber
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('fullName email phoneNumber whatsappNumber');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
