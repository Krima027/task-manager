import React, { useEffect, useState } from 'react';
import { createTask, deleteTask, getTasks, resetPassword, updateTask } from './components/api';
import './index.css';

const statuses = [
  { key: 'pending', label: 'Pending', hint: 'Not started yet' },
  { key: 'ongoing', label: 'Ongoing', hint: 'Currently in progress' },
  { key: 'complete', label: 'Complete', hint: 'Finished tasks' }
];

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    getTasks().then((json) => {
      if (json.success) setTasks(json.data);
      else setError(json.message || 'Unable to load your tasks.');
    }).catch(() => setError('Cannot connect to the task server.')).finally(() => setIsLoading(false));
  }, [token]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setError(''); setSuccess('');
    if (showForgotPassword) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      try {
        const json = await resetPassword(email, password);
        setShowForgotPassword(false); setShowRegister(false); setPassword(''); setConfirmPassword('');
        setSuccess(json.message);
      } catch (err) { setError(err.message || 'Could not reset your password.'); }
      return;
    }
    const endpoint = showRegister ? 'register' : 'login';
    try {
      const response = await fetch(`http://localhost:5000/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Authentication failed');
      localStorage.setItem('token', json.token);
      localStorage.setItem('userEmail', json.user.email);
      setToken(json.token); setEmail(json.user.email); setPassword(''); setTasks([]);
    } catch (err) { setError(err.message || 'Cannot connect to the task server.'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('userEmail');
    setToken(null); setTasks([]); setEmail('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || isCreating) return;
    setIsCreating(true);
    try {
      const json = await createTask({ title, status: 'pending' });
      setTasks((current) => [json.data, ...current]); setNewTaskTitle(''); setError('');
    } catch (err) { setError(err.message || 'Could not create task.'); }
    finally { setIsCreating(false); }
  };

  const changeStatus = async (task, status) => {
    if (status === task.status || (!task.status && status === 'pending')) return;
    try {
      const json = await updateTask(task._id, { title: task.title, status });
      if (!json.success) throw new Error(json.message || 'Could not update task.');
      setTasks((current) => current.map((item) => item._id === task._id ? json.data : item));
    } catch (err) { setError(err.message || 'Could not update task.'); }
  };

  const cycleStatus = (task) => {
    const currentStatus = task.status || (task.completed ? 'complete' : 'pending');
    const currentIndex = statuses.findIndex((status) => status.key === currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length].key;
    changeStatus(task, nextStatus);
  };

  const handleDelete = async (id) => {
    try {
      const json = await deleteTask(id);
      if (!json.success) throw new Error(json.message || 'Could not delete task.');
      setTasks((current) => current.filter((task) => task._id !== id));
    } catch (err) { setError(err.message || 'Could not delete task.'); }
  };

  if (!token) return <main className="auth-shell"><section className="auth-card">
    <h1>Task Manager</h1>
    {!showForgotPassword && <div className="auth-tabs"><button className={!showRegister ? 'active' : ''} onClick={() => { setShowRegister(false); setError(''); setSuccess(''); }}>Sign in</button><button className={showRegister ? 'active' : ''} onClick={() => { setShowRegister(true); setError(''); setSuccess(''); }}>Register</button></div>}
    <form onSubmit={submitAuth} className="auth-form"><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>{showForgotPassword ? 'New password' : 'Password'}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength="6" required /></label>{showForgotPassword && <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the new password again" minLength="6" required /></label>}{error && <p className="error-message">{error}</p>}{success && <p className="success-message">{success}</p>}<button className="primary-button" type="submit">{showForgotPassword ? 'Reset password' : showRegister ? 'Create my workspace' : 'Enter workspace'} <span>→</span></button></form>
    <button className="text-button" type="button" onClick={() => { setShowForgotPassword(!showForgotPassword); setShowRegister(false); setError(''); setSuccess(''); setPassword(''); setConfirmPassword(''); }}>{showForgotPassword ? 'Back to sign in' : 'Forgot password?'}</button>
  </section></main>;

  return <main className="app-shell"><div className="app-frame">
    <header className="topbar"><h1 className="app-title">Task Manager</h1><button className="logout-button" onClick={handleLogout}>Log out</button></header>
    <form onSubmit={handleCreate} className="new-task-form"><input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Add a task..." aria-label="New task title" minLength="3" required /><button className="primary-button" type="submit" disabled={isCreating}>{isCreating ? 'Adding...' : 'Add task'} <span>+</span></button></form>
    {error && <p className="error-message page-error">{error}</p>}
    {isLoading ? <p className="empty-state">Loading...</p> : <div className="task-sections">{(() => {
      const grouped = statuses.reduce((acc, status) => {
        acc[status.key] = tasks.filter((task) => (task.status || (task.completed ? 'complete' : 'pending')) === status.key);
        return acc;
      }, {});
      // Pending is always visible. Ongoing unlocks once a task has moved past pending;
      // Complete unlocks once a task has been moved to complete. Once unlocked, a section
      // stays visible (even empty) so tasks moved back out of it don't make it vanish.
      const visible = {
        pending: true,
        ongoing: grouped.ongoing.length > 0 || grouped.complete.length > 0,
        complete: grouped.complete.length > 0
      };
      return statuses.map((status) => {
        if (!visible[status.key]) return null;
        const sectionTasks = grouped[status.key];
        return <section className="task-section" key={status.key}>
          <div className="section-heading"><h3>{status.label}</h3><span>{sectionTasks.length}</span></div>
          {sectionTasks.length
            ? <ul>{sectionTasks.map((task) => <TaskRow key={task._id} task={task} onStatusChange={cycleStatus} onDelete={handleDelete} />)}</ul>
            : <p className="empty-state">{status.hint}</p>}
        </section>;
      });
    })()}</div>}
  </div></main>;
}

function TaskRow({ task, onStatusChange, onDelete }) {
  const currentStatus = task.status || (task.completed ? 'complete' : 'pending');
  const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }) : '';
  return <li className={`task-row status-${currentStatus}`}><button type="button" className="status-toggle" onClick={() => onStatusChange(task)} aria-label={`Change ${task.title} status. Current status: ${currentStatus}`}><span className="status-dot" aria-hidden="true" /></button><span className={currentStatus === 'complete' ? 'task-title complete-title' : 'task-title'}>{task.title}</span>{createdAt && <time className="task-timestamp" dateTime={task.createdAt} title={`Created ${createdAt}`}>{createdAt}</time>}<span className="status-label">{currentStatus}</span><button type="button" className="delete-button" onClick={() => onDelete(task._id)} aria-label={`Delete ${task.title}`}>×</button></li>;
}