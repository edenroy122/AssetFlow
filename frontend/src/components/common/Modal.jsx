import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg
  footer
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ams-modal-overlay" onClick={onClose}>
      <div
        className={`ams-modal-dialog ams-modal-dialog-${size}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="ams-modal-header">
          <h3 className="ams-modal-title">{title}</h3>
          <button
            type="button"
            className="ams-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ams-modal-body">{children}</div>

        {footer && <div className="ams-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
