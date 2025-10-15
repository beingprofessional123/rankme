// src/layouts/AuthLayout.jsx
import React from 'react';

const AuthLayout = ({ children }) => (
  // Remove Tailwind classes that conflict with the new design's body/background styling
  // The 'loginbg' class (from style.css) is expected to be applied to the body element
  // or a very top-level container, which is handled in index.js for global CSS.
  // This AuthLayout will now only provide the internal structure for the login box.
  <div className="loginmain-wrapper"> {/* Add a wrapper class if needed, or simply render children */}
    {children}
  </div>
);

export default AuthLayout;