// src/pages/HotelAndRooms/details.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';          // ← added Link
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';

const HotelAndRoomDetails = () => {
  const { id } = useParams();
  const [hotelDetails, setHotelDetails] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);

  /* ----------------------- Fetch hotel by ID ----------------------- */
  const fetchHotelDetails = useCallback(async () => {
    if (!id) {
      setError('Hotel ID is missing from the URL.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const apiUrl   = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/${id}`;
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || 'Failed to fetch hotel details.');
      }

      const data = await response.json();
      setHotelDetails(data.hotel);          // { hotel: { … } }
      toast.success(data.message || 'Hotel details loaded!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to load hotel details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchHotelDetails(); }, [fetchHotelDetails]);

  /* ---------------------- Render helpers ---------------------- */
  const listOrNA = (arr, prop) =>
    Array.isArray(arr) && arr.length
      ? arr.map((item) => item[prop] ?? item).join(', ')
      : 'N/A';

  /* -------------------------- JSX ----------------------------- */
  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">

          {/* ── Breadcrumb ───────────────────────────── */}
          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Hotel &amp; Room Details</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Hotel &amp; Room Details
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          {/* ── Content ──────────────────────────────── */}
          {loading ? (
            <div className="text-center py-5">Loading hotel details…</div>
          ) : error ? (
            <div className="alert alert-danger text-center my-4" role="alert">
              {error}
            </div>
          ) : hotelDetails ? (
            <div className="white-bg">
              <div className="hotel-details">
                <ul>
                  <li>
                    <strong>Hotel Name</strong>
                    <span>{hotelDetails.name || 'N/A'}</span>
                  </li>
                  <li>
                    <strong>Location</strong>
                    <span>{hotelDetails.location || 'N/A'}</span>
                  </li>
                  <li>
                    <strong>Hotel Type</strong>
                    <span>{hotelDetails.hotel_type || 'N/A'}</span>
                  </li>
                  <li>
                    <strong>Room Name</strong>
                    <span>{listOrNA(hotelDetails.rooms, 'name')}</span>
                  </li>
                  <li>
                    <strong>Capacity</strong>
                    <span>
                      {listOrNA(
                        hotelDetails.rooms?.map(r => `${r.name} (${r.capacity})`)
                      )}
                    </span>
                  </li>
                  <li>
                    <strong>Rate Category</strong>
                    <span>{listOrNA(hotelDetails.rateCategories, 'name')}</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">No hotel details available.</div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
};

export default HotelAndRoomDetails;
