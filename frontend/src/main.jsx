import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// import { LoadingProvider } from './context/LoadingContext';
import { BrowserRouter } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { GoogleOAuthProvider } from "@react-oauth/google";



ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <React.StrictMode>
    <BrowserRouter>
      {/* <LoadingProvider> */}
        <App />
      {/* </LoadingProvider> */}
    </BrowserRouter>
  </React.StrictMode>
  </GoogleOAuthProvider>

);