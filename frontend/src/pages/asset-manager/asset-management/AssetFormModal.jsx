import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { assetAPI } from '../../../services/api';
import {
  AlertCircle,
  PackagePlus,
  Check,
  Box,
  Tag,
  Hash,
  Cpu,
  DollarSign,
  Calendar,
  MapPin,
  Truck,
  ShieldCheck,
  FileText,
  Wrench,
} from 'lucide-react';
import './AssetFormModal.css';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

const AssetFormModal = ({ isOpen, onClose, onSuccess, editAsset = null }) => {
  const isEdit = Boolean(editAsset);

  const [formData, setFormData] = useState({
    assetName: '',
    assetTag: '',
    serialNumber: '',
    category: 'Laptop',
    brand: '',
    model: '',
    specifications: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    vendor: 'Official Vendor',
    warrantyStartDate: '',
    warrantyEndDate: '',
    location: 'Headquarters',
    condition: 'Good',
    description: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editAsset) {
      setFormData({
        assetName: editAsset.assetName || '',
        assetTag: editAsset.assetTag || '',
        serialNumber: editAsset.serialNumber || '',
        category: editAsset.category || 'Laptop',
        brand: editAsset.brand || '',
        model: editAsset.model || '',
        specifications: editAsset.specifications || '',
        purchaseDate: editAsset.purchaseDate
          ? new Date(editAsset.purchaseDate).toISOString().split('T')[0]
          : '',
        purchaseCost:
          editAsset.purchaseCost !== undefined ? editAsset.purchaseCost : '',
        vendor: editAsset.vendor || 'Official Vendor',
        warrantyStartDate: editAsset.warrantyStartDate
          ? new Date(editAsset.warrantyStartDate).toISOString().split('T')[0]
          : '',
        warrantyEndDate: editAsset.warrantyEndDate
          ? new Date(editAsset.warrantyEndDate).toISOString().split('T')[0]
          : '',
        location: editAsset.location || 'Headquarters',
        condition: editAsset.condition || 'Good',
        description: editAsset.description || '',
      });
    } else {
      setFormData({
        assetName: '',
        assetTag: '',
        serialNumber: '',
        category: 'Laptop',
        brand: '',
        model: '',
        specifications: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: 0,
        vendor: 'Official Vendor',
        warrantyStartDate: '',
        warrantyEndDate: '',
        location: 'Headquarters',
        condition: 'Good',
        description: '',
      });
    }
    setError('');
  }, [editAsset, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.assetName.trim() ||
      !formData.brand.trim() ||
      !formData.model.trim()
    ) {
      setError('Please provide Asset Name, Brand and Model.');
      return;
    }

    if (
      isEdit &&
      (formData.purchaseCost === '' || isNaN(formData.purchaseCost))
    ) {
      setError('Please provide a valid numeric Purchase Cost.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await assetAPI.updateAsset(editAsset._id, formData);
      } else {
        await assetAPI.createAsset(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Error saving asset.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Asset Details' : 'Register New Asset'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            icon={isEdit ? Check : PackagePlus}
          >
            {loading
              ? 'Saving...'
              : isEdit
              ? 'Save Changes'
              : 'Register Asset'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="afm-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="afm-form" autoComplete="off">
        {/* ─── Section: Asset Identity ─── */}
        <fieldset className="afm-section">
          <legend className="afm-section-title">
            <Box size={15} />
            Asset Identity
          </legend>

          <div className="afm-row afm-row-full">
            <div className="afm-field afm-field-full">
              <label className="afm-label">
                Asset Name <span className="afm-req">*</span>
              </label>
              <div className="afm-input-wrap">
                <Box size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="assetName"
                  className="afm-input"
                  value={formData.assetName}
                  onChange={handleChange}
                  placeholder="e.g. MacBook Pro 16 or Dell 27 Monitor"
                  required
                />
              </div>
            </div>
          </div>

          <div className="afm-row afm-row-full">
            <div className="afm-field">
              <label className="afm-label">Condition</label>
              <div className="afm-input-wrap">
                <Wrench size={15} className="afm-input-icon" />
                <select
                  name="condition"
                  className="afm-select"
                  value={formData.condition}
                  onChange={handleChange}
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="afm-row">
            <div className="afm-field">
              <label className="afm-label">
                Brand <span className="afm-req">*</span>
              </label>
              <div className="afm-input-wrap">
                <Tag size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="brand"
                  className="afm-input"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Apple, Dell, Lenovo, HP"
                  required
                />
              </div>
            </div>

            <div className="afm-field">
              <label className="afm-label">
                Model <span className="afm-req">*</span>
              </label>
              <div className="afm-input-wrap">
                <Cpu size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="model"
                  className="afm-input"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="M3 Max, XPS 15, Latitude"
                  required
                />
              </div>
            </div>
          </div>

          <div className="afm-row">
            <div className="afm-field">
              <label className="afm-label">
                Asset Tag{' '}
                {isEdit && <span className="afm-req">*</span>}
              </label>
              <div className="afm-input-wrap">
                <Hash size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="assetTag"
                  className="afm-input"
                  value={formData.assetTag}
                  onChange={handleChange}
                  placeholder={isEdit ? 'AST-...' : 'Auto-generated if blank'}
                />
              </div>
              {!isEdit && (
                <span className="afm-hint">Leave blank to auto-generate</span>
              )}
            </div>

            <div className="afm-field">
              <label className="afm-label">
                Serial Number{' '}
                {isEdit && <span className="afm-req">*</span>}
              </label>
              <div className="afm-input-wrap">
                <Hash size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="serialNumber"
                  className="afm-input"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder={isEdit ? 'SN-...' : 'Auto-generated if blank'}
                />
              </div>
              {!isEdit && (
                <span className="afm-hint">Leave blank to auto-generate</span>
              )}
            </div>
          </div>
        </fieldset>

        {isEdit && (
          <>
        {/* ─── Section: Purchase & Location ─── */}
        <fieldset className="afm-section">
          <legend className="afm-section-title">
            <DollarSign size={15} />
            {isEdit ? 'Purchase & Location' : 'Purchase Details'}
          </legend>

          <div className="afm-row">
            {isEdit && <div className="afm-field">
              <label className="afm-label">
                Purchase Cost (₹) <span className="afm-req">*</span>
              </label>
              <div className="afm-input-wrap">
                <DollarSign size={15} className="afm-input-icon" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="purchaseCost"
                  className="afm-input"
                  value={formData.purchaseCost}
                  onChange={handleChange}
                  placeholder="2499.00"
                  required
                />
              </div>
            </div>}

            <div className="afm-field">
              <label className="afm-label">Purchase Date</label>
              <div className="afm-input-wrap">
                <Calendar size={15} className="afm-input-icon" />
                <input
                  type="date"
                  name="purchaseDate"
                  className="afm-input"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="afm-row">
            <div className="afm-field">
              <label className="afm-label">Vendor / Supplier</label>
              <div className="afm-input-wrap">
                <Truck size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="vendor"
                  className="afm-input"
                  value={formData.vendor}
                  onChange={handleChange}
                  placeholder="Apple Direct, CDW, Dell"
                />
              </div>
            </div>

            {isEdit && <div className="afm-field">
              <label className="afm-label">Location</label>
              <div className="afm-input-wrap">
                <MapPin size={15} className="afm-input-icon" />
                <input
                  type="text"
                  name="location"
                  className="afm-input"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Headquarters, Floor 3"
                />
              </div>
            </div>}
          </div>
        </fieldset>
          </>
        )}

        {/* ─── Section: Warranty ─── */}
        <fieldset className="afm-section">
          <legend className="afm-section-title">
            <ShieldCheck size={15} />
            Warranty
          </legend>

          <div className="afm-row">
            <div className="afm-field">
              <label className="afm-label">Warranty Start Date</label>
              <div className="afm-input-wrap">
                <Calendar size={15} className="afm-input-icon" />
                <input
                  type="date"
                  name="warrantyStartDate"
                  className="afm-input"
                  value={formData.warrantyStartDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="afm-field">
              <label className="afm-label">Warranty Expiry Date</label>
              <div className="afm-input-wrap">
                <Calendar size={15} className="afm-input-icon" />
                <input
                  type="date"
                  name="warrantyEndDate"
                  className="afm-input"
                  value={formData.warrantyEndDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* ─── Section: Additional Details ─── */}
        <fieldset className="afm-section">
          <legend className="afm-section-title">
            <FileText size={15} />
            Additional Details
          </legend>

          <div className="afm-row afm-row-full">
            <div className="afm-field afm-field-full">
              <label className="afm-label">Hardware Specifications</label>
              <div className="afm-input-wrap afm-textarea-wrap">
                <Cpu size={15} className="afm-input-icon afm-textarea-icon" />
                <textarea
                  name="specifications"
                  className="afm-textarea"
                  value={formData.specifications}
                  onChange={handleChange}
                  placeholder="CPU, RAM, Storage, Screen, GPU details..."
                />
              </div>
            </div>
          </div>

          <div className="afm-row afm-row-full">
            <div className="afm-field afm-field-full">
              <label className="afm-label">Description / Notes</label>
              <div className="afm-input-wrap afm-textarea-wrap">
                <FileText size={15} className="afm-input-icon afm-textarea-icon" />
                <textarea
                  name="description"
                  className="afm-textarea"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Deployment details, accessories included, etc."
                />
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};

export default AssetFormModal;
