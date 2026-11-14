const User = require('../models/User');
const Asset = require('../models/Asset');
const AssetRequest = require('../models/AssetRequest');
const AssetRepair = require('../models/AssetRepair');
const AssetAssignment = require('../models/AssetAssignment');
const AuditLog = require('../models/AuditLog');

// @desc    Get dashboard metrics computed dynamically for current user's role
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    let data = {};

    if (role === 'Admin') {
      const [
        totalEmployees,
        totalAssets,
        availableAssets,
        assignedAssets,
        pendingAssetRequests,
        underMaintenanceAssets,
        damagedAssets,
        retiredAssets,
        recentAssets,
        recentActivities
      ] = await Promise.all([
        User.countDocuments(),
        Asset.countDocuments(),
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Assigned' }),
        AssetRequest.countDocuments({ status: 'Pending' }),
        Asset.countDocuments({ status: 'Under Maintenance' }),
        Asset.countDocuments({ status: 'Damaged' }),
        Asset.countDocuments({ status: 'Retired' }),
        Asset.find().sort({ createdAt: -1 }).limit(5).select('assetName assetTag category status createdAt'),
        AuditLog.find().populate('performedBy', 'firstName lastName role').sort({ createdAt: -1 }).limit(8)
      ]);

      data = {
        totalAssets,
        totalEmployees,
        totalUsers: totalEmployees,
        assignedAssets,
        availableAssets,
        pendingAssetRequests,
        pendingRequests: pendingAssetRequests,
        underMaintenanceAssets,
        damagedAssets,
        retiredAssets,
        recentAssets,
        recentActivities
      };
    } else if (role === 'Asset Manager') {
      const now = new Date();
      const [
        totalAssets,
        availableAssets,
        assignedAssets,
        pendingRequests,
        overdueReturns,
        underMaintenanceAssets,
        damagedAssets,
        inProgressRepairs,
        recentRequests,
        recentAssignments
      ] = await Promise.all([
        Asset.countDocuments(),
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Assigned' }),
        AssetRequest.countDocuments({ status: 'Pending' }),
        AssetAssignment.countDocuments({ status: 'Active', expectedReturnDate: { $ne: null, $lt: now } }),
        Asset.countDocuments({ status: 'Under Maintenance' }),
        Asset.countDocuments({ status: 'Damaged' }),
        AssetRepair.countDocuments({ repairStatus: { $in: ['Assigned', 'In Progress'] } }),
        AssetRequest.find().populate('requestedBy', 'firstName lastName email').sort({ createdAt: -1 }).limit(5),
        AssetAssignment.find({ status: 'Active' })
          .populate('asset', 'assetName assetTag')
          .populate('assignedTo', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      data = {
        totalAssets,
        availableAssets,
        assignedAssets,
        pendingRequests,
        overdueReturns,
        underMaintenanceAssets,
        damagedAssets,
        inProgressRepairs,
        recentRequests,
        recentAssignments
      };
    } else if (role === 'Support Team') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [
        assignedWorkOrders,
        pendingWorkOrders,
        inProgressOrders,
        completedWorkOrders,
        overdueWorkOrders,
        pendingHandoversCount,
        completedHandoversCount,
        availableAssetsCount,
        assignedQueue,
        recentHandovers
      ] = await Promise.all([
        AssetRepair.countDocuments({
          $or: [
            { assignedTechnician: req.user._id },
            { assignedTechnician: null }
          ]
        }),
        AssetRepair.countDocuments({ repairStatus: { $in: ['Pending', 'Assigned'] } }),
        AssetRepair.countDocuments({ repairStatus: 'In Progress' }),
        AssetRepair.countDocuments({ repairStatus: 'Completed' }),
        AssetRepair.countDocuments({
          repairStatus: { $in: ['Pending', 'Assigned', 'In Progress'] },
          createdAt: { $lt: sevenDaysAgo }
        }),
        AssetRequest.countDocuments({ assignedSupport: req.user._id, status: { $in: ['Approved', 'Processing'] } }),
        AssetRequest.countDocuments({ fulfilledBy: req.user._id, status: 'Completed' }),
        Asset.countDocuments({ status: 'Available' }),
        AssetRequest.find({ assignedSupport: req.user._id, status: { $in: ['Approved', 'Processing'] } })
          .populate('requestedBy', 'firstName lastName employeeId designation')
          .populate('asset', 'assetName assetTag model')
          .sort({ createdAt: -1 })
          .limit(5),
        AssetRequest.find({ fulfilledBy: req.user._id, status: 'Completed' })
          .populate('requestedBy', 'firstName lastName employeeId')
          .populate('allocatedAsset', 'assetName assetTag')
          .sort({ updatedAt: -1 })
          .limit(5)
      ]);

      data = {
        assignedWorkOrders,
        myWorkOrders: assignedWorkOrders,
        pendingWorkOrders,
        pendingOrders: pendingWorkOrders,
        inProgressOrders,
        completedWorkOrders,
        completedRepairs: completedWorkOrders,
        overdueWorkOrders,
        pendingHandoversCount,
        completedHandoversCount,
        availableAssetsCount,
        assignedQueue,
        recentHandovers
      };
    } else if (role === 'Employee') {
      const [
        myAssetsCount,
        pendingRequestsCount,
        approvedRequestsCount,
        openMaintenanceRequests,
        completedRepairs,
        myAssets,
        myRecentRequests
      ] = await Promise.all([
        Asset.countDocuments({ assignedTo: req.user._id, status: 'Assigned' }),
        AssetRequest.countDocuments({ requestedBy: req.user._id, status: 'Pending' }),
        AssetRequest.countDocuments({ requestedBy: req.user._id, status: { $in: ['Approved', 'Processing'] } }),
        AssetRepair.countDocuments({
          reportedBy: req.user._id,
          repairStatus: { $in: ['Pending', 'Assigned', 'In Progress'] }
        }),
        AssetRepair.countDocuments({
          reportedBy: req.user._id,
          repairStatus: 'Completed'
        }),
        Asset.find({ assignedTo: req.user._id, status: 'Assigned' }).sort({ createdAt: -1 }).limit(5),
        AssetRequest.find({ requestedBy: req.user._id })
          .populate('asset', 'assetName assetTag')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      data = {
        myAssetsCount,
        pendingRequestsCount,
        approvedRequestsCount,
        openMaintenanceRequests,
        completedRepairs,
        completedRequestsCount: approvedRequestsCount,
        myAssets,
        myRecentRequests
      };
    }

    res.status(200).json({
      success: true,
      role,
      stats: data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
