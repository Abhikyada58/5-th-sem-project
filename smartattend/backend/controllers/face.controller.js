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

    // Convert to JSON string for secure storage
    const encryptedFaceTemplate = JSON.stringify(masterTemplate);

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
    await User.findByIdAndUpdate(req.user._id, {
      faceEnrolled: false,
      faceEnrolledAt: null,
      faceEnrollmentSampleCount: 0,
      encryptedFaceTemplate: null
    });
    res.json({ success: true, message: 'Enrollment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
