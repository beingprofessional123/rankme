import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import your new CSS files
import './assets/css/bootstrap.min.css';
import './assets/css/font-awesome.min.css';
import './assets/css/line-awesome.min.css';
// import './assets/css/owl.carousel.min.css'; // If you're using owl carousel globally
import './assets/css/responsive.css';
import './assets/css/style.css'; // Your main style file

import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
