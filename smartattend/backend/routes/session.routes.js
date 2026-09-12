const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const sessionController = require('../controllers/session.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('TEACHER')); // Only teachers can manage attendance sessions

router.post('/start', sessionController.startSession);
router.get('/active', sessionController.getActiveSessions);
router.get('/subjects', sessionController.getTeacherSubjects);
router.get('/:id', sessionController.getSessionById);
router.post('/:id/close', sessionController.closeSession);

module.exports = router;
