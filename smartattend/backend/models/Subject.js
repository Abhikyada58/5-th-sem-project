const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

subjectSchema.index({ code: 1 });
subjectSchema.index({ classId: 1 });
subjectSchema.index({ teacherId: 1 });

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
