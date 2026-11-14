const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  reviewRequest,
  getSupportQueue,
  handoverRequest,
  sendSupportMessage
} = require('../controllers/assetRequestController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/', createRequest);
router.get('/my-requests', getMyRequests);
router.get('/support-queue', authorize('Support Team', 'Admin', 'Asset Manager'), getSupportQueue);
router.post('/:id/handover', authorize('Support Team', 'Admin', 'Asset Manager'), handoverRequest);
router.post('/:id/messages', authorize('Support Team'), sendSupportMessage);
router.get('/', authorize('Admin', 'Asset Manager', 'Support Team'), getAllRequests);
router.patch('/:id/review', authorize('Admin', 'Asset Manager'), reviewRequest);

module.exports = router;
