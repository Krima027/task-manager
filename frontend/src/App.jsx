import React, { lazy, Suspense, useCallback, useState } from 'react';
import { loginUser, registerUser } from './components/api';
import './index.css';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');

  const submitAuth = async (event) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const json = showRegister
        ? await registerUser(normalizedEmail, password)
        : await loginUser(normalizedEmail, password);
      if (!json.token || !json.user?.email) {
        throw new Error('The server returned an invalid authentication response.');
      }
      localStorage.setItem('token', json.token);
      localStorage.setItem('userEmail', json.user.email);
      setToken(json.token);
      setEmail(json.user.email);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Cannot connect to the task server.');
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setToken(null);
    setEmail('');
    setPassword('');
    setShowRegister(false);
    setError('');
  }, []);

  if (token) {
    return <Suspense fallback={<main className="app-shell"><div className="app-frame"><p className="empty-state" role="status">Loading your workspace...</p></div></main>}>
      <Dashboard onLogout={handleLogout} />
    </Suspense>;
  }

  return <Suspense fallback={<main className="auth-shell"><section className="auth-card"><p className="empty-state" role="status">Loading sign in...</p></section></main>}>
    <AuthPage
      showRegister={showRegister}
      setShowRegister={setShowRegister}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      error={error}
      setError={setError}
      submitAuth={submitAuth}
    />
  </Suspense>;
}
