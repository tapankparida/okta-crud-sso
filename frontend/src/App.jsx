import { LoginCallback, useOktaAuth } from '@okta/okta-react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProductManager from './components/ProductManager.jsx';

function Home() {
  const { authState, oktaAuth } = useOktaAuth();

  if (!authState) {
    return <main className="app-shell">Loading...</main>;
  }

  if (authState.isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  return (
    <main className="landing">
      <section className="landing-copy">
        <p className="eyebrow">Okta SSO + Spring Boot</p>
        <h1>Product Manager</h1>
        <p>
          Sign in with Okta to create, edit, and remove products through a secured
          Spring Boot API.
        </p>
        <button className="primary-button" type="button" onClick={() => oktaAuth.signInWithRedirect()}>
          Sign in with Okta
        </button>
      </section>
    </main>
  );
}

function RequireAuth({ children }) {
  const { authState, oktaAuth } = useOktaAuth();

  if (!authState) {
    return <main className="app-shell">Loading...</main>;
  }

  if (!authState.isAuthenticated) {
    oktaAuth.signInWithRedirect({ originalUri: window.location.pathname });
    return <main className="app-shell">Redirecting...</main>;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login/callback" element={<LoginCallback />} />
      <Route path="/products" element={<RequireAuth><ProductManager /></RequireAuth>} />
    </Routes>
  );
}
