const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  resource: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // flexible JSON payload
  },
  ipAddress: {
    type: String,
  },
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: false }, // Only need when it was created
});

// Index to automatically delete logs older than 90 days (optional but recommended for storage)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
