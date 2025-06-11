import React, { useState } from 'react';

const CardDetails = () => {
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    cardNumber: '',
    cvv: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ paymentMethod, ...formData });
    alert('Payment details submitted!');
    // Payment submission logic goes here
  };

  return (
    <div className="billing-heading">
      <h2>Card Details</h2>
      <div className="upgrade-form">
        <form onSubmit={handleSubmit}>
          <div className="form-design">
            <div className="row">
              <div className="col-md-12">
                <div className="form-group">
                  <label className="form-label">Choosing a payment method</label>
                  <div className="radio-design d-flex gap-4">
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id="radio1"
                        name="paymentMethod"
                        value="Stripe"
                        checked={paymentMethod === 'Stripe'}
                        onChange={() => setPaymentMethod('Stripe')}
                      />
                      <label className="form-check-label" htmlFor="radio1">Stripe</label>
                    </div>
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        id="radio2"
                        name="paymentMethod"
                        value="Razorpay"
                        checked={paymentMethod === 'Razorpay'}
                        onChange={() => setPaymentMethod('Razorpay')}
                      />
                      <label className="form-check-label" htmlFor="radio2">Razorpay</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="text"
                    className="form-control"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    type="text"
                    className="form-control"
                    name="cvv"
                    placeholder="CVV"
                    value={formData.cvv}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-md-12">
                <div className="form-group addentry-btn">
                  <button type="submit" className="btn btn-info">Submit</button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardDetails;
