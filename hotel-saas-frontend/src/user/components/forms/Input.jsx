// src/components/forms/Input.jsx
import React from 'react';

const Input = ({ label, type = 'text', placeholder, value, onChange, name, className = '', error }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      // CRITICAL: Ensure 'is-invalid' is correctly added
      className={`form-control ${className} ${error ? 'is-invalid' : ''}`}
    />
    {/* CRITICAL: This div must exist and be inside the form-group */}
    {error && <div className="invalid-feedback">{error}</div>}
  </div>
);

export default Input;