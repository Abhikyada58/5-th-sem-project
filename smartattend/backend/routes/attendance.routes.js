const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('STUDENT')); // Only students scan QR codes

router.post('/verify-qr', attendanceController.verifyQR);

module.exports = router;
