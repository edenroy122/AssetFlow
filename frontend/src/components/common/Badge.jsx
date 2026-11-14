import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'secondary', withDot = true, className = '' }) => {
  return (
    <span className={`ams-badge ams-badge-${variant} ${className}`}>
      {withDot && <span className="ams-badge-dot"></span>}
      {children}
    </span>
  );
};

export default Badge;
