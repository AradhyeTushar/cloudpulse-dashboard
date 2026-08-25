import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/vps-manage.css';
import './styles/profile.css';
import './styles/billing.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
