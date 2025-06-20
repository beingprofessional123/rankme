import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!shownRef.current) {
      toast.success('WellCome To Admin');
      shownRef.current = true;
    }
  }, []);

  return (
    <div id="content" className="main-content">
      <div className="layout-px-spacing">
        <h4>Dashboard</h4>
      </div>
    </div>
  );
};

export default Dashboard;
