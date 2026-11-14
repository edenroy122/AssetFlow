import React from 'react';
import { PlusCircle, RefreshCw, Wrench, RotateCcw } from 'lucide-react';
import './RequestNavbar.css';

const navItems = [
  { id: 'New Asset', label: 'New Asset', icon: PlusCircle },
  { id: 'Replacement', label: 'Replacement', icon: RefreshCw },
  { id: 'Repair', label: 'Repair', icon: Wrench },
  { id: 'Return', label: 'Return', icon: RotateCcw }
];

const RequestNavbar = ({ activeType, onSelectType }) => {
  return (
    <nav className="request-type-navbar" aria-label="Asset Request Type Navigation">
      <div className="request-navbar-track">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`request-navbar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectType(item.id)}
            >
              <IconComponent size={16} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default RequestNavbar;
