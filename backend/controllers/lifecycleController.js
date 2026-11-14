const AssetLifecycle = require('../models/AssetLifecycle');

// @desc    Get all lifecycle records with filtering
// @route   GET /api/lifecycle
// @access  Private
const getLifecycleHistory = async (req, res, next) => {
  try {
    const { assetId, action, page = 1, limit = 50 } = req.query;

    const query = {};
    if (assetId) query.asset = assetId;
    if (action && action !== 'All') query.action = action;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AssetLifecycle.countDocuments(query);
    const lifecycles = await AssetLifecycle.find(query)
      .populate('asset', 'assetName assetTag serialNumber category model brand status')
      .populate('performedBy', 'firstName lastName email employeeId role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: lifecycles.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      lifecycles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full lifecycle history for a single asset
// @route   GET /api/lifecycle/asset/:assetId
// @access  Private
const getAssetLifecycleTimeline = async (req, res, next) => {
  try {
    const lifecycles = await AssetLifecycle.find({ asset: req.params.assetId })
      .populate('performedBy', 'firstName lastName email employeeId role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: lifecycles.length,
      timeline: lifecycles
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLifecycleHistory,
  getAssetLifecycleTimeline
};
