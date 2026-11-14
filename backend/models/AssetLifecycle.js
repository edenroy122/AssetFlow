const mongoose = require('mongoose');

const assetLifecycleSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'Asset Registered',
        'Asset Updated',
        'Asset Assigned',
        'Asset Transferred',
        'Asset Returned',
        'Asset Sent for Repair',
        'Repair In Progress',
        'Asset Repaired',
        'Asset Marked Unrepairable',
        'Asset Retired',
        'Status Changed'
      ]
    },
    previousStatus: {
      type: String,
      default: 'None'
    },
    newStatus: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const AssetLifecycle = mongoose.model('AssetLifecycle', assetLifecycleSchema);

module.exports = AssetLifecycle;
