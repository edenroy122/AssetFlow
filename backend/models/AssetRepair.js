const mongoose = require('mongoose');

const assetRepairSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetRequest',
      default: null
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    repairDescription: {
      type: String,
      required: [true, 'Repair description is required'],
      trim: true
    },
    inspectionDetails: {
      type: String,
      trim: true,
      default: ''
    },
    repairCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    },
    sparePartsUsed: {
      type: String,
      trim: true,
      default: ''
    },
    repairStartDate: {
      type: Date,
      default: null
    },
    repairEndDate: {
      type: Date,
      default: null
    },
    repairStatus: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Unrepairable'],
      default: 'Pending'
    },
    // Workflow C rule: preserve employee's assignment relationship if assigned before repair
    assignedEmployeePriorToRepair: {
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

const AssetRepair = mongoose.model('AssetRepair', assetRepairSchema);

module.exports = AssetRepair;
