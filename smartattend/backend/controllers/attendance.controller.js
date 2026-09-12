const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');

exports.verifyQR = async (req, res) => {
  try {
    const { sessionId, token } = req.body;

    if (!sessionId || !token) {
      return res.status(400).json({ success: false, message: 'Invalid QR Code payload' });
    }

    // 1. Fetch Session
    const session = await AttendanceSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // 2. Check Session Status & Expiry
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'This attendance session has been closed' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This QR code has expired' });
    }

    // 3. Verify Class Membership
    // Ensure the student belongs to the class this session was created for
    if (req.user.classId.toString() !== session.classId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this class' });
    }

    // 4. Verify Cryptographic Token
    const hashedIncomingToken = crypto.createHash('sha256').update(token).digest('hex');
    
    if (hashedIncomingToken !== session.qrTokenHash) {
      return res.status(400).json({ success: false, message: 'Invalid or forged QR code' });
    }

    // 5. Generate secure handoff token (Valid for 5 minutes)
    const verificationPayload = {
      studentId: req.user._id,
      sessionId: session._id,
      purpose: 'face-verification'
    };

    const verificationToken = jwt.sign(
      verificationPayload,
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '5m' }
    );

    res.json({
      success: true,
      message: 'QR verified. Proceed to face verification.',
      verificationToken,
      sessionDetails: {
        _id: session._id,
        subjectId: session.subjectId,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('QR Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during QR verification' });
  }
};

const livenessService = require('../services/liveness.service');
const Attendance = require('../models/Attendance');

// Helper to calculate Euclidean distance between two 128-d vectors
function euclideanDistance(desc1, desc2) {
  if (desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}

exports.markAttendance = async (req, res) => {
  try {
    const { verificationToken, liveDescriptor } = req.body;

    if (!verificationToken || !liveDescriptor || !Array.isArray(liveDescriptor)) {
      return res.status(400).json({ success: false, message: 'Missing token or biometric payload' });
    }

    // 1. Validate Token (Proves QR was scanned successfully within last 5 mins)
    let payload;
    try {
      payload = jwt.verify(verificationToken, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Verification token expired or invalid. Please scan the QR code again.' });
    }

    if (payload.purpose !== 'face-verification' || payload.studentId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Invalid token payload' });
    }

    const sessionId = payload.sessionId;

    // 2. Fetch User & Session
    const user = await User.findById(req.user._id).select('faceEnrolled encryptedFaceTemplate classId');
    const session = await AttendanceSession.findById(sessionId);

    if (!session || session.status !== 'ACTIVE' || new Date(session.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Session has expired or closed.' });
    }

    if (!user.faceEnrolled || !user.encryptedFaceTemplate) {
      return res.status(400).json({ success: false, message: 'Face enrollment is incomplete.' });
    }

    // 3. Ensure student hasn't already marked attendance
    const existingAttendance = await Attendance.findOne({ studentId: user._id, sessionId: session._id });
    if (existingAttendance && existingAttendance.status === 'PRESENT') {
      return res.status(400).json({ success: false, message: 'Attendance already marked for this session.' });
    }

    // 4. Liveness Check (Stub)
    const livenessResult = await livenessService.verifyLiveness(null, null);
    if (!livenessResult.isLive) {
      return res.status(403).json({ success: false, message: 'Liveness verification failed. Spoofing detected.' });
    }

    // 5. Cryptographic Face Matching
    const masterTemplate = JSON.parse(user.encryptedFaceTemplate); // Array of 128 floats
    const distance = euclideanDistance(liveDescriptor, masterTemplate);
    
    // Threshold tuning: 0.45 is typically a good strict threshold for face-api.js euclidean distance
    const FACE_MATCH_THRESHOLD = 0.45;
    const isMatch = distance <= FACE_MATCH_THRESHOLD;

    if (!isMatch) {
      // Log failed attempt but don't mark PRESENT. Use upsert to avoid E11000 duplicate key errors if they retry.
      await Attendance.findOneAndUpdate(
        { studentId: user._id, sessionId: session._id },
        {
          teacherId: session.teacherId,
          classId: session.classId,
          subjectId: session.subjectId,
          status: 'ABSENT',
          faceVerified: false,
          livenessVerified: true,
          verificationScore: distance,
          failureReason: 'FACE_MISMATCH'
        },
        { upsert: true, new: true }
      );
      return res.status(403).json({ success: false, message: 'Face does not match the enrolled biometric template.' });
    }

    // 6. Success! Mark Present safely
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { studentId: user._id, sessionId: session._id },
      {
        teacherId: session.teacherId,
        classId: session.classId,
        subjectId: session.subjectId,
        status: 'PRESENT',
        markedAt: new Date(),
        faceVerified: true,
        livenessVerified: true,
        verificationScore: distance,
        failureReason: null
      },
      { upsert: true, new: true }
    ).populate('studentId', 'fullName rollNumber');

    // 7. Emit Real-Time Socket Update to Teacher
    if (req.io) {
      req.io.to(session.classId.toString()).emit('attendance-updated', {
        studentName: attendanceRecord.studentId.fullName,
        rollNumber: attendanceRecord.studentId.rollNumber,
        markedAt: attendanceRecord.markedAt
      });
      req.io.to(session.classId.toString()).emit('student-entered-session', {
        studentName: attendanceRecord.studentId.fullName
      });
    }

    res.json({ success: true, message: 'Attendance marked successfully!', score: distance });

  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during attendance processing' });
  }
};
