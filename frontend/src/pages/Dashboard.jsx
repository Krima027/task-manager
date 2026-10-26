import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTask } from '../components/api';

const TaskSections = lazy(() => import('./TaskSections.jsx'));

export default function Dashboard({ onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    getTasks().then((json) => {
      if (json.success) setTasks(json.data);
      else setError(json.message || 'Unable to load your tasks.');
    }).catch((err) => {
      if (err.status === 401) onLogout();
      else setError(err.message || 'Unable to load your tasks.');
    }).finally(() => setIsLoading(false));
  }, [onLogout]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (isCreating) return;
    if (title.length < 3) {
      setError('Task title must be at least 3 characters.');
      return;
    }
    setIsCreating(true);
    try {
      const json = await createTask({ title, status: 'pending' });
      setTasks((current) => [json.data, ...current]); setNewTaskTitle(''); setError('');
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message || 'Could not create task.');
    }
    finally { setIsCreating(false); }
  };

  const changeStatus = async (task, status) => {
    if (status === task.status || (!task.status && status === 'pending')) return;
    try {
      const json = await updateTask(task._id, { title: task.title, status });
      if (!json.success) throw new Error(json.message || 'Could not update task.');
      setTasks((current) => current.map((item) => item._id === task._id ? json.data : item));
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message || 'Could not update task.');
    }
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
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message || 'Could not delete task.');
    }
  };

  return <main className="app-shell"><div className="app-frame">
    <header className="topbar"><h1 className="app-title">Task Manager</h1><button className="logout-button" onClick={onLogout}>Log out</button></header>
    <form onSubmit={handleCreate} className="new-task-form"><input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Add a task..." aria-label="New task title" minLength="3" required /><button className="primary-button" type="submit" disabled={isCreating}>{isCreating ? 'Adding...' : 'Add task'} <span>+</span></button></form>
    {error && <p className="error-message page-error">{error}</p>}
    {isLoading ? <p className="empty-state" role="status">Loading...</p> : tasks.length === 0
      ? !error && <p className="empty-state">No tasks yet. Add one to get started.</p>
      : <Suspense fallback={<p className="empty-state" role="status">Loading your task list...</p>}>
        <TaskSections tasks={tasks} onStatusChange={cycleStatus} onDelete={handleDelete} />
      </Suspense>}
  </div></main>;
}
