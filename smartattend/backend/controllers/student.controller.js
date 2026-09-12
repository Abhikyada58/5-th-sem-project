const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.setupProfile = async (req, res) => {
  try {
    const { fullName, studentId, aiId, phone, dateOfBirth, classId, division, rollNumber, academicYear, password } = req.body;
    const userId = req.user._id;

    // Ensure uniqueness of AI ID and Student ID across other users
    if (studentId) {
      const existingStudent = await User.findOne({ studentId, _id: { $ne: userId } });
      if (existingStudent) return res.status(400).json({ success: false, message: 'Student ID is already in use by another account' });
    }

    if (aiId) {
      const existingAi = await User.findOne({ aiId, _id: { $ne: userId } });
      if (existingAi) return res.status(400).json({ success: false, message: 'AI ID is already in use by another account' });
    }

    const updates = {
      fullName,
      studentId,
      aiId,
      phone,
      dateOfBirth,
      classId,
      division,
      rollNumber,
      academicYear,
      firstLogin: false // Setup is complete
    };

    // If they provided a new password, hash it and save it
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-passwordHash');

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Setup Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error during profile setup' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash')
      .populate('classId', 'name semester academicYear');
      
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const Class = require('../models/Class');
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true });
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
