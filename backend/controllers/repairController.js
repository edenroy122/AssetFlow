const AssetRepair = require('../models/AssetRepair');
const Asset = require('../models/Asset');
const AssetRequest = require('../models/AssetRequest');
const User = require('../models/User');
const { logAudit, recordLifecycle, createNotification } = require('../utils/logger');

// @desc    Create a work order / repair record
// @route   POST /api/repairs
// @access  Private (Admin, Asset Manager)
const createWorkOrder = async (req, res, next) => {
  try {
    const {
      assetId,
      assignedTechnicianId,
      repairDescription,
      requestId,
      remarks = ''
    } = req.body;

    if (!assetId || !repairDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assetId and repairDescription'
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status === 'Retired' || asset.status === 'Lost') {
      return res.status(400).json({
        success: false,
        message: `Cannot create repair order for asset with status '${asset.status}'.`
      });
    }

    let technician = null;
    if (assignedTechnicianId) {
      technician = await User.findById(assignedTechnicianId);
      if (!technician || technician.role !== 'Support Team') {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not a Support Team member'
        });
      }
    }

    // Workflow C rule: preserve assigned employee relationship
    const priorEmployee = asset.assignedTo || null;
    const previousStatus = asset.status;

    // Create Repair Record
    const repair = await AssetRepair.create({
      asset: asset._id,
      request: requestId || null,
      reportedBy: req.user._id,
      assignedTechnician: technician ? technician._id : null,
      repairDescription,
      repairStatus: technician ? 'Assigned' : 'Pending',
      assignedEmployeePriorToRepair: priorEmployee,
      remarks
    });

    // Update asset status to 'Under Maintenance'
    asset.status = 'Under Maintenance';
    await asset.save();

    // If linked to an AssetRequest, mark it 'Processing'
    if (requestId) {
      const request = await AssetRequest.findById(requestId);
      if (request) {
        request.status = 'Processing';
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();
      }
    }

    // Record lifecycle
    await recordLifecycle({
      asset: asset._id,
      action: 'Asset Sent for Repair',
      previousStatus,
      newStatus: 'Under Maintenance',
      performedBy: req.user._id,
      referenceId: repair._id,
      remarks: `Work order created: ${repairDescription}`
    });

    // Notify technician if assigned
    if (technician) {
      await createNotification({
        recipient: technician._id,
        title: 'New Work Order Assigned',
        message: `You have been assigned to repair ${asset.assetName} [Tag: ${asset.assetTag}].`,
        type: 'info',
        link: '/support/work-orders'
      });
    }

    // Audit log
    await logAudit({
      action: 'Repair Work Order Created',
      performedBy: req.user._id,
      recordId: repair._id,
      collectionName: 'AssetRepair',
      details: `Created repair order for asset ${asset.assetTag}`,
      req
    });

    res.status(201).json({
      success: true,
      message: 'Repair work order created successfully.',
      repair
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all repair orders (Admin, Asset Manager)
// @route   GET /api/repairs
// @access  Private (Admin, Asset Manager)
const getAllRepairs = async (req, res, next) => {
  try {
    const { status, technicianId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && status !== 'All') query.repairStatus = status;
    if (technicianId) query.assignedTechnician = technicianId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AssetRepair.countDocuments(query);
    const repairs = await AssetRepair.find(query)
      .populate('asset', 'assetName assetTag serialNumber model brand location condition status')
      .populate('assignedTechnician', 'firstName lastName email employeeId')
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedEmployeePriorToRepair', 'firstName lastName email employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: repairs.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      repairs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get work orders assigned to logged-in technician
// @route   GET /api/repairs/my-work-orders
// @access  Private (Support Team)
const getTechnicianWorkOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { assignedTechnician: req.user._id };

    if (status && status !== 'All') {
      query.repairStatus = status;
    }

    const workOrders = await AssetRepair.find(query)
      .populate('asset', 'assetName assetTag serialNumber model brand location condition status')
      .populate('reportedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workOrders.length,
      workOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Technician updates repair inspection, parts, costs and completion
// @route   PUT /api/repairs/:id/progress
// @access  Private (Support Team, Admin, Asset Manager)
const updateRepairProgress = async (req, res, next) => {
  try {
    const {
      inspectionDetails,
      sparePartsUsed,
      repairCost,
      repairStatus, // In Progress, Completed, Unrepairable
      remarks = ''
    } = req.body;

    const repair = await AssetRepair.findById(req.params.id)
      .populate('asset')
      .populate('assignedEmployeePriorToRepair');

    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair record not found'
      });
    }

    // Verify technician / support authorization
    if (
      req.user.role === 'Support Team' &&
      repair.assignedTechnician &&
      String(repair.assignedTechnician) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only update work orders assigned to you.'
      });
    }

    const asset = await Asset.findById(repair.asset._id);

    if (inspectionDetails !== undefined) repair.inspectionDetails = inspectionDetails;
    if (sparePartsUsed !== undefined) repair.sparePartsUsed = sparePartsUsed;
    if (repairCost !== undefined) repair.repairCost = Number(repairCost);
    if (remarks) repair.remarks = remarks;

    // Manage status transition
    if (repairStatus) {
      repair.repairStatus = repairStatus;

      if (repairStatus === 'In Progress' && !repair.repairStartDate) {
        repair.repairStartDate = new Date();
        await recordLifecycle({
          asset: asset._id,
          action: 'Repair In Progress',
          previousStatus: asset.status,
          newStatus: asset.status,
          performedBy: req.user._id,
          referenceId: repair._id,
          remarks: `Inspection started by ${req.user.firstName}. Notes: ${inspectionDetails || 'In progress'}`
        });
      }

      if (repairStatus === 'Completed') {
        repair.repairEndDate = new Date();

        // Workflow C Rule: If asset was assigned before repair, preserve assignment!
        let finalAssetStatus = 'Available';
        if (repair.assignedEmployeePriorToRepair) {
          finalAssetStatus = 'Assigned';
          asset.assignedTo = repair.assignedEmployeePriorToRepair._id;
        } else {
          asset.assignedTo = null;
        }

        asset.status = finalAssetStatus;
        asset.condition = 'Good';
        await asset.save();

        // If linked to an AssetRequest, mark it Completed
        if (repair.request) {
          await AssetRequest.findByIdAndUpdate(repair.request, {
            status: 'Completed',
            reviewedBy: req.user._id,
            reviewedAt: new Date()
          });
        }

        await recordLifecycle({
          asset: asset._id,
          action: 'Asset Repaired',
          previousStatus: 'Under Maintenance',
          newStatus: finalAssetStatus,
          performedBy: req.user._id,
          referenceId: repair._id,
          remarks: `Repair completed. Cost: $${repair.repairCost}. Parts: ${repair.sparePartsUsed || 'None'}`
        });

        // Notify employee if assigned
        if (repair.assignedEmployeePriorToRepair) {
          await createNotification({
            recipient: repair.assignedEmployeePriorToRepair._id,
            title: 'Asset Repair Completed',
            message: `Repair on your assigned asset ${asset.assetName} [Tag: ${asset.assetTag}] is finished and ready for use.`,
            type: 'success',
            link: '/employee/my-assets'
          });
        }
      }

      if (repairStatus === 'Unrepairable') {
        repair.repairEndDate = new Date();
        asset.status = 'Damaged';
        asset.condition = 'Damaged';
        await asset.save();

        await recordLifecycle({
          asset: asset._id,
          action: 'Asset Marked Unrepairable',
          previousStatus: 'Under Maintenance',
          newStatus: 'Damaged',
          performedBy: req.user._id,
          referenceId: repair._id,
          remarks: `Technician determined asset is unrepairable: ${inspectionDetails || remarks}`
        });
      }
    }

    await repair.save();

    await logAudit({
      action: `Repair Updated (${repair.repairStatus})`,
      performedBy: req.user._id,
      recordId: repair._id,
      collectionName: 'AssetRepair',
      details: `Technician updated repair order for asset ${asset.assetTag}`,
      req
    });

    res.status(200).json({
      success: true,
      message: `Repair progress updated. Status: ${repair.repairStatus}.`,
      repair
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkOrder,
  getAllRepairs,
  getTechnicianWorkOrders,
  updateRepairProgress
};
