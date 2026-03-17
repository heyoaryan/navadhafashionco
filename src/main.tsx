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
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function showConsoleIntro() {
  console.clear();

  await sleep(200);
  console.log(
    '%c  🌸 NAVADHA FASHION CO 🌸  ',
    `
      color: #fff;
      background: linear-gradient(90deg, #f43f5e, #ec4899, #f43f5e);
      font-size: 22px;
      font-weight: 900;
      font-family: Georgia, serif;
      letter-spacing: 0.2em;
      padding: 12px 24px;
      border-radius: 12px;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.3);
    `
  );

  await sleep(400);
  console.log(
    '%c✦  Where Elegance Meets Contemporary Style  ✦',
    'color: #be185d; font-size: 13px; font-style: italic; letter-spacing: 0.1em;'
  );

  await sleep(400);
  console.log(
    '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'color: #f9a8d4; font-size: 10px;'
  );

  await sleep(300);
  console.log(
    '%c👨‍💻  Developed by  %cAryan',
    'color: #9ca3af; font-size: 13px; font-weight: 400;',
    `
      color: #f43f5e;
      font-size: 15px;
      font-weight: 800;
      font-family: Georgia, serif;
      letter-spacing: 0.15em;
      text-shadow: 0 0 8px rgba(244,63,94,0.5);
    `
  );

  await sleep(300);
  console.log(
    '%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'color: #f9a8d4; font-size: 10px;'
  );

  await sleep(200);
  console.log(
    '%c⚠️  Hey curious dev! Nothing to see here 😄',
    'color: #6b7280; font-size: 11px; font-style: italic;'
  );
}

showConsoleIntro();

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
