const Asset = require('../models/Asset');
const { logAudit, recordLifecycle } = require('../utils/logger');

// @desc    Get all assets with filtering, search and pagination
// @route   GET /api/assets
// @access  Private (Admin, Asset Manager, Technician, Employee)
const getAssets = async (req, res, next) => {
  try {
    const {
      search,
      category,
      status,
      condition,
      location,
      assignedTo,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by condition
    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    // Filter by location
    if (location && location !== 'All') {
      query.location = location;
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Search by assetName, assetTag, serialNumber, brand, model
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetName: searchRegex },
        { assetTag: searchRegex },
        { serialNumber: searchRegex },
        { brand: searchRegex },
        { model: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .populate('assignedTo', 'firstName lastName email employeeId designation')
      .populate('currentAssignment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: assets.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      assets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Private
const getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email employeeId designation phoneNumber')
      .populate('currentAssignment')
      .populate('createdBy', 'firstName lastName email');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.status(200).json({
      success: true,
      asset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new asset
// @route   POST /api/assets
// @access  Private (Admin, Asset Manager)
const createAsset = async (req, res, next) => {
  try {
    const {
      assetName,
      assetTag,
      serialNumber,
      category = 'Laptop',
      brand,
      model,
      specifications = '',
      purchaseDate,
      purchaseCost,
      vendor = 'Official Vendor',
      warrantyStartDate,
      warrantyEndDate,
      location = 'Headquarters',
      condition = 'Good',
      description = ''
    } = req.body;

    // Validate required fields
    if (!assetName || !brand || !model || purchaseCost === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assetName, brand, model and purchaseCost'
      });
    }

    // Auto-generate assetTag if not supplied
    const finalAssetTag = assetTag
      ? assetTag.trim().toUpperCase()
      : `AST-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Auto-generate serialNumber if not supplied
    const finalSerialNumber = serialNumber
      ? serialNumber.trim().toUpperCase()
      : `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Uniqueness checks
    const existingTag = await Asset.findOne({ assetTag: finalAssetTag });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: `Asset tag '${finalAssetTag}' is already registered.`
      });
    }

    const existingSerial = await Asset.findOne({ serialNumber: finalSerialNumber });
    if (existingSerial) {
      return res.status(400).json({
        success: false,
        message: `Serial number '${finalSerialNumber}' is already registered.`
      });
    }

    const asset = await Asset.create({
      assetName,
      assetTag: finalAssetTag,
      serialNumber: finalSerialNumber,
      category,
      brand,
      model,
      specifications,
      purchaseDate: purchaseDate || new Date(),
      purchaseCost: Number(purchaseCost),
      vendor,
      warrantyStartDate,
      warrantyEndDate,
      location,
      condition,
      status: 'Available',
      description,
      createdBy: req.user._id
    });

    // Record lifecycle
    await recordLifecycle({
      asset: asset._id,
      action: 'Asset Registered',
      previousStatus: 'None',
      newStatus: 'Available',
      performedBy: req.user._id,
      remarks: `Initial registration of asset ${asset.assetName} (${asset.assetTag})`
    });

    // Record audit log
    await logAudit({
      action: 'Asset Created',
      performedBy: req.user._id,
      recordId: asset._id,
      collectionName: 'Asset',
      details: `Created asset ${asset.assetName} [${asset.assetTag}]`,
      req
    });

    res.status(201).json({
      success: true,
      message: `Asset '${asset.assetName}' registered successfully.`,
      asset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update asset details
// @route   PUT /api/assets/:id
// @access  Private (Admin, Asset Manager)
const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const {
      assetName,
      assetTag,
      serialNumber,
      category,
      brand,
      model,
      specifications,
      purchaseDate,
      purchaseCost,
      vendor,
      warrantyStartDate,
      warrantyEndDate,
      location,
      condition,
      description
    } = req.body;

    // Check unique assetTag if modified
    if (assetTag && assetTag.toUpperCase() !== asset.assetTag) {
      const tagExists = await Asset.findOne({
        assetTag: assetTag.toUpperCase(),
        _id: { $ne: asset._id }
      });
      if (tagExists) {
        return res.status(400).json({
          success: false,
          message: `Asset tag '${assetTag}' is already registered.`
        });
      }
      asset.assetTag = assetTag.toUpperCase();
    }

    // Check unique serialNumber if modified
    if (serialNumber && serialNumber.toUpperCase() !== asset.serialNumber) {
      const serialExists = await Asset.findOne({
        serialNumber: serialNumber.toUpperCase(),
        _id: { $ne: asset._id }
      });
      if (serialExists) {
        return res.status(400).json({
          success: false,
          message: `Serial number '${serialNumber}' is already registered.`
        });
      }
      asset.serialNumber = serialNumber.toUpperCase();
    }

    const previousCondition = asset.condition;

    if (assetName) asset.assetName = assetName;
    if (category) asset.category = category;
    if (brand) asset.brand = brand;
    if (model) asset.model = model;
    if (specifications !== undefined) asset.specifications = specifications;
    if (purchaseDate) asset.purchaseDate = purchaseDate;
    if (purchaseCost !== undefined) asset.purchaseCost = Number(purchaseCost);
    if (vendor) asset.vendor = vendor;
    if (warrantyStartDate !== undefined) asset.warrantyStartDate = warrantyStartDate;
    if (warrantyEndDate !== undefined) asset.warrantyEndDate = warrantyEndDate;
    if (location) asset.location = location;
    if (condition) asset.condition = condition;
    if (description !== undefined) asset.description = description;

    await asset.save();

    // If condition changed, log lifecycle
    if (condition && condition !== previousCondition) {
      await recordLifecycle({
        asset: asset._id,
        action: 'Asset Updated',
        previousStatus: asset.status,
        newStatus: asset.status,
        performedBy: req.user._id,
        remarks: `Condition updated from ${previousCondition} to ${condition}`
      });
    }

    await logAudit({
      action: 'Asset Updated',
      performedBy: req.user._id,
      recordId: asset._id,
      collectionName: 'Asset',
      details: `Updated metadata for asset ${asset.assetName} [${asset.assetTag}]`,
      req
    });

    const updatedAsset = await Asset.findById(asset._id)
      .populate('assignedTo', 'firstName lastName email employeeId')
      .populate('currentAssignment');

    res.status(200).json({
      success: true,
      message: `Asset '${updatedAsset.assetName}' updated successfully.`,
      asset: updatedAsset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retire an asset
// @route   PATCH /api/assets/:id/retire
// @access  Private (Admin, Asset Manager)
const retireAsset = async (req, res, next) => {
  try {
    const { reason = 'End of lifecycle' } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status === 'Assigned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot retire an asset that is currently assigned. Process a return first.'
      });
    }

    const previousStatus = asset.status;
    asset.status = 'Retired';
    await asset.save();

    await recordLifecycle({
      asset: asset._id,
      action: 'Asset Retired',
      previousStatus,
      newStatus: 'Retired',
      performedBy: req.user._id,
      remarks: reason
    });

    await logAudit({
      action: 'Asset Retired',
      performedBy: req.user._id,
      recordId: asset._id,
      collectionName: 'Asset',
      details: `Asset ${asset.assetName} [${asset.assetTag}] was retired: ${reason}`,
      req
    });

    res.status(200).json({
      success: true,
      message: `Asset '${asset.assetName}' marked as Retired.`,
      asset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin, Asset Manager)
const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status === 'Assigned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an asset that is currently assigned.'
      });
    }

    if (asset.status === 'Under Maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an asset that is currently under maintenance.'
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    await logAudit({
      action: 'Asset Deleted',
      performedBy: req.user._id,
      recordId: asset._id,
      collectionName: 'Asset',
      details: `Deleted asset ${asset.assetName} [${asset.assetTag}]`,
      req
    });

    res.status(200).json({
      success: true,
      message: `Asset '${asset.assetName}' (${asset.assetTag}) was deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct categories and locations
// @route   GET /api/assets/metadata/filters
// @access  Private
const getFilterMetadata = async (req, res, next) => {
  try {
    const categories = await Asset.distinct('category');
    const locations = await Asset.distinct('location');
    res.status(200).json({
      success: true,
      categories,
      locations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  retireAsset,
  deleteAsset,
  getFilterMetadata
};
