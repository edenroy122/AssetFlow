const express = require('express');
const router = express.Router();
const {
  assignAsset,
  returnAsset,
  transferAsset,
  getAssignments,
  getMyAssignedAssets,
  getMyAssetHistory
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/my-assets', getMyAssignedAssets);
router.get('/my-history', getMyAssetHistory);

router.route('/')
  .get(authorize('Admin', 'Asset Manager'), getAssignments)
  .post(authorize('Admin', 'Asset Manager'), assignAsset);

router.post('/:id/return', authorize('Admin', 'Asset Manager'), returnAsset);
router.post('/:id/transfer', authorize('Admin', 'Asset Manager'), transferAsset);

module.exports = router;
