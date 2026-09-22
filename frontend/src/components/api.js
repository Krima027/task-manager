const BASE_URL = "http://localhost:5000";


// GET all tasks
export const getTasks = () => {

  const token = localStorage.getItem("token");

  return fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).then(res => res.json());
};


// CREATE task
export const createTask = (task) => {

  const token = localStorage.getItem("token");

  return fetch(`${BASE_URL}/tasks`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(task)

  }).then(res => res.json());
};


// UPDATE task
export const updateTask = (id, task) => {

  const token = localStorage.getItem("token");

  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(task)

  }).then(res => res.json());
};


// DELETE task
export const deleteTask = (id) => {

  const token = localStorage.getItem("token");

  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`
    }

  }).then(res => res.json());
};