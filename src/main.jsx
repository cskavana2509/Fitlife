import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,.96)',
              color: '#0f172a',
              border: '1px solid rgba(148,163,184,.28)',
              boxShadow: '0 12px 36px rgba(15,23,42,.12)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#0f766e', secondary: '#ffffff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);