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
    <div>
            <div className="layout-px-spacing">
                <div className="page-header d-flex justify-content-between">
                    <div className="page-title">
                        <h3>Dashboard</h3>
                    </div>
                    <div className="page-title page-btn">
                      
                    </div>
                </div>
            </div>
        </div>
  );
};

export default Dashboard;
