// src/pages/SetupWizard/HotelInfo.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const HotelInfo = ({ onHotelCreated }) => {
  const [hotelID, setHotelID] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [location, setLocation] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [hotelType, setHotelType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const savedHotelData = JSON.parse(localStorage.getItem('hotel_info'));
    if (savedHotelData) {
      setHotelID(savedHotelData.hotel_id || '');
      setHotelName(savedHotelData.name || '');
      setLocation(savedHotelData.location || '');
      setHotelType(savedHotelData.hotel_type || '');
      setTotalRooms(savedHotelData.total_rooms || '');
    }
  }, []);

  const handleCreateHotel = async () => {
    setLoading(true);
    setErrors({}); // Clear previous errors
    const newErrors = {};
    
    if (!hotelName.trim()) {
      newErrors.name = 'Please enter a hotel name.';
    } else if (!/[a-zA-Z]/.test(hotelName)) {
      newErrors.name = 'Hotel name must contain at least one letter.';
    }
    if (!location.trim()) newErrors.location = 'Please enter a location.';
    if (!hotelType.trim()) newErrors.hotel_type = 'Please select a hotel type.';
    if (!totalRooms.trim()) newErrors.totalRooms = 'Please enter total numbers of rooms';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const company_id = user?.company?.id;
    
      if (!token || !company_id) {
        toast.warning('Missing token or company information. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/hotels`,
        {
          name: hotelName,
          location,
          hotel_type: hotelType,
          company_id,
          hotel_id: hotelID, // This might be null for new hotels, but included for consistency
          total_rooms:totalRooms,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // localStorage.setItem(
      //   'hotel_info',
      //   JSON.stringify({
      //     hotel_id: response.data.hotel.id,
      //     name: hotelName,
      //     location,
      //     hotel_type: hotelType,
      //     total_rooms:totalRooms
      //   })
      // );
      // navigate('/dashboard');
      window.location.href = '/dashboard';
      
      // onHotelCreated(response.data); // Proceed to next step
    } catch (error) {
      console.error('Error creating hotel:', error);
      if (error.response?.status === 400 || error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        toast.error('Failed to create hotel. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <fieldset> {/* This fieldset aligns with the HTML structure for each step */}
      <div className="form-design">
        <div className="form-group">
          <label className="form-label">Hotel Name</label>
          <input
            type="text"
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            placeholder="Hotel Name"
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input
            type="text"
            className={`form-control ${errors.location ? 'is-invalid' : ''}`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
          />
          {errors.location && <div className="invalid-feedback">{errors.location}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Hotel Type</label>
          <select
            className={`form-select form-control ${errors.hotel_type ? 'is-invalid' : ''}`}
            value={hotelType}
            onChange={(e) => setHotelType(e.target.value)}
          >
            <option value="">Select Hotel Type</option>
            <option value="resort">Resort</option>
            <option value="business">Business</option>
            <option value="boutique">Boutique</option>
            <option value="budget">Budget</option>
          </select>
          {errors.hotel_type && <div className="invalid-feedback">{errors.hotel_type}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Total Room</label>
          <input
            type="number"
            min="0"
            className={`form-control ${errors.totalRooms ? 'is-invalid' : ''}`}
            value={totalRooms}
            onChange={(e) => setTotalRooms(e.target.value)}
            placeholder="Enter total rooms"
            inputMode="numeric"
          />
          {errors.totalRooms && <div className="invalid-feedback">{errors.totalRooms}</div>}
        </div>
      </div>
      <input
        type="button"
        name="next"
        className="next action-button"
        value={loading ? 'Saving...' : 'Next'}
        onClick={handleCreateHotel}
        disabled={loading}
      />
    </fieldset>
  );
};

export default HotelInfo;