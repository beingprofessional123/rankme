import React from 'react';

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { name: 'Booking Data', id: 'home1' },
    // { name: 'Competitor Data', id: 'home2' },
    { name: 'STR/OCR Reports', id: 'home3' },
    { name: 'Property Price', id: 'home4' }, // This is the new tab you added
  ];

  return (
    <div className="report-tabdesign">
      <ul className="nav nav-tabs" role="tablist">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <a
              className={`nav-link ${activeTab === tab.name ? 'active' : ''}`}
              data-bs-toggle="tab"
              href={`#${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.name ? 'true' : 'false'}
              onClick={() => setActiveTab(tab.name)}
            >
              {tab.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tabs;