const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  aiId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  phone: {
    type: String,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['ADMIN', 'TEACHER', 'STUDENT'],
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  division: {
    type: String,
    trim: true,
  },
  rollNumber: {
    type: String,
    trim: true,
  },
  academicYear: {
    type: String,
    trim: true,
  },
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
  },
  accountExpiresAt: {
    type: Date,
  },
  firstLogin: {
    type: Boolean,
    default: true,
  },
  faceEnrolled: {
    type: Boolean,
    default: false,
  },
  faceEnrolledAt: {
    type: Date,
  },
  faceEnrollmentVersion: {
    type: String,
  },
  faceEnrollmentSampleCount: {
    type: Number,
    default: 0,
  },
  encryptedFaceTemplate: {
    type: String, // Store secure embeddings, NEVER raw images
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Indexes to speed up queries
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ classId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
