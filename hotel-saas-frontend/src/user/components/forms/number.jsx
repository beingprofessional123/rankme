// src/components/forms/Input.jsx
import React from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  name,
  className = '',
  error,
  leftAddon = null, // NEW
}) => (
  <div className="form-group phonenumber">
    {label && <label className="form-label">{label}</label>}

    
      {leftAddon && (
        <div className="input-group">
          {leftAddon}
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`form-control ${className} ${error ? 'is-invalid' : ''}`}
          />
        </div>
      )}

    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
);

export default Input;
