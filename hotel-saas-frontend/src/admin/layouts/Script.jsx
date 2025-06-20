/* global $ */
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Script = () => {
  const location = useLocation(); // 🚨 detect route change

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Remove existing script if any
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const loadAllScripts = async () => {
      try {
        await loadScript('/admin/assets/js/libs/jquery-3.1.1.min.js');
        await loadScript('/admin/bootstrap/js/popper.min.js');
        await loadScript('/admin/bootstrap/js/bootstrap.min.js');
        await loadScript('/admin/assets/js/app.js');
        await loadScript('/admin/assets/js/custom.js');
        await loadScript('/admin/plugins/highlight/highlight.pack.js');
        await loadScript('/admin/assets/js/scrollspyNav.js');
        await loadScript('/admin/plugins/select2/select2.min.js');
        await loadScript('/admin/plugins/dropify/dropify.min.js');
        await loadScript('/admin/plugins/blockui/jquery.blockUI.min.js');
        await loadScript('/admin/assets/js/users/account-settings.js');
        await loadScript('/admin/plugins/table/datatable/datatables.js');
        await loadScript('/admin/plugins/blockui/custom-blockui.js');
        await loadScript('/admin/plugins/sweetalerts/sweetalert2.min.js');
        await loadScript('/admin/plugins/sweetalerts/custom-sweetalert.js');

        // jQuery init
        if (window.$) {
          $('[data-toggle="tooltip"]').tooltip();
          $('#navbtn')?.on('click', function () {
            $(this).toggleClass('change');
            $('.submenu-sidebar').toggleClass('blue');
          });
        }
      } catch (error) {
        console.error('Script load error:', error);
      }
    };

    loadAllScripts();
  }, [location.pathname]); // 🔁 re-run on every route change

  return null;
};

export default Script;
