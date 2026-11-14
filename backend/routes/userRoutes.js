const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  toggleUserStatus,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Allow Asset Manager & Admin to view users (e.g. for assigning Support Team / Employees)
router.get('/', authorize('Admin', 'Asset Manager', 'Support Team'), getUsers);
router.get('/:id', authorize('Admin', 'Asset Manager'), getUserById);

// Creation, modifications, status toggles, and deletion strictly restricted to Admin
router.post('/', authorize('Admin'), createUser);
router.put('/:id', authorize('Admin'), updateUser);
router.patch('/:id/password', authorize('Admin'), changeUserPassword);
router.patch('/:id/status', authorize('Admin'), toggleUserStatus);
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;
