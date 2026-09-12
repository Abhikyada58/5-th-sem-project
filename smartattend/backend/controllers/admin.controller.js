const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/AttendanceSession');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

// Helper for audit logs
const logAction = async (userId, action, resource, details) => {
  await AuditLog.create({ userId, action, resource, details });
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalTeachers = await User.countDocuments({ role: 'TEACHER' });
    const totalClasses = await Class.countDocuments();
    const activeSessions = await AttendanceSession.countDocuments({ status: 'ACTIVE' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysAttendance = await Attendance.countDocuments({ markedAt: { $gte: today } });
    
    const studentsWithoutFace = await User.countDocuments({ role: 'STUDENT', faceEnrolled: false });
    const expiredAccounts = await User.countDocuments({ accountExpiresAt: { $lt: new Date() } });

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        activeSessions,
        todaysAttendance,
        studentsWithoutFace,
        expiredAccounts,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================= STUDENTS =================

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'STUDENT' })
      .select('-passwordHash')
      .populate('classId', 'name');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { fullName, email, password, studentId, classId, division, rollNumber } = req.body;
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const student = await User.create({
      fullName, email, passwordHash, role: 'STUDENT', studentId, classId, division, rollNumber
    });

    await logAction(req.user._id, 'CREATE_STUDENT', 'User', { studentId: student._id });
    res.status(201).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-passwordHash');
    await logAction(req.user._id, 'UPDATE_STUDENT', 'User', { studentId: req.params.id });
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await logAction(req.user._id, 'DELETE_STUDENT', 'User', { studentId: req.params.id });
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateAccountStatus = async (req, res) => {
  try {
    const { accountStatus, accountExpiresAt } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { accountStatus, accountExpiresAt }, { new: true }).select('-passwordHash');
    await logAction(req.user._id, 'UPDATE_ACCOUNT_STATUS', 'User', { targetUserId: req.params.id, accountStatus });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.resetFaceEnrollment = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { 
      faceEnrolled: false, 
      faceEnrolledAt: null,
      encryptedFaceTemplate: null 
    }, { new: true }).select('-passwordHash');
    await logAction(req.user._id, 'RESET_FACE_ENROLLMENT', 'User', { targetUserId: req.params.id });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ================= TEACHERS =================
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'TEACHER' }).select('-passwordHash');
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const teacher = await User.create({ fullName, email, passwordHash, role: 'TEACHER' });
    await logAction(req.user._id, 'CREATE_TEACHER', 'User', { teacherId: teacher._id });
    res.status(201).json({ success: true, teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= CLASSES =================
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    res.json({ success: true, classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createClass = async (req, res) => {
  try {
    const newClass = await Class.create(req.body);
    await logAction(req.user._id, 'CREATE_CLASS', 'Class', { classId: newClass._id });
    res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= SUBJECTS =================
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().populate('classId', 'name').populate('teacherId', 'fullName');
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    await logAction(req.user._id, 'CREATE_SUBJECT', 'Subject', { subjectId: subject._id });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= AUDIT LOGS =================
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).populate('userId', 'fullName role');
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
