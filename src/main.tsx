import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initTelegramApp} from './utils/telegram.ts';

// Initialize Telegram Mini App SDK if loaded inside Telegram
initTelegramApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

