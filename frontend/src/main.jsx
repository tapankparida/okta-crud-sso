import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { OktaAuth } from '@okta/okta-auth-js';
import { Security } from '@okta/okta-react';
import App from './App.jsx';
import './styles.css';

const oktaAuth = new OktaAuth({
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI || `${window.location.origin}/login/callback`,
  scopes: ['openid', 'profile', 'email'],
  pkce: true
});

function restoreOriginalUri(_oktaAuth, originalUri) {
  window.location.replace(originalUri || '/');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
        <App />
      </Security>
    </BrowserRouter>
  </React.StrictMode>
);
