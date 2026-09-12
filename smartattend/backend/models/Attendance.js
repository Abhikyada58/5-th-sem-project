const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true,
  },
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
  markedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
    default: 'PRESENT',
  },
  faceVerified: {
    type: Boolean,
    default: false,
  },
  livenessVerified: {
    type: Boolean,
    default: false,
  },
  verificationScore: {
    type: Number,
  },
  failureReason: {
    type: String,
  },
}, {
  timestamps: true,
});

// Ensure a student can only have one attendance record per session
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

// Indexes for fast analytics queries
attendanceSchema.index({ classId: 1, subjectId: 1, markedAt: -1 });
attendanceSchema.index({ studentId: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
