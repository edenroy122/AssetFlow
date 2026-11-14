const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const AssetLifecycle = require('../models/AssetLifecycle');

// Record system audit log
const logAudit = async ({
  action,
  performedBy,
  recordId,
  collectionName,
  details,
  req
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';
    await AuditLog.create({
      action,
      performedBy,
      recordId,
      collectionName,
      details,
      ipAddress: String(ipAddress)
    });
  } catch (error) {
    console.error('[AuditLog] Error recording audit trail:', error.message);
  }
};

// Record asset lifecycle transition
const recordLifecycle = async ({
  asset,
  action,
  previousStatus,
  newStatus,
  performedBy,
  referenceId = null,
  remarks = ''
}) => {
  try {
    await AssetLifecycle.create({
      asset,
      action,
      previousStatus: previousStatus || 'None',
      newStatus,
      performedBy,
      referenceId,
      remarks,
      date: new Date()
    });
  } catch (error) {
    console.error('[Lifecycle] Error recording lifecycle record:', error.message);
  }
};

// Send notification to a user
const createNotification = async ({
  recipient,
  title,
  message,
  type = 'info',
  link = ''
}) => {
  try {
    if (!recipient) return;
    await Notification.create({
      recipient,
      title,
      message,
      type,
      link
    });
  } catch (error) {
    console.error('[Notification] Error creating notification:', error.message);
  }
};

module.exports = {
  logAudit,
  recordLifecycle,
  createNotification
};
