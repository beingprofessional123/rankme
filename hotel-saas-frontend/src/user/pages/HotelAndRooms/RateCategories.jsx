// src/pages/SetupWizard/RateCategories.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RateCategories = ({ hotelId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState({});

  const token = localStorage.getItem('token');

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

        const fetchedCategories = response.data.rate_categories || [];

        if (fetchedCategories.length > 0) {
          const mappedCategories = fetchedCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
          }));
          setCategories(mappedCategories);
        } else {
          setCategories([{ id: Date.now(), name: '' }]); // default empty
        }
      } catch (error) {
        console.error('Failed to fetch rate categories:', error);
        setCategories([{ id: Date.now(), name: '' }]); // fallback
      }
    };

    if (hotelId) {
      fetchRateCategories();
    }
  }, [hotelId, token]);

  const handleAdd = () => {
    setCategories([...categories, { id: Date.now(), name: '' }]);
  };

  const handleRemove = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this category?');
    if (!confirmDelete) return;

    const isUUID = typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id);

    if (isUUID) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/delete-rate-categories`,
          {
            hotel_id: hotelId,
            category_ids: [id],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
      } catch (error) {
        console.error('Failed to delete rate category:', error);
        toast.error('Failed to delete category. Please try again.');
      }
    } else {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }

    setApiErrors((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleChange = (id, value) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, name: value } : cat
      )
    );
    setApiErrors((prev) => ({ ...prev, [id]: null })); // Clear error for this field
  };

  const handleSubmit = async () => {
    setLoading(true);
    setApiErrors({});

    if (!token || !hotelId) {
      toast.warning('Missing token or hotel ID.');
      setLoading(false);
      return;
    }

    const newErrors = {};
    categories.forEach((cat) => {
      if (!cat.name.trim()) {
        newErrors[cat.id] = 'Please enter a category name.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setApiErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        hotel_id: hotelId,
        categories: categories.map(cat => ({
            id: typeof cat.id === 'string' && /^[0-9a-fA-F-]{36}$/.test(cat.id) ? cat.id : null, // Send existing ID or null for new
            name: cat.name
        })),
      };

      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/rate-categories`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.dispatchEvent(new CustomEvent('step:next'));
    } catch (error) {
      console.error('API error:', error);
      if (error.response?.data?.errors) {
        // If backend returns errors by index or field, map them back.
        // Assuming backend might return { "categories.0.name": ["The name field is required."] }
        const validationErrors = error.response.data.errors;
        const newApiErrors = {};
        Object.keys(validationErrors).forEach(key => {
            if (key.startsWith('categories.')) {
                const index = parseInt(key.split('.')[1]);
                if (!isNaN(index) && categories[index]) {
                    newApiErrors[categories[index].id] = validationErrors[key][0];
                }
            } else {
                // Handle general errors if any
                toast.warning(validationErrors[key][0]);
            }
        });
        setApiErrors(newApiErrors);
      } else {
        toast.error('Failed to submit rate categories.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <fieldset>
      <div className="form-design">
        {categories.map((category, index) => (
          <div key={category.id} className="form-group">
            <label className="form-label">Category Name</label>
            <div className="addbtn">
              <input
                type="text"
                className={`form-control ${apiErrors[category.id] ? 'is-invalid' : ''}`}
                value={category.name}
                onChange={(e) => handleChange(category.id, e.target.value)}
                placeholder={`Category ${index + 1}`}
              />
              {categories.length > 1 && ( // Only show delete if there's more than one category
                <button
                  type="button"
                  className="btn btn-add deletebtn"
                  onClick={() => handleRemove(category.id)}
                  title="Delete Category"
                >
                  <img src={`/user/images/delete.svg`} className="img-fluid" alt="Delete" />
                </button>
              )}
              {/* Only show add button on the last item if there's more than one, or if it's the only item */}
              {(index === categories.length - 1 || categories.length === 0) && (
                  <button
                      type="button"
                      className="btn btn-add"
                      onClick={handleAdd}
                      title="Add New Category"
                  >
                      <img src={`/user/images/add.svg`} className="img-fluid" alt="Add" />
                  </button>
              )}
            </div>
            {apiErrors[category.id] && (
              <div className="invalid-feedback d-block">{apiErrors[category.id]}</div>
            )}
          </div>
        ))}
      </div>
      <input type="button" name="next" className="next action-button" value={loading ? 'Saving...' : 'Next'} onClick={handleSubmit} disabled={loading} />
      <input type="button" name="previous" className="previous action-button-previous" value="Previous" onClick={() => window.dispatchEvent(new CustomEvent('step:back'))} />
    </fieldset>
  );
};

export default RateCategories;