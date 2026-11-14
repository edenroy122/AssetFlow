const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const initialAdmin = {
  firstName: 'System',
  lastName: 'Admin',
  email: process.env.INITIAL_ADMIN_EMAIL || 'admin@assetflow.com',
  password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123',
  employeeId: 'MISTRAL-ADM001',
  role: 'Admin',
  designation: null,
  location: 'Domlur',
  phoneNumber: '+1-555-0101',
  status: 'Active'
};

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ams_db';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }

    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log(`[Seeder] Administrator already exists: ${existingAdmin.email}`);
      return existingAdmin;
    }

    const admin = await User.create(initialAdmin);
    console.log(`[Seeder] Created initial administrator: ${admin.email}`);
    return admin;
  } catch (error) {
    console.error(`[Seeder] Error creating initial administrator: ${error.message}`);
    if (require.main === module) {
      process.exitCode = 1;
      return null;
    }
    throw error;
  } finally {
    if (require.main === module && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData };
