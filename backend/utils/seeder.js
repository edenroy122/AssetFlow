const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Asset = require('../models/Asset');
const AssetAssignment = require('../models/AssetAssignment');
const AssetRequest = require('../models/AssetRequest');
const AssetRepair = require('../models/AssetRepair');
const AssetLifecycle = require('../models/AssetLifecycle');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

dotenv.config();

const users = [
  {
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@assetflow.com',
    password: 'Admin@123',
    employeeId: 'MISTRAL-ADM001',
    role: 'Admin',
    designation: null,
    location: 'Domlur',
    phoneNumber: '+1-555-0101',
    status: 'Active'
  },
  
];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ams_db';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB');

    // 1. Seed Users
    const seededUsers = {};
    for (const userData of users) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create(userData);
        console.log(`[Seeder] Seeded user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`[Seeder] User already exists: ${userData.email}`);
      }
      seededUsers[user.role] = user;
    }

    // 2. Seed Assets
    const adminUser = seededUsers['Admin'];
    const empUser = seededUsers['Employee'];
    const mgrUser = seededUsers['Asset Manager'];
    const techUser = seededUsers['Support Team'];

    for (const assetData of sampleAssets) {
      let asset = await Asset.findOne({ assetTag: assetData.assetTag });
      if (!asset) {
        asset = await Asset.create({
          ...assetData,
          createdBy: adminUser._id
        });

        await AssetLifecycle.create({
          asset: asset._id,
          action: 'Asset Registered',
          previousStatus: 'None',
          newStatus: 'Available',
          performedBy: adminUser._id,
          remarks: `Initial seed registration of ${asset.assetName}`
        });

        console.log(`[Seeder] Seeded asset: ${asset.assetName} [${asset.assetTag}]`);
      }
    }

    // 3. Create 1 sample active assignment for demo employee
    const laptopAsset = await Asset.findOne({ assetTag: 'AST-2026-MBP01' });
    if (laptopAsset && laptopAsset.status === 'Available') {
      const assignment = await AssetAssignment.create({
        asset: laptopAsset._id,
        assignedTo: empUser._id,
        assignedBy: mgrUser._id,
        assignmentDate: new Date(),
        conditionAtAssignment: 'New',
        status: 'Active',
        remarks: 'Assigned for enterprise software development'
      });

      laptopAsset.status = 'Assigned';
      laptopAsset.assignedTo = empUser._id;
      laptopAsset.currentAssignment = assignment._id;
      await laptopAsset.save();

      await AssetLifecycle.create({
        asset: laptopAsset._id,
        action: 'Asset Assigned',
        previousStatus: 'Available',
        newStatus: 'Assigned',
        performedBy: mgrUser._id,
        referenceId: assignment._id,
        remarks: `Assigned to ${empUser.firstName} ${empUser.lastName} (${empUser.employeeId})`
      });

      await Notification.create({
        recipient: empUser._id,
        title: 'New Asset Assigned',
        message: `You have been assigned ${laptopAsset.assetName} [Tag: ${laptopAsset.assetTag}].`,
        type: 'success',
        link: '/employee/my-assets'
      });

      console.log(`[Seeder] Created active assignment for ${empUser.employeeId}`);
    }

    // 4. Create 1 sample pending request
    const existingReq = await AssetRequest.findOne({ requestedBy: empUser._id });
    if (!existingReq) {
      await AssetRequest.create({
        requestedBy: empUser._id,
        requestType: 'New Asset',
        requestedAssetName: 'Wireless Ergonomic Keyboard',
        specifications: 'Logitech MX Keys or equivalent with ergonomic wrist rest',
        reason: 'Required for prolonged office typing and ergonomics',
        status: 'Pending'
      });
      console.log('[Seeder] Created sample pending request');
    }

    // 5. Initial Audit Log
    await AuditLog.create({
      action: 'System Initialized',
      performedBy: adminUser._id,
      collectionName: 'System',
      details: 'Enterprise AMS database seeded successfully'
    });

    console.log('[Seeder] Full system seeding completed successfully!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[Seeder] Error seeding data: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData, demoUsers: users };
