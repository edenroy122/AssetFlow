const express = require('express');
const router = express.Router();
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  retireAsset,
  deleteAsset,
  getFilterMetadata
} = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/metadata/filters', getFilterMetadata);

router.route('/')
  .get(getAssets)
  .post(authorize('Admin', 'Asset Manager'), createAsset);

router.route('/:id')
  .get(getAssetById)
  .put(authorize('Admin', 'Asset Manager'), updateAsset)
  .delete(authorize('Admin', 'Asset Manager'), deleteAsset);

router.patch('/:id/retire', authorize('Admin', 'Asset Manager'), retireAsset);

module.exports = router;
