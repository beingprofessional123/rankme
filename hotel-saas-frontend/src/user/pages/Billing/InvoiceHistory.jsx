import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import MUIDataTable from 'mui-datatables';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchlistPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/list-payment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPayments(response.data.results || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load your payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchlistPayments();
  }, []);

  // Flatten and transform the data for table and CSV export
  // 🧠 First, transform the data (flatten)
  const transformedData = payments.map((p, index) => ({
    serial: index + 1,
    userName: p.User?.name || 'N/A', // ✅ Add user name from nested User object
    planName: p.SubscriptionPlan?.name || 'N/A',
    date: moment(p.createdAt).format('MMM D, YYYY'),
    type: p.SubscriptionPlan?.billing_period || 'N/A',
    amount: `$${p.amount}`,
    status: p.status,
    action: 'Download',
    invoice_url: p.invoice_url || '',
  }));


  const columns = [
    {
      name: 'serial',
      label: 'ID',
    },
    {
      name: 'userName',
      label: 'User Name',
      options: {
        display: false,       // ❌ Hide from UI table
        download: true,       // ✅ Include in CSV
        print: false,
      },
    },
    {
      name: 'planName',
      label: 'Plan Name',
    },
    {
      name: 'date',
      label: 'Date',
    },
    {
      name: 'type',
      label: 'Type',
    },
    {
      name: 'amount',
      label: 'Amount',
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        customBodyRender: (value) => (
          <span className={`badge bg-${value === 'success' ? 'success' : 'warning'}`}>
            {value}
          </span>
        ),
      },
    },
    {
      name: 'invoice_url',
      label: 'Action',
      options: {
        customBodyRender: (value) => (
          <Link  to={value} target="_blank" rel="noopener noreferrer">
            <img
              src="/user/images/download.svg"
              className="img-fluid"
              alt="Download"
              width="20"
            />
          </Link>
        ),
        download: false, // Don't show in CSV
        print: false,
      },
    },
  ];


  const options = {
    selectableRows: 'none',
    search: true,
    download: true,
    print: false,
    viewColumns: true,
    filter: true,
    responsive: 'standard',
    pagination: true,
    textLabels: {
      body: {
        noMatch: loading
          ? 'Loading Data...'
          : error
            ? `Error: ${error}`
            : 'Sorry, no matching records found',
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Invoice History</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to='/billing'>Home</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">Invoice History</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="white-bg">
            <div className="tabledesign">
              <div className="table-responsive">
                <MUIDataTable
                  title={'All Invoices'}
                  data={transformedData}
                  columns={columns}
                  options={options}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceHistory;
