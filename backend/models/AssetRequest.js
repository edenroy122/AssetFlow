const mongoose = require('mongoose');

const assetRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting employee reference is required']
    },
    requestType: {
      type: String,
      required: [true, 'Request type is required'],
      enum: {
        values: ['New Asset', 'Replacement', 'Repair', 'Return'],
        message: '{VALUE} is not a valid request type'
      }
    },
    // Required for 'New Asset'
    requestedAssetName: {
      type: String,
      trim: true
    },
    // Specifications desired (e.g. Intel i7, 16GB RAM)
    specifications: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      required: [true, 'Reason for request is required'],
      trim: true
    },
    // Reference to assigned asset (mandatory for Replacement, Repair, Return)
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Processing', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewComment: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    // For Replacement / New Asset: pointer to newly assigned asset once fulfilled
    allocatedAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null
    },
    // Individual Support Team member assigned by Asset Manager
    assignedSupport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Support Team member who performed the physical handover & allocation
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    handoverDate: {
      type: Date,
      default: null
    },
    handoverRemarks: {
      type: String,
      trim: true,
      default: ''
    },
    handoverCondition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged'],
      default: 'Good'
    },
    supportMessages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      stage: {
        type: String,
        enum: ['bring_asset', 'ready_for_collection', 'general'],
        default: 'general'
      },
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Validate conditional requirements before saving
assetRequestSchema.pre('validate', function (next) {
  if (this.requestType === 'New Asset') {
    if (!this.requestedAssetName) {
      this.invalidate('requestedAssetName', 'Requested asset name is required for New Asset requests');
    }
  } else {
    // Replacement, Repair, Return require an existing asset reference
    if (!this.asset) {
      this.invalidate('asset', `An assigned asset reference is required for ${this.requestType} requests`);
    }
  }
  next();
});

const AssetRequest = mongoose.model('AssetRequest', assetRequestSchema);

module.exports = AssetRequest;
