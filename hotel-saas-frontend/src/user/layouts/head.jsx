import React from 'react';
import { Helmet } from 'react-helmet';

const Head = () => {
  return (
    <Helmet>
      {/* Google Font (optional) */}
      <link
        href="https://fonts.googleapis.com/css?family=Quicksand:400,500,600,700&display=swap"
        rel="stylesheet"
      />

      {/* CSS Files */}
      <link rel="stylesheet" href="/user/css/bootstrap.min.css" />
      <link rel="stylesheet" href="/user/css/font-awesome.min.css" />
      <link rel="stylesheet" href="/user/css/line-awesome.min.css" />
      {/* <link rel="stylesheet" href="/user/css/owl.carousel.min.css" /> */}
      <link rel="stylesheet" href="/user/css/responsive.css" />
      <link rel="stylesheet" href="/user/css/style.css" />

      {/* Bootstrap Bundle JS (optional, only if needed in <head>) */}
      <script src="/user/js/bootstrap.bundle.min.js"></script>
    </Helmet>
  );
};

export default Head;
