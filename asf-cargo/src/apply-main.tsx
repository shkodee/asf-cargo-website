import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ApplyPage from './pages/ApplyPage';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplyPage />
  </StrictMode>
);
