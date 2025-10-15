import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

const isAdmin = window.location.pathname.startsWith('/admin');

const cssLinks = isAdmin
  ? [
      'https://fonts.googleapis.com/css?family=Quicksand:400,500,600,700&display=swap',
      'https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css',
      '/admin/bootstrap/css/bootstrap.min.css',
      '/admin/assets/css/plugins.css',
      '/admin/assets/css/structure.css',
      '/admin/assets/css/authentication/form-1.css',
      '/admin/assets/css/forms/theme-checkbox-radio.css',
      '/admin/assets/css/forms/switches.css',
      '/admin/assets/css/tables/table-basic.css',
      '/admin/plugins/table/datatable/datatables.css',
      '/admin/plugins/table/datatable/dt-global_style.css',
      '/admin/assets/css/users/account-setting.css',
      '/admin/assets/css/users/user-profile.css',
      '/admin/plugins/select2/select2.min.css',
      '/admin/plugins/dropify/dropify.min.css',
      '/admin/assets/css/components/custom-modal.css',
      '/admin/assets/css/forms/switches.css',
      '/admin/plugins/table/datatable/custom_dt_html5.css',
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
    ]
  : [
      'https://fonts.googleapis.com/css?family=Quicksand:400,500,600,700&display=swap',
      '/user/css/bootstrap.min.css',
      '/user/css/font-awesome.min.css',
      '/user/css/line-awesome.min.css',
      '/user/css/owl.carousel.min.css',
      '/user/css/responsive.css',
      '/user/css/style.css',
    ];

const jsScripts = isAdmin
  ? [
      // Add more admin JS files here if needed
    ]
  : [
      '/user/js/bootstrap.bundle.min.js'
    ];

const loadAssets = (links, scripts, onComplete) => {
  let total = links.length + scripts.length + 1; // +1 for custom inline script
  let loaded = 0;

  const markLoaded = () => {
    loaded++;
    if (loaded === total) onComplete();
  };

  links.forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = markLoaded;
    link.onerror = markLoaded;
    document.head.appendChild(link);
  });

  scripts.forEach((src) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = markLoaded;
    script.onerror = markLoaded;
    document.head.appendChild(script);
  });

  // Add your jQuery toggle script here
  const customScript = document.createElement('script');
  customScript.innerHTML = `
    document.addEventListener('DOMContentLoaded', function () {
      const menuIcon = document.getElementById('menuicon');
      const addClassElem = document.getElementById('addclass');
      if (menuIcon && addClassElem) {
        menuIcon.addEventListener('click', function () {
          addClassElem.classList.toggle('open');
        });
      }
    });
  `;
  document.body.appendChild(customScript);
  markLoaded();
};

document.getElementById('root').style.display = 'none';

loadAssets(cssLinks, jsScripts, () => {
  document.getElementById('root').style.display = 'block';

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
  reportWebVitals();
});
