import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PlanManagementCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    price: '',
    billing_period: 'monthly',
    features: [{ key: '', value: '' }], // array of key-value pairs
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    // Convert feature array to object
    const featureObject = {};
    form.features.forEach((f) => {
      if (f.key.trim()) {
        featureObject[f.key] = f.value;
      }
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management`,
        {
          name: form.name,
          price: parseFloat(form.price),
          billing_period: form.billing_period,
          features: featureObject,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status_code === 201) {
        toast.success(response.data.message || 'Plan created successfully');
        navigate('/admin/plan-management');
      } else {
        toast.error(response.data.message || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div>
      <div className="layout-px-spacing">
        <div className="page-header d-flex justify-content-between">
          <div className="page-title">
            <h3>Create Plan</h3>
          </div>
          <div className="page-title page-btn">
            <Link className="btn btn-primary" to="/admin/plan-management">
              Back
            </Link>
          </div>
        </div>

        <div className="account-settings-container layout-top-spacing">
          <div className="layout-spacing">
            <div className="general-info section general-infomain">
              <form onSubmit={handleSubmit}>
                <div className="account-content mt-2 mb-2">
                  <div className="scrollspy-example" data-spy="scroll" data-target="#account-settings-scroll" data-offset="-100">
                    <div className="row">
                      <div className="col-xl-12 col-lg-12 col-md-12 layout-spacing">
                        <div className="section general-info">
                          <div className="info">
                            <div className="user-management-title">
                              <h4>Plan Details</h4>
                            </div>
                            <div className="row">
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label>Name</label>
                                  <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label>Price (₹)</label>
                                  <input
                                    type="number"
                                    name="price"
                                    className="form-control"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label>Billing Period</label>
                                  <select
                                    name="billing_period"
                                    className="form-control"
                                    value={form.billing_period}
                                    onChange={handleChange}
                                    required
                                  >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                  </select>
                                </div>
                              </div>

                              {/* Features */}
                              <div className="col-md-12">
                                <div className="form-group">
                                  <label>Features</label>
                                  {form.features.map((feature, index) => (
                                    <div key={index} className="row mb-2 align-items-center">
                                      <div className="col-md-5 mb-2">
                                        <input
                                          type="text"
                                          className="form-control"
                                          placeholder="Feature Key"
                                          value={feature.key}
                                          onChange={(e) => {
                                            const updated = [...form.features];
                                            updated[index].key = e.target.value;
                                            setForm((prev) => ({ ...prev, features: updated }));
                                          }}
                                          required
                                        />
                                      </div>
                                      <div className="col-md-5 mb-2">
                                        <input
                                          type="text"
                                          className="form-control"
                                          placeholder="Feature Value"
                                          value={feature.value}
                                          onChange={(e) => {
                                            const updated = [...form.features];
                                            updated[index].value = e.target.value;
                                            setForm((prev) => ({ ...prev, features: updated }));
                                          }}
                                          required
                                        />
                                      </div>
                                      <div className="col-md-2 mb-2">
                                        <button
                                          type="button"
                                          className="btn btn-warning"
                                          onClick={() => {
                                            const updated = [...form.features];
                                            updated.splice(index, 1);
                                            setForm((prev) => ({
                                              ...prev,
                                              features: updated.length ? updated : [{ key: '', value: '' }],
                                            }));
                                          }}
                                          disabled={form.features.length === 1}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="page-btn mt-2">
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() =>
                                        setForm((prev) => ({
                                          ...prev,
                                          features: [...prev.features, { key: '', value: '' }],
                                        }))
                                      }
                                    >
                                      Add Feature
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {/* End Features */}

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="account-settings-footer">
                  <div className="as-footer-container">
                    <button type="reset" className="btn btn-warning">Reset All</button>
                    <button type="submit" className="btn btn-primary">Create</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanManagementCreate;
