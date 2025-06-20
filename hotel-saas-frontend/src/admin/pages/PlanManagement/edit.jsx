import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PlanManagementEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: '',
    price: '',
    billing_period: 'monthly',
    features: [{ key: '', value: '' }],
  });

  useEffect(() => {
    fetchPlanDetails();
  }, []);

  const fetchPlanDetails = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status_code === 200) {
        const plan = response.data.results; // ✅ Corrected line

        const featuresArray = plan.features
          ? Object.entries(plan.features).map(([key, value]) => ({ key, value }))
          : [{ key: '', value: '' }];

        setForm({
          name: plan.name || '',
          price: plan.price || '',
          billing_period: plan.billing_period || 'monthly',
          features: featuresArray.length ? featuresArray : [{ key: '', value: '' }],
        });
      } else {
        toast.error('Failed to fetch plan details');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('An unexpected error occurred while loading the plan');
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    const featureObject = {};
    form.features.forEach((f) => {
      if (f.key.trim()) {
        featureObject[f.key] = f.value;
      }
    });

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/plan-management/${id}`,
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

      if (response.data.status_code === 200) {
        toast.success(response.data.message || 'Plan updated successfully');
        navigate('/admin/plan-management');
      } else {
        toast.error(response.data.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('An unexpected error occurred while updating');
    }
  };

  return (
    <div id="content" className="main-content">
      <div className="layout-px-spacing">
        <div className="page-header d-flex justify-content-between">
          <div className="page-title">
            <h3>Edit Plan</h3>
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
                              <div className="col-sm-6">
                                <div className="form-group">
                                  <label>Features</label>
                                  {form.features.map((feature, index) => (
                                    <div key={index} className="row mb-2 align-items-center">
                                      <div className="col-5">
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
                                      <div className="col-5">
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
                                      <div className="col-2">
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
                    <button type="reset" className="btn btn-warning" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Update</button>
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

export default PlanManagementEdit;
