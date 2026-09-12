const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('TEACHER')); // Reports are for teachers (Admins can have their own, or we can add ADMIN here)

router.get('/session/:sessionId', reportController.getSessionReport);
router.get('/class/:classId', reportController.getClassReport);
router.get('/export', reportController.exportReportCSV);

module.exports = router;
