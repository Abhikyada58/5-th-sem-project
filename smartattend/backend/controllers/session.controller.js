const crypto = require('crypto');
const AttendanceSession = require('../models/AttendanceSession');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

exports.startSession = async (req, res) => {
  try {
    const { classId, subjectId, durationMinutes } = req.body;
    
    if (!classId || !subjectId || !durationMinutes) {
      return res.status(400).json({ success: false, message: 'Class, Subject, and Duration are required' });
    }

    // Verify ownership/existence (basic check)
    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists || subjectExists.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to start a session for this subject' });
    }

    // Close any currently active sessions for this teacher to prevent overlaps
    await AttendanceSession.updateMany(
      { teacherId: req.user._id, status: 'ACTIVE' },
      { status: 'CLOSED', closedAt: Date.now() }
    );

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for DB storage
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60000);

    const session = await AttendanceSession.create({
      teacherId: req.user._id,
      classId,
      subjectId,
      qrTokenHash: hashedToken,
      startedAt,
      expiresAt,
      status: 'ACTIVE'
    });

    // Broadcast to the class that a session started
    const populatedSession = await AttendanceSession.findById(session._id)
      .populate('classId', 'name')
      .populate('subjectId', 'name');
      
    if (req.io) {
      req.io.to(classId).emit('attendance-session-started', {
        _id: populatedSession._id,
        className: populatedSession.classId.name,
        subjectName: populatedSession.subjectId.name,
        expiresAt: populatedSession.expiresAt
      });
    }

    const auditService = require('../services/audit.service');
    await auditService.logAction(
      req.user._id,
      'ATTENDANCE_SESSION_CREATED',
      'AttendanceSession',
      { sessionId: session._id, classId, subjectId },
      req.ip
    );

    // We return the RAW token to the frontend, but we never store it raw.
    res.status(201).json({
      success: true,
      session: {
        _id: session._id,
        classId: session.classId,
        subjectId: session.subjectId,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status
      },
      rawToken // The frontend will embed this into the QR code
    });

  } catch (error) {
    console.error('Start Session Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await AttendanceSession.find({
      teacherId: req.user._id,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() } // Also ensure it hasn't organically expired
    }).populate('classId', 'name').populate('subjectId', 'name code');

    res.json({ success: true, sessions: activeSessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    }).populate('classId', 'name').populate('subjectId', 'name code');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.closeSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      { status: 'CLOSED', closedAt: Date.now() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Broadcast session closed event
    if (req.io) {
      req.io.to(session.classId.toString()).emit('attendance-session-closed', session._id);
    }

    res.json({ success: true, message: 'Session closed successfully', session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getTeacherSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ teacherId: req.user._id }).populate('classId', 'name semester');
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
