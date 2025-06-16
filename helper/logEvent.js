const AuditLog = require('../models/auditLog');

/**
 * Logs an audit event.
 * @param {Object} params
 * @param {string} params.action - Action name (e.g., 'create_user')
 * @param {ObjectId} params.user - User performing the action
 * @param {string} params.resource - Resource type (e.g., 'User', 'Product')
 * @param {ObjectId} [params.resourceId] - ID of the resource
 * @param {Object} [params.details] - Extra details (before/after, etc.)
 * @param {ObjectId} [params.organization] - Organization (optional)
 */
module.exports = async function logEvent({ action, user, resource, resourceId, details = {}, organization }) {
  await AuditLog.create({
    action,
    user,
    resource,
    resourceId,
    details,
    organization
  });
}; 