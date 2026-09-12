const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const faceController = require('../controllers/face.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('STUDENT')); // Only students need to enroll faces right now

router.get('/status', faceController.getEnrollmentStatus);
router.post('/complete', faceController.completeEnrollment);
router.delete('/', faceController.deleteEnrollment);

module.exports = router;
