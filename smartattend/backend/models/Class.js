const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
  },
  semester: {
    type: String,
    trim: true,
  },
  academicYear: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

classSchema.index({ name: 1, academicYear: 1 });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
