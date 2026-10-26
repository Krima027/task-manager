const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const requestJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error('Cannot connect to the task server. Check that the backend is running.');
  }

  const responseText = await response.text();
  let json = {};
  if (responseText) {
    try {
      const parsed = JSON.parse(responseText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) json = parsed;
      else if (response.ok) throw new Error('The server returned an invalid response.');
    } catch {
      if (response.ok) throw new Error('The server returned an invalid response.');
    }
  }

  if (!response.ok || json.success === false) {
    const message = json.message || json.messages?.join(', ') || 'The server rejected the request.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return json;
};

const authHeaders = (json = false) => {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const loginUser = (email, password) => requestJson(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

export const registerUser = (email, password) => requestJson(`${BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

export const getTasks = () => requestJson(`${BASE_URL}/tasks`, {
  method: 'GET',
  headers: authHeaders()
});

export const createTask = (task) => requestJson(`${BASE_URL}/tasks`, {
  method: 'POST',
  headers: authHeaders(true),
  body: JSON.stringify(task)
});

export const updateTask = (id, task) => requestJson(`${BASE_URL}/tasks/${id}`, {
  method: 'PUT',
  headers: authHeaders(true),
  body: JSON.stringify(task)
});

export const deleteTask = (id) => requestJson(`${BASE_URL}/tasks/${id}`, {
  method: 'DELETE',
  headers: authHeaders()
});
