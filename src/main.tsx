import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler to show errors even if React fails to mount
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<div style="padding:24px;color:#ff4444;font-family:monospace;background:#000;min-height:100vh"><h2>Runtime Error</h2><pre style="white-space:pre-wrap;font-size:12px">${event.message}\n${event.filename}:${event.lineno}</pre></div>`;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const root = document.getElementById('root');
  if (root && root.childElementCount === 0) {
    root.innerHTML = `<div style="padding:24px;color:#ff4444;font-family:monospace;background:#000;min-height:100vh"><h2>Unhandled Promise Rejection</h2><pre style="white-space:pre-wrap;font-size:12px">${String(event.reason)}</pre></div>`;
  }
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  createRoot(rootElement).render(<App />);
} catch (e) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding:24px;color:#ff4444;font-family:monospace;background:#000;min-height:100vh"><h2>Mount Error</h2><pre style="white-space:pre-wrap;font-size:12px">${String(e)}</pre></div>`;
  }
}
