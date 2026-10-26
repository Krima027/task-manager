import React from 'react';
import { statuses } from '../statuses';

export default function TaskSections({ tasks, onStatusChange, onDelete }) {
  const grouped = statuses.reduce((acc, status) => {
    acc[status.key] = tasks.filter((task) => (task.status || (task.completed ? 'complete' : 'pending')) === status.key);
    return acc;
  }, {});

  return <div className="task-sections">{statuses.map((status) => {
    const sectionTasks = grouped[status.key];
    if (sectionTasks.length === 0) return null;
    return <section className="task-section" key={status.key}>
      <div className="section-heading"><h3>{status.label}</h3><span>{sectionTasks.length}</span></div>
      <ul>{sectionTasks.map((task) => <TaskRow key={task._id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} />)}</ul>
    </section>;
  })}</div>;
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
