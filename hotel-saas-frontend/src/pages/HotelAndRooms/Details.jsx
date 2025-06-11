// src/pages/HotelAndRooms/details.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams to get ID from URL
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify'; // For notifications

const HotelAndRoomDetails = () => {
  const { id } = useParams(); // Get the hotel ID from the URL parameter
  const [hotelDetails, setHotelDetails] = useState(null); // Will store fetched details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHotelDetails = useCallback(async () => {
    if (!id) {
      setError('Hotel ID is missing from the URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/${id}`; // API call with ID

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the bearer token
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hotel details.');
      }

      const data = await response.json();
      setHotelDetails(data.hotel); // Assuming your API returns { message: '...', hotel: { ... } }
      toast.success(data.message || 'Hotel details loaded successfully!');
    } catch (err) {
      console.error('Error fetching hotel details:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to load hotel details.');
    } finally {
      setLoading(false);
    }
  }, [id]); // Re-run if ID changes

  useEffect(() => {
    fetchHotelDetails();
  }, [fetchHotelDetails]);


  // Helper function to format keys for display (e.g., hotelName -> Hotel Name)
  const formatKey = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-100 min-h-screen">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-500">Home</span>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-800">Hotel & Room Details</span>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hotel & Room Details</h1>

        {/* Loading, Error, or Details Card */}
        {loading ? (
          <div className="text-center py-8">Loading hotel details...</div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-3xl mx-auto" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        ) : hotelDetails ? (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
            <dl className="divide-y divide-gray-200">
              {/* Hotel Name */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center">
                <dt className="w-48 text-sm font-medium text-gray-700 capitalize sm:mb-0 mb-2">Hotel Name</dt>
                <dd className="flex-1 text-sm text-gray-900 sm:mt-0 sm:ml-4">{hotelDetails.name}</dd>
              </div>

              {/* Location */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center">
                <dt className="w-48 text-sm font-medium text-gray-700 capitalize sm:mb-0 mb-2">Location</dt>
                <dd className="flex-1 text-sm text-gray-900 sm:mt-0 sm:ml-4">{hotelDetails.location}</dd>
              </div>

              {/* Hotel Type */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center">
                <dt className="w-48 text-sm font-medium text-gray-700 capitalize sm:mb-0 mb-2">Hotel Type</dt>
                <dd className="flex-1 text-sm text-gray-900 sm:mt-0 sm:ml-4">{hotelDetails.hotel_type}</dd>
              </div>

              {/* Room Categories/Names (from RoomType) */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-start"> {/* Use items-start if content can be long */}
                <dt className="w-48 text-sm font-medium text-gray-700 capitalize sm:mb-0 mb-2">Room Name</dt>
                <dd className="flex-1 text-sm text-gray-900 sm:mt-0 sm:ml-4">
                  {hotelDetails.rooms && hotelDetails.rooms.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {hotelDetails.rooms.map(room => (
                        <li key={room.id}>{room.name} (Capacity: {room.capacity})</li>
                      ))}
                    </ul>
                  ) : (
                    'No room types available.'
                  )}
                </dd>
              </div>

              {/* Capacity (can be aggregated or per room type) */}
              {/* If "Capacity" from the screenshot is a single aggregated value,
                  you'll need to calculate it here or have the backend provide it.
                  If it refers to individual room capacities, it's covered above.
                  For now, I'm displaying individual room capacities under "Room Name".
                  If you want a separate "Capacity" field like in the screenshot,
                  you'll need to define what that means (e.g., total capacity, or first room's capacity)
                  and fetch/calculate it.
              */}
               <div className="py-4 flex flex-col sm:flex-row sm:items-start">
                <dt className="w-48 text-sm font-medium text-gray-700 capitalize sm:mb-0 mb-2">Rate Categories</dt>
                <dd className="flex-1 text-sm text-gray-900 sm:mt-0 sm:ml-4">
                  {hotelDetails.rateCategories && hotelDetails.rateCategories.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {hotelDetails.rateCategories.map(rate => (
                        <li key={rate.id}>
                          <strong>{rate.name}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'No rate categories available.'
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No hotel details available.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HotelAndRoomDetails;