const Asset = require('../models/Asset');
const AssetAssignment = require('../models/AssetAssignment');
const AssetRequest = require('../models/AssetRequest');
const User = require('../models/User');
const { logAudit, recordLifecycle, createNotification } = require('../utils/logger');

// @desc    Assign an available asset to an employee
// @route   POST /api/assignments
// @access  Private (Admin, Asset Manager)
const assignAsset = async (req, res, next) => {
  try {
    const {
      assetId,
      employeeId,
      expectedReturnDate,
      conditionAtAssignment = 'Good',
      remarks = '',
      requestId // optional: if fulfilling an existing AssetRequest
    } = req.body;

    if (!assetId || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both assetId and employeeId'
      });
    }

    // 1. Verify Asset availability
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Asset cannot be assigned because its current status is '${asset.status}'. Only 'Available' assets can be assigned.`
      });
    }

    // 2. Verify Employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    if (employee.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign asset to employee with status '${employee.status}'.`
      });
    }

    // 3. Create AssetAssignment record
    const assignment = await AssetAssignment.create({
      asset: asset._id,
      assignedTo: employee._id,
      assignedBy: req.user._id,
      assignmentDate: new Date(),
      expectedReturnDate: expectedReturnDate || null,
      conditionAtAssignment,
      status: 'Active',
      remarks
    });

    // 4. Update Asset status to 'Assigned'
    const previousStatus = asset.status;
    asset.status = 'Assigned';
    asset.assignedTo = employee._id;
    asset.currentAssignment = assignment._id;
    asset.condition = conditionAtAssignment;
    await asset.save();

    // 5. If fulfilling an AssetRequest, mark it Completed
    if (requestId) {
      const request = await AssetRequest.findById(requestId);
      if (request) {
        request.status = 'Completed';
        request.allocatedAsset = asset._id;
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();
      }
    }

    // 6. Record Lifecycle
    await recordLifecycle({
      asset: asset._id,
      action: 'Asset Assigned',
      previousStatus,
      newStatus: 'Assigned',
      performedBy: req.user._id,
      referenceId: assignment._id,
      remarks: `Assigned to ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
    });

    // 7. Send notification to Employee
    await createNotification({
      recipient: employee._id,
      title: 'New Asset Assigned',
      message: `You have been assigned ${asset.assetName} [Tag: ${asset.assetTag}].`,
      type: 'success',
      link: '/employee/my-assets'
    });

    // 8. Record Audit Log
    await logAudit({
      action: 'Asset Assigned',
      performedBy: req.user._id,
      recordId: assignment._id,
      collectionName: 'AssetAssignment',
      details: `Assigned asset ${asset.assetTag} to ${employee.employeeId}`,
      req
    });

    res.status(201).json({
      success: true,
      message: `Asset '${asset.assetName}' assigned to ${employee.firstName} ${employee.lastName} successfully.`,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process asset return
// @route   POST /api/assignments/:id/return
// @access  Private (Admin, Asset Manager)
const returnAsset = async (req, res, next) => {
  try {
    const {
      conditionAtReturn = 'Good',
      finalStatus = 'Available', // Available, Under Maintenance, Damaged, Retired
      remarks = '',
      requestId
    } = req.body;

    const assignment = await AssetAssignment.findById(req.params.id)
      .populate('asset')
      .populate('assignedTo');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment record not found'
      });
    }

    if (assignment.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is already closed or returned'
      });
    }

    const asset = await Asset.findById(assignment.asset._id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Associated asset not found'
      });
    }

    // 1. Close Assignment record
    assignment.status = 'Returned';
    assignment.actualReturnDate = new Date();
    assignment.conditionAtReturn = conditionAtReturn;
    assignment.remarks = remarks
      ? `${assignment.remarks ? assignment.remarks + ' | ' : ''}Return note: ${remarks}`
      : assignment.remarks;
    await assignment.save();

    // 2. Update Asset
    const previousStatus = asset.status;
    asset.status = finalStatus;
    asset.condition = conditionAtReturn;
    asset.assignedTo = null;
    asset.currentAssignment = null;
    await asset.save();

    // 3. Complete associated return request if provided
    if (requestId) {
      const request = await AssetRequest.findById(requestId);
      if (request) {
        request.status = 'Completed';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();
      }
    }

    // 4. Record Lifecycle
    await recordLifecycle({
      asset: asset._id,
      action: 'Asset Returned',
      previousStatus,
      newStatus: finalStatus,
      performedBy: req.user._id,
      referenceId: assignment._id,
      remarks: `Returned by ${assignment.assignedTo.firstName} ${assignment.assignedTo.lastName}. Condition: ${conditionAtReturn}. New status: ${finalStatus}.`
    });

    // 5. Notify Employee
    await createNotification({
      recipient: assignment.assignedTo._id,
      title: 'Asset Return Processed',
      message: `Your return of asset ${asset.assetName} [Tag: ${asset.assetTag}] has been successfully processed.`,
      type: 'info',
      link: '/employee/history'
    });

    // 6. Record Audit Log
    await logAudit({
      action: 'Asset Returned',
      performedBy: req.user._id,
      recordId: assignment._id,
      collectionName: 'AssetAssignment',
      details: `Returned asset ${asset.assetTag} from ${assignment.assignedTo.employeeId}`,
      req
    });

    res.status(200).json({
      success: true,
      message: `Asset return processed successfully. New status: ${finalStatus}.`,
      assignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer asset to another employee
// @route   POST /api/assignments/:id/transfer
// @access  Private (Admin, Asset Manager)
const transferAsset = async (req, res, next) => {
  try {
    const {
      newEmployeeId,
      newLocation,
      remarks = ''
    } = req.body;

    if (!newEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide newEmployeeId'
      });
    }

    const currentAssignment = await AssetAssignment.findById(req.params.id)
      .populate('asset')
      .populate('assignedTo');

    if (!currentAssignment || currentAssignment.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Active assignment record not found for transfer'
      });
    }

    const newEmployee = await User.findById(newEmployeeId);
    if (!newEmployee || newEmployee.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Recipient employee is invalid or inactive'
      });
    }

    if (String(currentAssignment.assignedTo._id) === String(newEmployee._id)) {
      return res.status(400).json({
        success: false,
        message: 'Asset is already assigned to this employee'
      });
    }

    const asset = await Asset.findById(currentAssignment.asset._id);

    // 1. Close current assignment
    currentAssignment.status = 'Transferred';
    currentAssignment.actualReturnDate = new Date();
    currentAssignment.transferredTo = newEmployee._id;
    await currentAssignment.save();

    // 2. Create new assignment for recipient
    const newAssignment = await AssetAssignment.create({
      asset: asset._id,
      assignedTo: newEmployee._id,
      assignedBy: req.user._id,
      assignmentDate: new Date(),
      conditionAtAssignment: asset.condition,
      status: 'Active',
      remarks: `Transferred from ${currentAssignment.assignedTo.firstName} ${currentAssignment.assignedTo.lastName}. ${remarks}`
    });

    // 3. Update asset
    asset.assignedTo = newEmployee._id;
    asset.currentAssignment = newAssignment._id;
    if (newLocation) {
      asset.location = newLocation;
    }
    await asset.save();

    // 4. Record Lifecycle
    await recordLifecycle({
      asset: asset._id,
      action: 'Asset Transferred',
      previousStatus: 'Assigned',
      newStatus: 'Assigned',
      performedBy: req.user._id,
      referenceId: newAssignment._id,
      remarks: `Transferred from ${currentAssignment.assignedTo.employeeId} to ${newEmployee.employeeId}`
    });

    // 5. Notify both users
    await createNotification({
      recipient: currentAssignment.assignedTo._id,
      title: 'Asset Transferred',
      message: `Your assignment for ${asset.assetName} [Tag: ${asset.assetTag}] has been transferred to ${newEmployee.firstName} ${newEmployee.lastName}.`,
      type: 'info'
    });

    await createNotification({
      recipient: newEmployee._id,
      title: 'Asset Transferred to You',
      message: `Asset ${asset.assetName} [Tag: ${asset.assetTag}] has been transferred to you.`,
      type: 'success',
      link: '/employee/my-assets'
    });

    // 6. Audit Log
    await logAudit({
      action: 'Asset Transferred',
      performedBy: req.user._id,
      recordId: newAssignment._id,
      collectionName: 'AssetAssignment',
      details: `Transferred asset ${asset.assetTag} from ${currentAssignment.assignedTo.employeeId} to ${newEmployee.employeeId}`,
      req
    });

    res.status(200).json({
      success: true,
      message: `Asset transferred to ${newEmployee.firstName} ${newEmployee.lastName} successfully.`,
      newAssignment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assignment history
// @route   GET /api/assignments
// @access  Private (Admin, Asset Manager)
const getAssignments = async (req, res, next) => {
  try {
    const { status, assetId, employeeId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && status !== 'All') query.status = status;
    if (assetId) query.asset = assetId;
    if (employeeId) query.assignedTo = employeeId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AssetAssignment.countDocuments(query);
    const assignments = await AssetAssignment.find(query)
      .populate('asset', 'assetName assetTag model serialNumber category condition location status')
      .populate('assignedTo', 'firstName lastName email employeeId designation location')
      .populate('assignedBy', 'firstName lastName')
      .populate('transferredTo', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: assignments.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently assigned assets for logged-in employee
// @route   GET /api/assignments/my-assets
// @access  Private (Employee)
const getMyAssignedAssets = async (req, res, next) => {
  try {
    const assignments = await AssetAssignment.find({
      assignedTo: req.user._id,
      status: 'Active'
    })
      .populate('asset')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personal asset history for logged-in employee
// @route   GET /api/assignments/my-history
// @access  Private (Employee)
const getMyAssetHistory = async (req, res, next) => {
  try {
    const assignments = await AssetAssignment.find({
      assignedTo: req.user._id
    })
      .populate('asset')
      .populate('transferredTo', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignAsset,
  returnAsset,
  transferAsset,
  getAssignments,
  getMyAssignedAssets,
  getMyAssetHistory
};
