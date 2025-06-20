import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer-wrapper">
      <div className="footer-section f-section-1">
        <p>Copyright © {currentYear} All Rights Reserved by RankMe Now</p>
      </div>
    </div>
  );
};

export default Footer;
