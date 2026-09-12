const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('STUDENT')); // Only students scan QR codes

router.post('/verify-qr', attendanceController.verifyQR);
router.post('/mark', attendanceController.markAttendance);

router.get('/my-summary', attendanceController.getMySummary);
router.get('/my-subject-summary', attendanceController.getMySubjectSummary);
router.get('/my-history', attendanceController.getMyHistory);

module.exports = router;
