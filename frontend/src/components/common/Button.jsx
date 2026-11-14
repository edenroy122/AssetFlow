import React from 'react';
import './Button.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, success, outline
  size = 'md',         // sm, md, lg
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`ams-btn ams-btn-${variant} ams-btn-${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
    </button>
  );
};

export default Button;
