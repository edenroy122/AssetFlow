const mongoose = require('mongoose');

const assetAssignmentSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user reference is required']
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigning user reference is required']
    },
    assignmentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    expectedReturnDate: {
      type: Date
    },
    actualReturnDate: {
      type: Date,
      default: null
    },
    conditionAtAssignment: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
      default: 'Good'
    },
    conditionAtReturn: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged', null],
      default: null
    },
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Transferred'],
      default: 'Active'
    },
    // If transferred, store who received it or previous assignment id
    transferredTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    remarks: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const AssetAssignment = mongoose.model('AssetAssignment', assetAssignmentSchema);

module.exports = AssetAssignment;
