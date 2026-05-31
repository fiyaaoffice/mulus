import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import faviconUrl from './assets/images/logo favicon mulus.jpg';

// Dynamically set favicon to "logo favicon mulus.jpg" processed by Vite
try {
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.type = 'image/jpeg';
  link.rel = 'icon';
  link.href = faviconUrl;
} catch (e) {
  console.error('Failed to inject dynamic favicon:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
