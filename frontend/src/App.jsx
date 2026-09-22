import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from './components/api';

// ── brown palette ─────────────────────────────────────────────────────────────
const C = {
  pageBg:      '#3f1849',   
  cardBg:      '#643e6e',   
  rowBg:       '#b56fe7',   // task row background
  rowBorder:   '#ba7bf8b9',   // row border
  accent:      '#90aeee',   // warm amber-brown, Add Task button, left border incomplete
  accentHover: '#dd73ee',
  done:        '#ef81c5',   // muted brown for completed left border
  text:        '#f3eee8',   // warm cream text
  textMuted:   '#a86d8d',   // muted brown-tan
  inputBg:     '#100b08',
  inputBorder: '#b599cc',
  errorBg:     '#160125',
  errorText:   '#f9bbef',
  headingLine: '#9c458b',
};

  export default function App() {

  const [token, setToken] = useState(
    localStorage.getItem('token')
  );

  const [showRegister, setShowRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

    // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {

      const response = await fetch(
        'http://localhost:5000/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const json = await response.json();

      if (response.ok && json.success) {

        localStorage.setItem('token', json.token);
        setToken(json.token);

        setEmail('');
        setPassword('');

      } else {

        alert(json.message || 'Login failed');

      }

    } catch (err) {

      alert('Cannot connect to backend');

    }
  };


  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();

    try {

      const response = await fetch(
        'http://localhost:5000/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const json = await response.json();

      if (response.ok && json.success) {

        alert('Registration successful! Please login.');

        setShowRegister(false);
        setEmail('');
        setPassword('');

      } else {

        alert(json.message || 'Registration failed');

      }

    } catch (err) {

      alert('Cannot connect to backend');

    }
  };


  // LOGOUT
  const handleLogout = () => {

    localStorage.removeItem('token');

    setToken(null);

    setTasks([]);

  };

  // ------------------------------------------------------
  // 1. READ: Fetch all tasks on component mount
  // ------------------------------------------------------
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const json = await getTasks();
      if (json.success) {
        setTasks(json.data);
      } else {
        setError(json.error || json.message || 'Failed to load tasks');
      }
    } catch (err) {
      setError('Network error. Is the Express backend running on port 5000?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ------------------------------------------------------
  // 2. CREATE: Add a new task
  // ------------------------------------------------------
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const numericId = Date.now();
      const json = await createTask({ id: numericId, title: newTaskTitle.trim() });

      if (json.success) {
        setTasks([json.data, ...tasks]);
        setNewTaskTitle('');
        setError(null);
      } else {
        setError(json.error || json.message || 'Failed to create task.');
      }
    } catch (err) {
      setError('Network error while creating task.');
    }
  };

  // ------------------------------------------------------
  // 3. UPDATE: Toggle completion status
  // ------------------------------------------------------
  const handleToggle = async (task) => {
  try {
    const json = await updateTask(task._id, {
      title: task.title,
      completed: !task.completed
    });

    if (json.success) {
      setTasks(
        tasks.map((t) =>
          t._id === task._id ? json.data : t
        )
      );

      setError(null);
    } else {
      setError(
        json.error ||
        json.message ||
        'Failed to update task.'
      );
    }

  } catch (err) {
    setError('Network error while updating task.');
  }
};

  // ------------------------------------------------------
  // 4. DELETE: Remove a task
  // ------------------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const json = await deleteTask(id);

      if (json.success) {
        setTasks(tasks.filter((t) => t._id !== id));
      } else {
        setError(json.error || json.message || 'Failed to delete task.');
      }
    } catch (err) {
      setError('Network error while deleting task.');
    }
  };

  const incomplete = tasks.filter((t) => !t.completed);
  const completed  = tasks.filter((t) => t.completed);

    // Show Login/Register if user is not logged in
  if (!token) {

    return (
      <div style={{
        minHeight: '100vh',
        background: C.pageBg,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>

        <div style={{
          width: '350px',
          background: C.cardBg,
          padding: '30px',
          borderRadius: '10px',
          fontFamily: 'Arial, sans-serif'
        }}>

          <h1 style={{
            color: C.text,
            textAlign: 'center'
          }}>
            Task Manager
          </h1>


          <h2 style={{
            color: C.text,
            textAlign: 'center'
          }}>
            {showRegister ? 'Register' : 'Login'}
          </h2>


          <form
            onSubmit={
              showRegister
                ? handleRegister
                : handleLogin
            }
          >

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '5px',
                border: `1px solid ${C.inputBorder}`,
                background: C.inputBg,
                color: C.text
              }}
            />


            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px',
                marginBottom: '15px',
                borderRadius: '5px',
                border: `1px solid ${C.inputBorder}`,
                background: C.inputBg,
                color: C.text
              }}
            />


            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                background: C.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {showRegister ? 'Register' : 'Login'}
            </button>

          </form>


          <p style={{
            color: C.text,
            textAlign: 'center',
            marginTop: '20px'
          }}>

            {showRegister
              ? 'Already have an account? '
              : "Don't have an account? "
            }

            <button
              onClick={() => setShowRegister(!showRegister)}
              style={{
                background: 'none',
                border: 'none',
                color: C.accent,
                cursor: 'pointer'
              }}
            >
              {showRegister ? 'Login' : 'Register'}
            </button>

          </p>

        </div>

      </div>
    );
  }


  return (
    <div style={{
      minHeight: '100vh',
      background: C.pageBg,
      padding: '40px 16px 80px',
    }}>
      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        fontFamily: 'Georgia, serif',
      }}>

        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          marginBottom: '28px',
          fontSize: '26px',
          color: C.text,
          fontWeight: '700',
          letterSpacing: '0.5px',
        }}>
          Task Manager
        </h1>

      <button
        onClick={handleLogout}
        style={{
          display: 'block',
          margin: '0 auto 20px',
          padding: '7px 15px',
          background: '#9a3de7',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>

        {/* Error banner */}
        {error && (
          <div style={{
            background: C.errorBg,
            color: C.errorText,
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
            fontFamily: 'sans-serif',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Create form */}
        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}
        >
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task title..."
            style={{
              flex: 1,
              padding: '10px 13px',
              borderRadius: '6px',
              border: `1px solid ${C.inputBorder}`,
              background: C.inputBg,
              color: C.text,
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'sans-serif',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              background: C.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: 'sans-serif',
            }}
          >
            Add Task
          </button>
        </form>

        {/* Loading */}
        {isLoading && (
          <p style={{ color: C.textMuted, textAlign: 'center', fontFamily: 'sans-serif' }}>
            Loading tasks...
          </p>
        )}

        {/* Empty state */}
        {!isLoading && tasks.length === 0 && (
          <p style={{ color: C.textMuted, textAlign: 'center', fontFamily: 'sans-serif' }}>
            No tasks found. Create one above!
          </p>
        )}

        {/* ── Incomplete tasks ── */}
        {!isLoading && incomplete.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.textMuted,
              marginBottom: '10px',
              fontFamily: 'sans-serif',
              borderBottom: `1px solid ${C.headingLine}`,
              paddingBottom: '6px',
            }}>
              Tasks: {incomplete.length}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {incomplete.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </section>
        )}

        {/* ── Completed tasks ── */}
        {!isLoading && completed.length > 0 && (
          <section>
            <h2 style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.textMuted,
              marginBottom: '10px',
              fontFamily: 'sans-serif',
              borderBottom: `1px solid ${C.headingLine}`,
              paddingBottom: '6px',
            }}>
              Completed: {completed.length}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {completed.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </section>
        )}

      </div>
    </div>
  );
}

// ── Reusable task row ─────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete }) {
  return (
    <li style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 14px',
      background: C.rowBg,
      marginBottom: '8px',
      borderRadius: '8px',
      border: `1px solid ${C.rowBorder}`,
      borderLeft: task.completed ? `4px solid ${C.done}` : `4px solid ${C.accent}`,
    }}>
      <input
        type="checkbox"
        checked={task.completed || false}
        onChange={() => onToggle(task)}
        style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: C.accent }}
      />
      <span style={{
        flexGrow: 1,
        fontSize: '15px',
        fontFamily: 'sans-serif',
        textDecoration: task.completed ? 'line-through' : 'none',
        color: task.completed ? C.textMuted : C.text,
      }}>
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task._id)}
        style={{
          padding: '5px 11px',
          background: '#9a3de7',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'sans-serif',
        }}
      >
        Delete
      </button>
    </li>
  );
}
