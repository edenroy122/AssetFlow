const AuditLog = require('../models/AuditLog');

// @desc    Get system audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, collectionName, page = 1, limit = 50 } = req.query;

    const query = {};
    if (action && action !== 'All') query.action = action;
    if (collectionName && collectionName !== 'All') query.collectionName = collectionName;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'firstName lastName email employeeId role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
