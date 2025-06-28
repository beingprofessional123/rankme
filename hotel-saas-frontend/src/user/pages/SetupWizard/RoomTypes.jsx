// src/pages/SetupWizard/RoomTypes.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const RoomTypes = ({ hotelId }) => {
  const [rooms, setRooms] = useState([{ name: '', capacity: '', rateCategoryId: '', roomTypeId: null }]);
  const [errors, setErrors] = useState([]); // Array of error objects, one per room
  const [rateCategories, setRateCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // Fetch rate categories
  useEffect(() => {
    const fetchRateCategories = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/get-rate-categories?hotel_id=${hotelId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setRateCategories(response.data.rate_categories || []);
      } catch (error) {
        console.error('Failed to fetch rate categories:', error);
      }
    };

    if (hotelId) {
      fetchRateCategories();
    }
  }, [hotelId, token]);

  // Fetch existing room types
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/get-room-types?hotel_id=${hotelId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const existingRooms = response.data.room_types;

        if (existingRooms && existingRooms.length > 0) {
          const mappedRooms = existingRooms.map((room) => ({
            name: room.name || '',
            capacity: room.capacity?.toString() || '',
            rateCategoryId: room.rate_category_id || '',
            roomTypeId: room.id || null, // Store existing room ID
          }));

          setRooms(mappedRooms);
          setErrors(new Array(mappedRooms.length).fill({}));
        } else {
          setRooms([{ name: '', capacity: '', rateCategoryId: '', roomTypeId: null }]);
          setErrors([{}]);
        }
      } catch (error) {
        console.error('Failed to fetch room types:', error);
        setRooms([{ name: '', capacity: '', rateCategoryId: '', roomTypeId: null }]);
        setErrors([{}]);
      }
    };

    if (hotelId) {
      fetchRoomTypes();
    }
  }, [hotelId, token]);


  // Handle input changes
  const handleChange = (index, field, value) => {
    const updatedRooms = [...rooms];
    updatedRooms[index][field] = value;
    setRooms(updatedRooms);

    // Clear the specific field error on change
    const updatedErrors = [...errors];
    if (!updatedErrors[index]) updatedErrors[index] = {}; // Ensure the error object exists
    updatedErrors[index][field] = ''; // Clear specific field error
    setErrors(updatedErrors);
  };

  // Add a new room
  const addRoom = () => {
    setRooms([...rooms, { name: '', capacity: '', rateCategoryId: '', roomTypeId: null }]);
    setErrors([...errors, {}]); // Add an empty error object for the new room
  };

  // Remove a room
  const handleRemoveRoom = async (index, id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this room type?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    const isUUID = typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id);

    if (isUUID) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/delete-room-types`,
          {
            hotel_id: hotelId,
            room_type_id: [id], // must be array
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        Swal.fire('Deleted!', 'Room type has been deleted.', 'success');
      } catch (error) {
        console.error('Failed to delete room type:', error);
        Swal.fire('Error', 'Failed to delete room type. Please try again.', 'error');
        setLoading(false);
        return;
      }
    }

    // Remove from local state (whether saved or unsaved)
    setRooms((prevRooms) => prevRooms.filter((_, i) => i !== index));
    setErrors((prevErrors) => prevErrors.filter((_, i) => i !== index));
    setLoading(false);
  };

  // Validate inputs before submit
  const validateRooms = () => {
    let isValid = true;
    const newErrors = rooms.map((room) => {
      const roomErrors = {};
      if (!room.name.trim()) {
        roomErrors.name = 'Please enter a room name.';
        isValid = false;
      }
      if (!room.capacity || isNaN(room.capacity) || Number(room.capacity) <= 0) {
        roomErrors.capacity = 'Capacity must be a number greater than 0.';
        isValid = false;
      }
      if (!room.rateCategoryId) {
        roomErrors.rateCategoryId = 'Please select a rate category.';
        isValid = false;
      }
      return roomErrors;
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSaveRooms = async (navigateToNextStep = false) => {
    if (!validateRooms()) return false;
    setLoading(true);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/room-types`,
        {
          hotel_id: hotelId,
          rooms: rooms.map((room) => ({
            id: room.roomTypeId || null, // Pass ID for existing rooms, null for new
            name: room.name,
            capacity: Number(room.capacity),
            rate_category_id: room.rateCategoryId,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      localStorage.removeItem("hotel_info"); // Clear hotel info after final save

      if (navigateToNextStep) {
        window.dispatchEvent(new CustomEvent('step:next'));
        window.location.reload(); // Reload to refresh dashboard data if needed
      }
      return true;
    } catch (error) {
      console.error('Room submission failed:', error);
      if (error.response?.data?.errors) {
        const apiValidationErrors = error.response.data.errors;
        const newErrorsState = rooms.map((room, index) => {
          const currentRoomErrors = {};
          // Assuming API errors might be structured like { "rooms.0.name": ["error message"] }
          for (const key in apiValidationErrors) {
            if (key.startsWith(`rooms.${index}.`)) {
              const field = key.split('.')[2];
              currentRoomErrors[field] = apiValidationErrors[key][0];
            }
          }
          return currentRoomErrors;
        });
        setErrors(newErrorsState);
      } else {
        toast.error('Failed to save room types. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    const success = await handleSaveRooms(true); // true means navigate after save
    if (success) {
      window.location.href = '/dashboard'; // Redirect to dashboard
    }
  };

  return (
    <fieldset>
      <div className="form-design">
        {rooms.map((room, index) => (
          <div key={index} className="room-entry mb-4"> {/* Use a distinct class for room entries */}
            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Room Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors[index]?.name ? 'is-invalid' : ''}`}
                    value={room.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    placeholder="Room Name"
                  />
                  {errors[index]?.name && (
                    <div className="invalid-feedback d-block">{errors[index].name}</div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    className={`form-control ${errors[index]?.capacity ? 'is-invalid' : ''}`}
                    value={room.capacity}
                    onChange={(e) => handleChange(index, 'capacity', e.target.value)}
                    placeholder="Capacity"
                  />
                  {errors[index]?.capacity && (
                    <div className="invalid-feedback d-block">{errors[index].capacity}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Rate Category</label>
              <div className="addbtn"> {/* This contains the select and the action button */}
                <select
                  className={`form-select form-control ${errors[index]?.rateCategoryId ? 'is-invalid' : ''}`}
                  value={room.rateCategoryId}
                  onChange={(e) => handleChange(index, 'rateCategoryId', e.target.value)}
                >
                  <option value="" disabled>Select Rate Category</option>
                  {rateCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {rooms.length > 1 && ( // Only show delete if there's more than one room entry
                  <button
                    type="button"
                    className="btn btn-add deletebtn"
                    onClick={() => handleRemoveRoom(index, room.roomTypeId)}
                    title="Remove Room"
                  >
                    <img src={`/user/images/delete.svg`} className="img-fluid" alt="Remove" />
                  </button>
                )}
                {/* Add button should only be on the last item, or if it's the only item */}
                {(index === rooms.length - 1 || rooms.length === 0) && (
                  <button
                    type="button"
                    className="btn btn-add"
                    onClick={addRoom}
                    title="Add New Room Type"
                  >
                    <img src={`/user/images/add.svg`} className="img-fluid" alt="Add" />
                  </button>
                )}
              </div>
              {errors[index]?.rateCategoryId && (
                <div className="invalid-feedback d-block">{errors[index].rateCategoryId}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <input type="button" name="next" className="next action-button" value={loading ? 'Saving...' : 'Finish'} onClick={handleFinish} disabled={loading} />
      <input type="button" name="next" className="next action-button savebtn" value={loading ? 'Saving...' : 'Save & Add New'} onClick={() => handleSaveRooms(false)} disabled={loading} />
      <input type="button" name="previous" className="previous action-button-previous" value="Previous" onClick={() => window.dispatchEvent(new CustomEvent('step:back'))} />
    </fieldset>
  );
};

export default RoomTypes;