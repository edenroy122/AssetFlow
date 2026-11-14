const express = require('express');
const router = express.Router();
const {
  getLifecycleHistory,
  getAssetLifecycleTimeline
} = require('../controllers/lifecycleController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getLifecycleHistory);
router.get('/asset/:assetId', getAssetLifecycleTimeline);

module.exports = router;
