import React from 'react';
import { Helmet } from 'react-helmet';

const Head = () => {
  return (
    <Helmet>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css?family=Quicksand:400,500,600,700&display=swap"
        rel="stylesheet"
      />

      {/* CSS from /public folder */}
      <link rel="stylesheet" href="/admin/bootstrap/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/admin/assets/css/plugins.css" />
      <link rel="stylesheet" href="/admin/assets/css/structure.css" />
      <link rel="stylesheet" href="/admin/assets/css/authentication/form-1.css" />
      <link rel="stylesheet" href="/admin/assets/css/forms/theme-checkbox-radio.css" />
      <link rel="stylesheet" href="/admin/assets/css/forms/switches.css" />
      <link rel="stylesheet" href="/admin/assets/css/tables/table-basic.css" />
      <link rel="stylesheet" href="/admin/plugins/table/datatable/datatables.css" />
      <link rel="stylesheet" href="/admin/plugins/table/datatable/dt-global_style.css" />
      <link rel="stylesheet" href="/admin/assets/css/users/account-setting.css" />
      <link rel="stylesheet" href="/admin/assets/css/users/user-profile.css" />
      <link rel="stylesheet" href="/admin/plugins/select2/select2.min.css" />
      <link rel="stylesheet" href="/admin/plugins/dropify/dropify.min.css" />
      <link rel="stylesheet" href="/admin/assets/css/components/custom-modal.css" />
      <link rel="stylesheet" href="/admin/assets/css/forms/switches.css" />
      <link rel="stylesheet" href="/admin/plugins/table/datatable/custom_dt_html5.css" />

      {/* Font Awesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      />

    </Helmet>
  );
};

export default Head;
