require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensor');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Optional static docs route
app.use('/docs', express.static(path.join(__dirname, '..')));

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Atlas connected successfully.');
    
    // Safely drop legacy 'username_1' unique index if it exists in MongoDB database
    try {
      await User.collection.dropIndex('username_1');
      console.log('[Database] Cleaned up legacy username_1 index.');
    } catch (e) {
      // Index didn't exist or already dropped, ignore safely
    }

    await seedDefaultAccounts();
  })
  .catch(err => console.error('MongoDB connection error:', err));

/**
 * Automatically seeds valid ESP32 and Dashboard User accounts into MongoDB if missing.
 */
async function seedDefaultAccounts() {
  try {
    // 1. ESP32 Device Account
    const espEmail = 'esp32@device.com';
    const espExists = await User.findOne({ email: espEmail });
    if (!espExists) {
      const hashedPassword = await bcrypt.hash('ESP32_Secure_Password_123!', 10);
      await User.create({
        fullName: 'ESP32 Sensor Unit',
        email: espEmail,
        username: espEmail,
        password: hashedPassword,
        deviceId: 'ESP32_AQ_GLD_G2'
      });
      console.log(`[Auto-Seed] Registered default ESP32 account: ${espEmail}`);
    }

    // 2. Demo User Dashboard Account
    const userEmail = 'user@example.com';
    const userExists = await User.findOne({ email: userEmail });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash('User123!', 10);
      await User.create({
        fullName: 'System Operator',
        email: userEmail,
        username: userEmail,
        password: hashedPassword,
        deviceId: 'ESP32_AQ_GLD_G2'
      });
      console.log(`[Auto-Seed] Registered default User account: ${userEmail}`);
    }
  } catch (err) {
    console.error('Error auto-seeding accounts:', err.message);
  }
}

// Route Mounts
app.use('/auth', authRoutes);
app.use('/sensor', authMiddleware, sensorRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- Auth endpoints: http://localhost:${PORT}/auth`);
  console.log(`- Sensor endpoints: http://localhost:${PORT}/sensor`);
});
