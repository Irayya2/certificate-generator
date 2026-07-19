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
      <Toaster position="top-right" toastOptions={{ style: { background: '#102016', color: '#eaffef', border: '1px solid #3a7049' } }} />
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
