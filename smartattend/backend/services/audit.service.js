const AuditLog = require('../models/AuditLog');

/**
 * Standardized global audit logging service.
 * @param {ObjectId} userId - The user performing the action
 * @param {String} action - The action type (e.g., 'ACCOUNT_ACTIVATION')
 * @param {String} resource - The resource being modified (e.g., 'User')
 * @param {Object} details - Flexible JSON details payload
 * @param {String} ipAddress - Request IP
 */
exports.logAction = async (userId, action, resource, details = {}, ipAddress = '') => {
  try {
    await AuditLog.create({
      userId,
      action,
      resource,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Failed to write Audit Log:', error.message);
    // Deliberately not throwing the error. We generally don't want to crash 
    // a successful business transaction just because logging failed.
  }
};
