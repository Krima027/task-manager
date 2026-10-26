# Task Manager Frontend

React + Vite frontend for the full-stack Task Manager app.
Connects to the Express + MongoDB backend at `http://localhost:5000`.

## Requirements

- [Node.js](https://nodejs.org/) v18 or later
- The backend must be running before starting the frontend

## Setup and Run

```bash
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

## What It Does

- Fetches tasks from the backend on load
- Create a task using the input form and Add Task button
- Select a task's status indicator to cycle it through Pending, Ongoing, and Complete
- Pending, ongoing, and completed tasks are shown in their matching sections
- Delete a task with the Delete button
- Loads the authenticated task workspace as a separate JavaScript chunk after authentication

## Project Structure

```
src/
  App.jsx               authentication state and lazy page loading
  components/
    api.js              fetch wrappers for all backend endpoints
  pages/
    AuthPage.jsx        lazy-loaded sign-in and registration
    Dashboard.jsx       lazy-loaded task workspace and CRUD UI
    TaskSections.jsx    task list, loaded when tasks are available
  statuses.js           shared task status definitions
  index.css              base reset and background colour
main.jsx                app entry point
docs/
  build-before.txt      baseline Vite build output
  build-after.txt       optimized Vite build output
```

## Practical 8: Performance and lazy loading

Auth, Dashboard, and the task list use lazy-loaded JavaScript chunks. A brief build comparison is in [docs/practical8-performance.md](./docs/practical8-performance.md); raw build outputs are in `docs/build-before.txt` and `docs/build-after.txt`.

## Backend Repo

https://github.com/24AIML042-Nyasia/task-manager-api-24AIML042
