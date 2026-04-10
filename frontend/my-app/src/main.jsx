import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios';
import './index.css'
import App from './App.jsx'
import './App.css'
import './pages/Auth.css';
import './pages/Dashboard.css';
import './pages/Profile.css';
import './pages/AdminResources.css';
import './pages/Resources.css'; 
import { BACKEND_ORIGIN } from './utils/backendUrl';

if (BACKEND_ORIGIN) {
  axios.interceptors.request.use((config) => {
    if (typeof config.url === 'string' && config.url.startsWith('http://localhost:5000')) {
      config.url = config.url.replace('http://localhost:5000', BACKEND_ORIGIN);
    }
    return config;
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
