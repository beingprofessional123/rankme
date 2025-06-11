import React from 'react';
import checksvg from '../../assets/images/check.svg';
import closesvg from '../../assets/images/close.svg';

const PlanCard = ({ name, price, features, buttonText, buttonType }) => {
  return (
    <div className="col-md-4">
      <div className="subscription-card">
        <div className="subscription-heading">
          <h2>{name}</h2>
          <h6>{price}</h6>
        </div>
        <div className="subscription-desc">
          <ul>
            {features.map((feature, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="subscription-desc-text">{feature.text}</span>
                <span className="subscription-desc-value">
                  {feature.value === 'Yes' ? (
                    <img
                      src={checksvg}
                      className="img-fluid"
                      alt="Included"
                      style={{ width: '20px', height: '20px' }}
                    />
                  ) : feature.value === 'No' ? (
                    <img
                      src={closesvg}
                      className="img-fluid"
                      alt="Not Included"
                      style={{ width: '20px', height: '20px' }}
                    />
                  ) : (
                    feature.value
                  )}
                </span>

              </li>
            ))}
          </ul>
          <button type={buttonType} className="btn btn-info">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
