const User = require('../models/User');

exports.getEnrollmentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('faceEnrolled faceEnrolledAt faceEnrollmentSampleCount faceEnrollmentVersion');
    res.json({ success: true, status: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.completeEnrollment = async (req, res) => {
  try {
    const { descriptors } = req.body; // Array of arrays

    if (!descriptors || !Array.isArray(descriptors) || descriptors.length === 0) {
      return res.status(400).json({ success: false, message: 'No face descriptors provided' });
    }

    // A descriptor is a 128-dimensional array. We will average them to create a master template.
    const numSamples = descriptors.length;
    const dimensions = 128;
    
    let masterTemplate = new Array(dimensions).fill(0);

    for (let i = 0; i < numSamples; i++) {
      const descriptor = descriptors[i];
      if (descriptor.length !== dimensions) {
        return res.status(400).json({ success: false, message: 'Invalid descriptor dimensions' });
      }
      for (let j = 0; j < dimensions; j++) {
        masterTemplate[j] += descriptor[j];
      }
    }

    for (let j = 0; j < dimensions; j++) {
      masterTemplate[j] = masterTemplate[j] / numSamples;
    }

    const { encrypt } = require('../utils/crypto');
    
    // Convert to JSON string for secure storage and encrypt using AES
    const serializedTemplate = JSON.stringify(masterTemplate);
    const encryptedFaceTemplate = encrypt(serializedTemplate);

    const user = await User.findByIdAndUpdate(req.user._id, {
      faceEnrolled: true,
      faceEnrolledAt: new Date(),
      faceEnrollmentSampleCount: numSamples,
      faceEnrollmentVersion: '1.0',
      encryptedFaceTemplate: encryptedFaceTemplate
    }, { new: true }).select('faceEnrolled faceEnrolledAt');

    res.json({ success: true, message: 'Biometric enrollment successful', user });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteEnrollment = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.faceEnrolled = false;
    user.faceEnrolledAt = null;
    user.faceEnrollmentSampleCount = 0;
    user.encryptedFaceTemplate = undefined;
    
    await user.save();

    const auditService = require('../services/audit.service');
    await auditService.logAction(
      req.user._id, // Assume Admin who resets it
      'FACE_ENROLLMENT_RESET',
      'User',
      { targetUserId: user._id },
      req.ip
    );

    res.json({ success: true, message: 'Face enrollment reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
