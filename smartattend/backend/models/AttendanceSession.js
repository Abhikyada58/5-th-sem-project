const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  qrTokenHash: {
    type: String,
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'CLOSED', 'EXPIRED'],
    default: 'ACTIVE',
  },
  closedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

attendanceSessionSchema.index({ teacherId: 1 });
attendanceSessionSchema.index({ classId: 1, subjectId: 1 });
attendanceSessionSchema.index({ status: 1 });
attendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Optional TTL index if we want them to auto-expire

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
module.exports = AttendanceSession;
