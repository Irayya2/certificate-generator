import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';

/**
 * App — Root component with React Router setup.
 * Add new pages here as the application grows.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#0a1628', color: '#e0f0ff', border: '1px solid rgba(0,180,220,0.25)' } }} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Future routes can be added here:
            <Route path="/certificates" element={<CertificateListPage />} />
            <Route path="/certificate/:id" element={<CertificateDetailPage />} />
        */}
      </Routes>
    </BrowserRouter>
  );
}
