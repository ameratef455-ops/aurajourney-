import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import App from './App.tsx';
import './index.css';

// Global error handlers to capture more details for "Script error"
window.addEventListener('error', (event) => {
  console.log('Global Error Event:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack || event.error,
    target: event.target
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled Rejection Event:', {
    reason: event.reason?.stack || event.reason,
    promise: event.promise
  });
});

createRoot(document.getElementById('root')!).render(
  <PrimeReactProvider>
    <App />
  </PrimeReactProvider>,
);
