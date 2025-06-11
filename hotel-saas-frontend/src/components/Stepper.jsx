// src/components/Stepper.jsx
import React from 'react';

const Stepper = ({ steps, currentStep }) => {
  return (
    // The "stepform" div and form are handled by SetupWizard, Stepper just renders the progressbar
    <ul id="progressbar">
      {steps.map((step, index) => {
        const isActiveOrCompleted = index <= currentStep;
        let extraClass = '';
        if(index == 0){
          extraClass = 'account';
        }else if(index == 1){
          extraClass = 'personal';

        }else{
          extraClass = 'payment';

        }
        return (
          <li
            key={index}
            className={`${isActiveOrCompleted ? 'active' : 'account'} ${extraClass}`}
            id={step.toLowerCase().replace(/\s/g, '-')}
          >
            <strong>{step}</strong>
          </li>
        );
      })}
    </ul>
  );
};

export default Stepper;