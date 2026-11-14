const express = require('express');
const router = express.Router();
const {
  createWorkOrder,
  getAllRepairs,
  getTechnicianWorkOrders,
  updateRepairProgress
} = require('../controllers/repairController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/my-work-orders', authorize('Support Team'), getTechnicianWorkOrders);

router.route('/')
  .get(authorize('Admin', 'Asset Manager', 'Support Team'), getAllRepairs)
  .post(authorize('Admin', 'Asset Manager'), createWorkOrder);

router.put('/:id/progress', updateRepairProgress);

module.exports = router;
