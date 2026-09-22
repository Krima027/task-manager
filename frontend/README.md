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
- Check a task to mark it complete, uncheck to mark it incomplete
- Incomplete and completed tasks are shown in separate sections
- Delete a task with the Delete button (confirmation required)

## Project Structure

```
src/
  App.jsx               main component, all CRUD logic and UI
  components/
    api.js              fetch wrappers for all backend endpoints
  index.css             base reset and background colour
main.jsx                app entry point
```

## Backend Repo

https://github.com/24AIML042-Nyasia/task-manager-api-24AIML042
