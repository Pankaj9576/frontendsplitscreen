import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Set Webpack publicPath at runtime
__webpack_public_path__ = process.env.PUBLIC_URL || '/';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="268682723072-vpvr0q9dri3jdis5pl5be4b2fva5vdqp.apps.googleusercontent.com">
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
);