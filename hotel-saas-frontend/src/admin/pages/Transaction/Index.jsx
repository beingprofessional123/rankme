import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MUIDataTable from 'mui-datatables';
import { IconButton, Tooltip } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { toast } from 'react-toastify';

const TransactionManagementIndex = () => {
  const [transactions, setTransactions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ Fetch all transactions from backend
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/transaction/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Normalize invoice field
      const formattedData = (response.data.results || []).map((item) => ({
        ...item,
        invoice_url: item.invoice_url || item.invoiceUrl || item.invoiceLink || null,
      }));

      setTransactions(formattedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transaction data');
    }
  };

  // ✅ Columns for DataTable
  const columns = [
    { name: 'userName', label: 'User Name' },
    { name: 'userEmail', label: 'Email' },
    { name: 'userPhone', label: 'Phone' },
    { name: 'subscriptionName', label: 'Subscription' },
    {
      name: 'amount',
      label: 'Amount',
      options: {
        filter: false,
        customBodyRender: (value) =>
          value ? `$${parseFloat(value).toFixed(2)}` : '$0.00',
        customCSVDataRender: (value) =>
          value ? `$${parseFloat(value).toFixed(2)}` : '$0.00',
      },
    },
    {
      name: 'createdAt',
      label: 'Date',
      options: {
        filter: false,
        customBodyRender: (val) =>
          val ? new Date(val).toLocaleString() : 'N/A',
        customCSVDataRender: (val) =>
          val ? new Date(val).toLocaleString() : 'N/A',
      },
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        customBodyRender: (value) => {
          const isPaid =
            value?.toLowerCase() === 'success' ||
            value?.toLowerCase() === 'paid';
          return (
            <span
              className={`badge ${
                isPaid ? 'bg-success' : 'bg-danger'
              } text-uppercase`}
            >
              {isPaid ? 'Success' : value || 'N/A'}
            </span>
          );
        },
        customCSVDataRender: (value) =>
          value?.toLowerCase() === 'success' || value?.toLowerCase() === 'paid'
            ? 'Success'
            : value || 'N/A',
      },
    },
    {
      name: 'invoice_url',
      label: 'Invoice',
      options: {
        filter: false,
        customBodyRender: (value, tableMeta) => {
          const rowData = transactions[tableMeta.rowIndex];
          const isPaid =
            rowData?.status?.toLowerCase() === 'success' ||
            rowData?.status?.toLowerCase() === 'paid';

          if (isPaid && value) {
            return (
              <Tooltip title="View Invoice">
                <IconButton
                  component={Link}
                  to={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  color="primary"
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
            );
          }

          return <span className="text-muted">N/A</span>;
        },
        customCSVDataRender: (value, tableMeta) => {
          const rowData = transactions[tableMeta.rowIndex];
          const isPaid =
            rowData?.status?.toLowerCase() === 'success' ||
            rowData?.status?.toLowerCase() === 'paid';

          if (!value || !isPaid) return 'N/A';
          return value;
        },
      },
    },
  ];

  // ✅ Table configuration
  const options = {
    selectableRows: 'none',
    search: true,
    download: true,
    print: false,
    viewColumns: true,
    filter: true,
    pagination: true,
    responsive: 'standard',
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 25, 50, 100],
    downloadOptions: {
      filename: 'transactions.csv',
      separator: ',',
    },
    textLabels: {
      body: {
        noMatch: 'No transactions found',
      },
    },
  };

  return (
    <div className="layout-px-spacing">
      <div className="page-header d-flex justify-content-between">
        <div className="page-title">
          <h3>Transaction Management</h3>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success text-center text-uppercase my-2">
          {successMessage}
        </div>
      )}

      <div className="row layout-top-spacing" id="cancel-row">
        <div className="col-xl-12 col-lg-12 col-sm-12 layout-spacing">
          <div className="widget-content widget-content-area br-6">
            <div className="tabledesign">
              <div className="table-responsive">
                <MUIDataTable
                  title="Transaction List"
                  data={transactions}
                  columns={columns}
                  options={options}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagementIndex;
