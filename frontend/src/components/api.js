const BASE_URL = "http://localhost:5000";

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || json.messages?.join(', ') || 'The server rejected the request.');
  }
  return json;
};


// GET all tasks
export const getTasks = () => {

  const token = localStorage.getItem("token");

  return requestJson(`${BASE_URL}/tasks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};


// CREATE task
export const createTask = (task) => {

  const token = localStorage.getItem("token");

  return requestJson(`${BASE_URL}/tasks`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(task)

  });
};


// UPDATE task
export const updateTask = (id, task) => {

  const token = localStorage.getItem("token");

  return requestJson(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },

    body: JSON.stringify(task)

  });
};


// DELETE task
export const deleteTask = (id) => {

  const token = localStorage.getItem("token");

  return requestJson(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`
    }

  });
};

// RESET PASSWORD
export const resetPassword = (email, password) => requestJson(`${BASE_URL}/auth/reset-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});