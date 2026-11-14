const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ams_db';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);

    // Fold legacy technician accounts into the Support Team role.
    const User = require('../models/User');
    const migratedUsers = await User.updateMany(
      { role: 'Maintenance Technician' },
      { $set: { role: 'Support Team' } }
    );
    if (migratedUsers.modifiedCount > 0) {
      console.log(`[MongoDB] Migrated ${migratedUsers.modifiedCount} technician account(s) to Support Team`);
    }

    // Auto-seed initial demo accounts if database is fresh/empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB] Empty database detected. Auto-seeding initial users and assets...');
      const { seedData } = require('../utils/seeder');
      await seedData();
    }

  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error('[MongoDB] ⚠️  MongoDB server is not reachable on: ' + mongoUri);
    console.error('[MongoDB] 💡 Please start MongoDB locally (net start MongoDB or mongod) or provide a cloud MONGO_URI in backend/.env');

    // Auto-retry connection in background every 10s
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;
