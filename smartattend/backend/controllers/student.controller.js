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
      $set: {
        fullName,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        classId: classId ? classId : null,
        division,
        rollNumber,
        academicYear,
        firstLogin: false
      },
      $unset: {}
    };

    if (studentId) updates.$set.studentId = studentId.trim();
    else updates.$unset.studentId = "";

    if (aiId) updates.$set.aiId = aiId.trim();
    else updates.$unset.aiId = "";

    // If they provided a new password, hash it and save it
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      updates.$set.passwordHash = await bcrypt.hash(password, salt);
    }

    // Clean up empty $unset
    if (Object.keys(updates.$unset).length === 0) {
      delete updates.$unset;
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
const AttendanceSession = require('../models/AttendanceSession');

exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true });
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getActiveSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      classId: req.user.classId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    }).populate('subjectId', 'name').populate('classId', 'name');

    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session' });
    }

    res.json({ 
      success: true, 
      session: {
        _id: session._id,
        subjectName: session.subjectId.name,
        className: session.classId.name,
        expiresAt: session.expiresAt
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
