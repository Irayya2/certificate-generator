import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// NOTE: React.StrictMode intentionally double-invokes renders and effects in
// development to surface side-effects. Removed here because it was causing
// duplicate POST /api/generate requests that restarted the Render service.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
