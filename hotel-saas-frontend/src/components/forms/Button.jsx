// src/components/forms/Button.jsx
import React from 'react';

// Modified to accept a `className` prop and apply it,
// while removing most of the default Tailwind styles.
const Button = ({ children, type = 'button', onClick, className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    // Combine the new design's classes with any additional classes passed in
    // The HTML uses 'btn btn-info' so we'll expect that to be passed via `className` prop.
    className={`btn ${className}`} // Removed Tailwind specific classes
  >
    {children}
  </button>
);

export default Button;