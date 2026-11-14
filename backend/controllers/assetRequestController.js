const AssetRequest = require('../models/AssetRequest');
const Asset = require('../models/Asset');
const AssetAssignment = require('../models/AssetAssignment');
const User = require('../models/User');
const { logAudit, recordLifecycle, createNotification } = require('../utils/logger');

// @desc    Submit an asset request (Employee)
// @route   POST /api/requests
// @access  Private (Employee)
const createRequest = async (req, res, next) => {
  try {
    const { requestType, requestedAssetName, specifications, reason, assetId } = req.body;

    if (!requestType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide requestType and reason'
      });
    }

    if (requestType === 'New Asset') {
      if (!requestedAssetName) {
        return res.status(400).json({
          success: false,
          message: 'Requested asset name is required for New Asset requests'
        });
      }
    } else {
      // Replacement, Repair, Return require an assigned asset
      if (!assetId) {
        return res.status(400).json({
          success: false,
          message: `An assigned asset reference is required for ${requestType} requests`
        });
      }

      // Verify that the asset exists and is currently assigned to THIS employee
      const asset = await Asset.findById(assetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Selected asset not found'
        });
      }

      if (String(asset.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'You can only request return, repair or replacement on assets currently assigned to you.'
        });
      }
    }

    const newRequest = await AssetRequest.create({
      requestedBy: req.user._id,
      requestType,
      requestedAssetName: requestType === 'New Asset' ? requestedAssetName : undefined,
      specifications: requestType === 'New Asset' ? specifications : undefined,
      reason,
      asset: requestType !== 'New Asset' ? assetId : null,
      status: 'Pending'
    });

    const populatedRequest = await AssetRequest.findById(newRequest._id)
      .populate('requestedBy', 'firstName lastName email employeeId')
      .populate('asset', 'assetName assetTag model serialNumber');

    await logAudit({
      action: 'Asset Request Submitted',
      performedBy: req.user._id,
      recordId: newRequest._id,
      collectionName: 'AssetRequest',
      details: `${req.user.firstName} submitted ${requestType} request`,
      req
    });

    res.status(201).json({
      success: true,
      message: `${requestType} request submitted successfully.`,
      request: populatedRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests (Admin & Asset Manager)
// @route   GET /api/requests
// @access  Private (Admin, Asset Manager)
const getAllRequests = async (req, res, next) => {
  try {
    const { status, requestType, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (requestType && requestType !== 'All') {
      query.requestType = requestType;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AssetRequest.countDocuments(query);
    const requests = await AssetRequest.find(query)
      .populate('requestedBy', 'firstName lastName email employeeId designation location phoneNumber')
      .populate('asset', 'assetName assetTag model serialNumber condition status')
      .populate('allocatedAsset', 'assetName assetTag model serialNumber')
      .populate('assignedSupport', 'firstName lastName email employeeId')
      .populate('fulfilledBy', 'firstName lastName email employeeId')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests belonging to logged-in employee
// @route   GET /api/requests/my-requests
// @access  Private (Employee)
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await AssetRequest.find({ requestedBy: req.user._id })
      .populate('asset', 'assetName assetTag model serialNumber condition')
      .populate('allocatedAsset', 'assetName assetTag model serialNumber')
      .populate('assignedSupport', 'firstName lastName email employeeId')
      .populate('fulfilledBy', 'firstName lastName email employeeId')
      .populate('reviewedBy', 'firstName lastName')
      .populate('supportMessages.sender', 'firstName lastName employeeId role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review request: Approve or Reject & assign to Support Team member
// @route   PATCH /api/requests/:id/review
// @access  Private (Admin, Asset Manager)
const reviewRequest = async (req, res, next) => {
  try {
    const { status, reviewComment = '', assignedSupportId } = req.body;

    if (!['Approved', 'Rejected', 'Processing'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Approved', 'Processing' or 'Rejected'"
      });
    }

    if (status === 'Rejected' && !reviewComment.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A review comment is required when rejecting a request'
      });
    }

    if (status === 'Approved' && !assignedSupportId) {
      return res.status(400).json({
        success: false,
        message: 'Please assign a Support Team member to fulfill and hand over this request'
      });
    }

    let supportUser = null;
    if (assignedSupportId) {
      supportUser = await User.findById(assignedSupportId);
      if (!supportUser) {
        return res.status(404).json({
          success: false,
          message: 'Selected Support Team member not found'
        });
      }
    }

    const request = await AssetRequest.findById(req.params.id)
      .populate('requestedBy')
      .populate('asset');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewComment = reviewComment;
    request.reviewedAt = new Date();
    if (assignedSupportId) {
      request.assignedSupport = assignedSupportId;
    }

    await request.save();

    // If approved & assigned, notify the assigned Support Team member
    if (status === 'Approved' && supportUser) {
      const supportInstructions = ['Repair', 'Return'].includes(request.requestType)
        ? `Please contact ${request.requestedBy.firstName} ${request.requestedBy.lastName} and ask them to bring in ${request.asset?.assetName || 'their asset'} for ${request.requestType.toLowerCase()}.`
        : `Please prepare the requested asset and message ${request.requestedBy.firstName} ${request.requestedBy.lastName} when it is ready for collection.`;
      await createNotification({
        recipient: supportUser._id,
        title: `Asset Request Assigned: ${request.requestType}`,
        message: `Asset Manager assigned you request for ${request.requestedBy.firstName} ${request.requestedBy.lastName} (${request.requestType}: ${request.requestedAssetName || request.asset?.assetName || ''}). ${supportInstructions}`,
        type: 'info',
        link: '/support/requests'
      });
    }

    // Send notification to the employee
    await createNotification({
      recipient: request.requestedBy._id,
      title: `Asset Request ${status}`,
      message: status === 'Approved' && supportUser
        ? `Your ${request.requestType} request has been approved and assigned to Support Team member ${supportUser.firstName} ${supportUser.lastName} for fulfillment and handover.`
        : `Your ${request.requestType} request has been marked as ${status}.${reviewComment ? ` Note: ${reviewComment}` : ''}`,
      type: status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'info',
      link: '/employee/my-requests'
    });

    await logAudit({
      action: `Request ${status}`,
      performedBy: req.user._id,
      recordId: request._id,
      collectionName: 'AssetRequest',
      details: `${req.user.role} marked request as ${status}${supportUser ? ` and assigned to Support (${supportUser.firstName} ${supportUser.lastName})` : ''}`,
      req
    });

    const populated = await AssetRequest.findById(request._id)
      .populate('requestedBy', 'firstName lastName email employeeId designation location phoneNumber')
      .populate('asset', 'assetName assetTag model serialNumber condition status')
      .populate('allocatedAsset', 'assetName assetTag model serialNumber')
      .populate('assignedSupport', 'firstName lastName email employeeId')
      .populate('reviewedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `Request marked as ${status}${supportUser ? ` and assigned to Support Team member ${supportUser.firstName} ${supportUser.lastName}` : ''}.`,
      request: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests assigned to Support Team
// @route   GET /api/requests/support-queue
// @access  Private (Support Team, Admin, Asset Manager)
const getSupportQueue = async (req, res, next) => {
  try {
    const { status = 'All', requestType = 'All', filterMode = 'my' } = req.query;

    const query = {};

    // Filter by assigned support member
    if (req.user.role === 'Support Team' && filterMode === 'my') {
      query.assignedSupport = req.user._id;
    } else if (req.user.role === 'Support Team' && filterMode === 'all') {
      query.$or = [
        { assignedSupport: { $ne: null } },
        { status: { $in: ['Approved', 'Processing'] } }
      ];
    } else if (req.query.assignedSupport) {
      query.assignedSupport = req.query.assignedSupport;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (requestType && requestType !== 'All') {
      query.requestType = requestType;
    }

    const requests = await AssetRequest.find(query)
      .populate('requestedBy', 'firstName lastName email employeeId designation location phoneNumber')
      .populate('asset', 'assetName assetTag model serialNumber category condition location status')
      .populate('allocatedAsset', 'assetName assetTag model serialNumber category condition location status')
      .populate('assignedSupport', 'firstName lastName email employeeId')
      .populate('reviewedBy', 'firstName lastName')
      .populate('fulfilledBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handover asset & fulfill request (Support Team)
// @route   POST /api/requests/:id/handover
// @access  Private (Support Team, Admin, Asset Manager)
const handoverRequest = async (req, res, next) => {
  try {
    const {
      assetId, // For New Asset: selected available asset
      replacementAssetId, // For Replacement: selected replacement asset
      oldAssetCondition, // For Replacement / Return
      oldAssetFinalStatus = 'Available', // For Replacement / Return
      conditionAtAssignment = 'Good',
      remarks = '',
      expectedReturnDate = null
    } = req.body;

    const request = await AssetRequest.findById(req.params.id)
      .populate('requestedBy')
      .populate('asset');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Asset request not found'
      });
    }

    if (request.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'This request is already completed and fulfilled'
      });
    }

    if (request.status !== 'Approved' && request.status !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: `Only 'Approved' or 'Processing' requests can be handed over. Current status is '${request.status}'`
      });
    }

    const employee = request.requestedBy;
    const hasSupportStage = (stage) => request.supportMessages?.some((entry) => entry.stage === stage);

    if (request.requestType === 'New Asset' || request.requestType === 'Replacement') {
      if (!hasSupportStage('ready_for_collection')) {
        return res.status(400).json({ success: false, message: 'Send the employee a collection message before completing this handover.' });
      }
    } else if (request.requestType === 'Return' && !hasSupportStage('bring_asset')) {
      return res.status(400).json({ success: false, message: 'Ask the employee to bring in the asset before accepting the return.' });
    } else if (request.requestType === 'Repair') {
      const requiredStage = request.status === 'Approved' ? 'bring_asset' : 'ready_for_collection';
      if (!hasSupportStage(requiredStage)) {
        return res.status(400).json({
          success: false,
          message: request.status === 'Approved'
            ? 'Ask the employee to bring in the asset before confirming receipt.'
            : 'Send the employee a repair-ready message before completing the return handover.'
        });
      }
    }

    if (request.requestType === 'New Asset') {
      if (!assetId) {
        return res.status(400).json({
          success: false,
          message: 'Please choose an available asset from inventory to hand over to the employee'
        });
      }

      const asset = await Asset.findById(assetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Selected asset not found'
        });
      }

      if (asset.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: `Asset cannot be handed over because its current status is '${asset.status}'. Only 'Available' assets can be assigned.`
        });
      }

      // Create AssetAssignment
      const assignment = await AssetAssignment.create({
        asset: asset._id,
        assignedTo: employee._id,
        assignedBy: req.user._id,
        assignmentDate: new Date(),
        expectedReturnDate: expectedReturnDate || null,
        conditionAtAssignment,
        status: 'Active',
        remarks: remarks || `Handed over by Support Team (${req.user.firstName} ${req.user.lastName})`
      });

      // Update Asset
      const previousStatus = asset.status;
      asset.status = 'Assigned';
      asset.assignedTo = employee._id;
      asset.currentAssignment = assignment._id;
      asset.condition = conditionAtAssignment;
      await asset.save();

      // Update Request
      request.status = 'Completed';
      request.allocatedAsset = asset._id;
      request.fulfilledBy = req.user._id;
      request.handoverDate = new Date();
      request.handoverRemarks = remarks;
      request.handoverCondition = conditionAtAssignment;
      await request.save();

      // Lifecycle
      await recordLifecycle({
        asset: asset._id,
        action: 'Asset Assigned',
        previousStatus,
        newStatus: 'Assigned',
        performedBy: req.user._id,
        referenceId: assignment._id,
        remarks: `Handed over by Support Team to ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
      });

      // Employee Notification
      await createNotification({
        recipient: employee._id,
        title: 'Asset Handover Completed',
        message: `Support Team member ${req.user.firstName} ${req.user.lastName} has handed over ${asset.assetName} [Tag: ${asset.assetTag}] to you.`,
        type: 'success',
        link: '/employee/my-assets'
      });

      // Audit Log
      await logAudit({
        action: 'Support Handover Completed',
        performedBy: req.user._id,
        recordId: request._id,
        collectionName: 'AssetRequest',
        details: `Support handed over ${asset.assetTag} to ${employee.employeeId}`,
        req
      });

      return res.status(200).json({
        success: true,
        message: `Asset '${asset.assetName}' successfully handed over to ${employee.firstName} ${employee.lastName}.`,
        request
      });
    } else if (request.requestType === 'Replacement') {
      if (!replacementAssetId) {
        return res.status(400).json({
          success: false,
          message: 'Please choose a replacement asset from inventory'
        });
      }

      const replacementAsset = await Asset.findById(replacementAssetId);
      if (!replacementAsset || replacementAsset.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: 'Replacement asset must exist and have status "Available"'
        });
      }

      // Close old asset assignment
      const oldAsset = await Asset.findById(request.asset._id || request.asset);
      if (oldAsset) {
        const oldAssignment = await AssetAssignment.findOne({
          asset: oldAsset._id,
          assignedTo: employee._id,
          status: 'Active'
        });

        if (oldAssignment) {
          oldAssignment.status = 'Returned';
          oldAssignment.actualReturnDate = new Date();
          oldAssignment.conditionAtReturn = oldAssetCondition || 'Good';
          oldAssignment.remarks = `${oldAssignment.remarks ? oldAssignment.remarks + ' | ' : ''}Replaced by Support (${req.user.firstName}): ${remarks}`;
          await oldAssignment.save();
        }

        const oldPrev = oldAsset.status;
        oldAsset.status = oldAssetFinalStatus || 'Under Maintenance';
        oldAsset.condition = oldAssetCondition || oldAsset.condition;
        oldAsset.assignedTo = null;
        oldAsset.currentAssignment = null;
        await oldAsset.save();

        await recordLifecycle({
          asset: oldAsset._id,
          action: 'Asset Returned for Replacement',
          previousStatus: oldPrev,
          newStatus: oldAsset.status,
          performedBy: req.user._id,
          referenceId: oldAssignment?._id,
          remarks: `Taken back by Support Team for replacement. Condition: ${oldAssetCondition || 'Good'}`
        });
      }

      // Create new assignment for replacement asset
      const newAssignment = await AssetAssignment.create({
        asset: replacementAsset._id,
        assignedTo: employee._id,
        assignedBy: req.user._id,
        assignmentDate: new Date(),
        expectedReturnDate: expectedReturnDate || null,
        conditionAtAssignment,
        status: 'Active',
        remarks: `Replacement asset handed over by Support Team (${req.user.firstName}). ${remarks}`
      });

      replacementAsset.status = 'Assigned';
      replacementAsset.assignedTo = employee._id;
      replacementAsset.currentAssignment = newAssignment._id;
      replacementAsset.condition = conditionAtAssignment;
      await replacementAsset.save();

      // Update Request
      request.status = 'Completed';
      request.allocatedAsset = replacementAsset._id;
      request.fulfilledBy = req.user._id;
      request.handoverDate = new Date();
      request.handoverRemarks = remarks;
      await request.save();

      await recordLifecycle({
        asset: replacementAsset._id,
        action: 'Asset Assigned as Replacement',
        previousStatus: 'Available',
        newStatus: 'Assigned',
        performedBy: req.user._id,
        referenceId: newAssignment._id,
        remarks: `Replacement handed over by Support to ${employee.firstName} ${employee.lastName}`
      });

      await createNotification({
        recipient: employee._id,
        title: 'Replacement Asset Handed Over',
        message: `Support Team handed over replacement asset ${replacementAsset.assetName} [Tag: ${replacementAsset.assetTag}] to you.`,
        type: 'success',
        link: '/employee/my-assets'
      });

      await logAudit({
        action: 'Support Replacement Completed',
        performedBy: req.user._id,
        recordId: request._id,
        collectionName: 'AssetRequest',
        details: `Support handed over replacement ${replacementAsset.assetTag} to ${employee.employeeId}`,
        req
      });

      return res.status(200).json({
        success: true,
        message: `Replacement asset '${replacementAsset.assetName}' handed over to ${employee.firstName} ${employee.lastName}.`,
        request
      });
    } else if (request.requestType === 'Return') {
      const asset = await Asset.findById(request.asset._id || request.asset);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Asset associated with return request not found'
        });
      }

      const activeAssignment = await AssetAssignment.findOne({
        asset: asset._id,
        assignedTo: employee._id,
        status: 'Active'
      });

      if (activeAssignment) {
        activeAssignment.status = 'Returned';
        activeAssignment.actualReturnDate = new Date();
        activeAssignment.conditionAtReturn = oldAssetCondition || 'Good';
        activeAssignment.remarks = `${activeAssignment.remarks ? activeAssignment.remarks + ' | ' : ''}Return verified by Support (${req.user.firstName}): ${remarks}`;
        await activeAssignment.save();
      }

      const previousStatus = asset.status;
      asset.status = oldAssetFinalStatus || 'Available';
      asset.condition = oldAssetCondition || asset.condition;
      asset.assignedTo = null;
      asset.currentAssignment = null;
      await asset.save();

      request.status = 'Completed';
      request.fulfilledBy = req.user._id;
      request.handoverDate = new Date();
      request.handoverRemarks = remarks;
      await request.save();

      await recordLifecycle({
        asset: asset._id,
        action: 'Asset Return Handover Accepted',
        previousStatus,
        newStatus: asset.status,
        performedBy: req.user._id,
        referenceId: activeAssignment?._id,
        remarks: `Returned by ${employee.firstName} ${employee.lastName}. Condition: ${oldAssetCondition || 'Good'}. Final status: ${asset.status}. Verified by Support.`
      });

      await createNotification({
        recipient: employee._id,
        title: 'Asset Return Handover Verified',
        message: `Support Team verified and accepted the return of ${asset.assetName} [Tag: ${asset.assetTag}].`,
        type: 'info',
        link: '/employee/history'
      });

      await logAudit({
        action: 'Support Return Handover Accepted',
        performedBy: req.user._id,
        recordId: request._id,
        collectionName: 'AssetRequest',
        details: `Support verified return of ${asset.assetTag} from ${employee.employeeId}`,
        req
      });

      return res.status(200).json({
        success: true,
        message: `Asset return handover completed. Asset status updated to '${asset.status}'.`,
        request
      });
    } else if (request.requestType === 'Repair') {
      const asset = await Asset.findById(request.asset._id || request.asset);
      if (!asset) {
        return res.status(404).json({ success: false, message: 'Asset associated with repair request was not found.' });
      }

      if (request.status === 'Approved') {
        const previousStatus = asset.status;
        asset.status = 'Under Maintenance';
        await asset.save();
        request.status = 'Processing';
        request.handoverRemarks = remarks || request.handoverRemarks;
        await request.save();

        await recordLifecycle({
          asset: asset._id,
          action: 'Asset Received for Repair',
          previousStatus,
          newStatus: asset.status,
          performedBy: req.user._id,
          referenceId: request._id,
          remarks: `Received from ${employee.firstName} ${employee.lastName} for repair.`
        });
        await logAudit({
          action: 'Repair Started',
          performedBy: req.user._id,
          recordId: request._id,
          collectionName: 'AssetRequest',
          details: `Support received asset ${asset.assetTag}; repair is now processing`,
          req
        });

        return res.status(200).json({ success: true, message: 'Asset received. Repair request is now Processing.', request });
      }

      const previousStatus = asset.status;
      asset.status = 'Assigned';
      asset.assignedTo = employee._id;
      await asset.save();
      request.status = 'Completed';
      request.fulfilledBy = req.user._id;
      request.handoverDate = new Date();
      request.handoverRemarks = remarks;
      request.handoverCondition = oldAssetCondition || 'Good';
      await request.save();

      await recordLifecycle({
        asset: asset._id,
        action: 'Repaired Asset Returned',
        previousStatus,
        newStatus: asset.status,
        performedBy: req.user._id,
        referenceId: request._id,
        remarks: `Repaired asset returned to ${employee.firstName} ${employee.lastName}.`
      });
      await createNotification({
        recipient: employee._id,
        title: 'Repaired Asset Handed Back',
        message: `Support returned your repaired ${asset.assetName} [Tag: ${asset.assetTag}].`,
        type: 'success',
        link: '/employee/my-assets'
      });
      await logAudit({
        action: 'Repair Completed and Asset Returned',
        performedBy: req.user._id,
        recordId: request._id,
        collectionName: 'AssetRequest',
        details: `Support returned repaired asset ${asset.assetTag} to ${employee.employeeId}`,
        req
      });
      return res.status(200).json({ success: true, message: 'Repaired asset returned and request completed.', request });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send a Support Team message to the employee on a request
// @route   POST /api/requests/:id/messages
// @access  Private (assigned Support Team member)
const sendSupportMessage = async (req, res, next) => {
  try {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const stage = req.body.stage || 'general';

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please enter a message for the employee.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: 'Messages must be 2000 characters or fewer.' });
    }
    if (!['bring_asset', 'ready_for_collection', 'general'].includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid message type.' });
    }

    const request = await AssetRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'Approved' && request.status !== 'Processing') {
      return res.status(400).json({ success: false, message: 'Messages can be sent after a request is approved.' });
    }
    if (req.user.role === 'Support Team' && String(request.assignedSupport) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only message employees for requests assigned to you.' });
    }

    const sentStage = (expectedStage) => request.supportMessages?.some((entry) => entry.stage === expectedStage);
    let expectedStage = null;
    if (request.requestType === 'New Asset' || request.requestType === 'Replacement') {
      expectedStage = 'ready_for_collection';
    } else if (request.requestType === 'Return') {
      expectedStage = 'bring_asset';
    } else if (request.requestType === 'Repair') {
      expectedStage = request.status === 'Approved' ? 'bring_asset' : 'ready_for_collection';
    }

    if (!expectedStage || stage !== expectedStage) {
      return res.status(400).json({ success: false, message: 'This message type is not valid for the current request step.' });
    }
    if (request.requestType === 'Repair' && stage === 'ready_for_collection' && request.status !== 'Processing') {
      return res.status(400).json({ success: false, message: 'Repair collection messages can be sent only while the repair is Processing.' });
    }
    if (request.requestType === 'Repair' && stage === 'bring_asset' && request.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'The bring-in message can only be sent before the repair starts.' });
    }
    if (request.requestType === 'Return' && request.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'The return request message can only be sent once after approval.' });
    }
    if (sentStage(stage)) {
      return res.status(409).json({ success: false, message: 'This message has already been sent for this request step.' });
    }

    request.supportMessages.push({ sender: req.user._id, stage, message });
    await request.save();

    const title = stage === 'bring_asset'
      ? 'Please bring your asset to Support'
      : 'Your asset is ready for collection';

    await createNotification({
      recipient: request.requestedBy,
      title,
      message,
      type: stage === 'ready_for_collection' ? 'success' : 'info',
      link: '/employee/my-requests'
    });

    await logAudit({
      action: 'Support Message Sent',
      performedBy: req.user._id,
      recordId: request._id,
      collectionName: 'AssetRequest',
      details: `Support Team sent a ${stage} message to the employee`,
      req
    });

    const updatedRequest = await AssetRequest.findById(request._id)
      .populate('supportMessages.sender', 'firstName lastName employeeId role');

    res.status(201).json({ success: true, message: 'Message sent to the employee.', request: updatedRequest });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  reviewRequest,
  getSupportQueue,
  handoverRequest,
  sendSupportMessage
};
