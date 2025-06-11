import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import MUIDataTable from 'mui-datatables';
import roomAddIcon from '../../assets/images/roomadd.svg';
import viewIcon from '../../assets/images/view.svg';
import editIcon from '../../assets/images/edit.svg';
import deleteIcon from '../../assets/images/deletetd.svg';

const HotelsAndRoomsList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      if (!companyId) throw new Error('Company ID not found in user data.');

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${companyId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hotels.');
      }

      const data = await response.json();
      setHotels(data.hotels || []);
      toast.success(data.message || 'Hotels loaded successfully!');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to load hotels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleView = (hotelId) => navigate(`/hotels-and-rooms/${hotelId}`);
  const handleEdit = (hotelId) => navigate(`/hotels-and-rooms/edit/${hotelId}`);

  const handleDelete = async (hotelId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/delete/${hotelId}`;

          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete hotel.');
          }

          const data = await response.json();
          toast.success(data.message || 'Hotel deleted successfully!');
          fetchHotels();
        } catch (err) {
          console.error('Error:', err);
          toast.error(err.message || 'Failed to delete hotel.');
        }
      }
    });
  };

  const columns = [
    { name: 'id', label: 'ID', options: { filter: false, sort: true } },
    { name: 'name', label: 'Hotel', options: { filter: false, sort: true } },
    {
      name: 'Rooms',
      label: 'Rooms',
      options: {
        customBodyRender: (value) => (value && value.length > 0 ? value.join(', ') : 'N/A'),
      },
    },
    {
      name: 'Actions',
      label: 'Actions',
      options: {
        filter: false,
        sort: false,
        customBodyRenderLite: (dataIndex) => {
          const hotel = hotels[dataIndex];
          return (
            <>
              <a href="#" onClick={() => handleView(hotel.id)}><img src={viewIcon} alt="View" className="mx-1" /></a>
              <a href="#" onClick={() => handleEdit(hotel.id)}><img src={editIcon} alt="Edit" className="mx-1" /></a>
              <a href="#" onClick={() => handleDelete(hotel.id)}><img src={deleteIcon} alt="Delete" className="mx-1" /></a>
            </>
          );
        },
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
        pagination: true,
        responsive: 'standard'
    };

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-6">
              <div className="breadcrumb-sec">
                <h2>Hotels & Rooms</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="#">Home</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Hotels & Rooms</li>
                  </ol>
                </nav>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <a href="#" onClick={() => navigate('/hotels-and-rooms/add')} className="btn btn-info">
                <img src={roomAddIcon} alt="Add" className="img-fluid" /> Add
              </a>
            </div>
          </div>

          <div className="">   {/*  white-bg p-3 */}
            <MUIDataTable
              title="Hotels List"
              data={hotels}
              columns={columns}
              options={options}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HotelsAndRoomsList;
