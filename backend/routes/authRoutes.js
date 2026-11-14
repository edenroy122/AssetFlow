const express = require('express');
const router = express.Router();
const {
  loginUser,
  getMe,
  updateOwnProfile,
  changeOwnPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateOwnProfile);
router.patch('/change-password', protect, changeOwnPassword);

module.exports = router;
