const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetName: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true
    },
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Laptop',
        'Desktop',
        'Monitor',
        'Mobile Device',
        'Server',
        'Networking',
        'Printer/Peripheral',
        'Office Furniture',
        'Other'
      ],
      default: 'Laptop'
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true
    },
    specifications: {
      type: String,
      trim: true,
      default: ''
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    // purchaseCost: {
    //   type: Number,
    //   required: [true, 'Purchase cost is required'],
    //   min: [0, 'Purchase cost cannot be negative']
    // },
    // vendor: {
    //   type: String,
    //   trim: true,
    //   default: 'Official Vendor'
    // },
    warrantyStartDate: {
      type: Date
    },
    warrantyEndDate: {
      type: Date
    },
    // location: {
    //   type: String,
    //   required: [true, 'Location is required'],
    //   trim: true,
    //   default: 'Headquarters'
    // },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
      default: 'Good'
    },
    status: {
      type: String,
      enum: [
        'Available',
        'Assigned',
        'Under Maintenance',
        'Damaged',
        'Retired',
        'Lost'
      ],
      default: 'Available'
    },
    // Reference to current active assignment (if status === 'Assigned')
    currentAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetAssignment',
      default: null
    },
    // Reference to currently assigned employee directly for fast lookups
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
