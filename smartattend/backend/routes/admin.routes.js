const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/stats', adminController.getDashboardStats);

// Students
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.put('/students/:id/status', adminController.updateAccountStatus);
router.put('/students/:id/reset-face', adminController.resetFaceEnrollment);

// Teachers
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);

// Classes
router.get('/classes', adminController.getClasses);
router.post('/classes', adminController.createClass);

// Subjects
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
