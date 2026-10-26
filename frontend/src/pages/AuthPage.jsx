import React from 'react';

export default function AuthPage({
  showRegister,
  setShowRegister,
  email,
  setEmail,
  password,
  setPassword,
  error,
  setError,
  submitAuth
}) {
  const selectMode = (register) => {
    setShowRegister(register);
    setError('');
    setPassword('');
  };

  return <main className="auth-shell"><section className="auth-card">
    <h1>Task Manager</h1>
    <div className="auth-tabs">
      <button type="button" className={!showRegister ? 'active' : ''} onClick={() => selectMode(false)}>Sign in</button>
      <button type="button" className={showRegister ? 'active' : ''} onClick={() => selectMode(true)}>Register</button>
    </div>
    <form onSubmit={submitAuth} className="auth-form">
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={showRegister ? 'new-password' : 'current-password'} required /></label>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button" type="submit">{showRegister ? 'Create my workspace' : 'Enter workspace'} <span>→</span></button>
    </form>
  </section></main>;
}
