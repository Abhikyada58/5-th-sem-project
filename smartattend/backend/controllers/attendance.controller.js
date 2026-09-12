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
