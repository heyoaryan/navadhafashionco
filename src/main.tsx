import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { suppressNonCriticalErrors } from './utils/errorHandler';

// Suppress non-critical console errors
suppressNonCriticalErrors();

// Professional console message
// console.clear(); // Commented out to see any errors
console.log(
  '%c🌸 Navadha Fashion Co 🌸',
  'color: #f43f5e; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);'
);
console.log(
  '%cDeveloper By Aryan',
  'color: #ec4899; font-size: 16px; font-weight: 600; font-style: italic;'
);
console.log(
  '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  'color: #f9a8d4;'
);
console.log('%cWhere Elegance Meets Contemporary Style ✨', 'color: #be185d; font-size: 14px;');

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </HelmetProvider>
    </StrictMode>
  );
}
