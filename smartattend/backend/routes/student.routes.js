const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const studentController = require('../controllers/student.controller');

const router = express.Router();

router.use(protect);
router.use(authorize('STUDENT'));

router.get('/classes', studentController.getClasses);
router.post('/setup-profile', studentController.setupProfile);
router.get('/profile', studentController.getProfile);

module.exports = router;
