const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Task = require('./models/tasks');
const User = require('./models/users');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const taskFields = new Set(['title', 'description', 'status', 'priority']);
const allowedStatuses = new Set(['pending', 'ongoing', 'complete']);
const allowedPriorities = new Set(['low', 'medium', 'high']);

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} | ${req.path} | IP: ${req.ip}`);
  next();
});

app.use(cors());
app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be application/json'
    });
  }
  next();
});
app.use(express.json());

const requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return sendDatabaseUnavailable(res);
  }
  next();
};

const sendDatabaseUnavailable = (res) => res.status(503).json({
  success: false,
  message: 'The database is unavailable. Check the MongoDB connection and try again.'
});

const requireJwtSecret = (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Authentication is not configured. Set JWT_SECRET in backend/.env.'
    });
  }
  next();
};

const authenticate = (req, res, next) => {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!JWT_SECRET) return requireJwtSecret(req, res, next);

  try {
    const user = jwt.verify(match[1], JWT_SECRET);
    if (!user.userId || !mongoose.Types.ObjectId.isValid(user.userId)) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const createToken = (user) => jwt.sign(
  { userId: user._id.toString(), email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const isObjectBody = (body) => body !== null && typeof body === 'object' && !Array.isArray(body);
const hasUnknownTaskFields = (body) => Object.keys(body).some((key) => !taskFields.has(key));
const validTaskId = (id) => /^[a-f\d]{24}$/i.test(id) && mongoose.Types.ObjectId.isValid(id);
const validateTaskIdParam = (req, res, next) => {
  if (!validTaskId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid task ID format' });
  }
  next();
};

app.post('/auth/register', requireJwtSecret, async (req, res, next) => {
  try {
    const { email: submittedEmail, password } = req.body || {};
    const email = typeof submittedEmail === 'string' ? submittedEmail.trim().toLowerCase() : '';
    if (!emailPattern.test(email) || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email and a password of at least 6 characters'
      });
    }
    if (mongoose.connection.readyState !== 1) return sendDatabaseUnavailable(res);

    if (await User.exists({ email })) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists' });
    }

    const user = await User.create({ email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({
      success: true,
      token: createToken(user),
      user: { id: user._id.toString(), email: user.email }
    });
  } catch (err) {
    next(err);
  }
});

app.post('/auth/login', requireJwtSecret, async (req, res, next) => {
  try {
    const { email: submittedEmail, password } = req.body || {};
    const email = typeof submittedEmail === 'string' ? submittedEmail.trim().toLowerCase() : '';
    if (!emailPattern.test(email) || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Enter a valid email and password' });
    }
    if (mongoose.connection.readyState !== 1) return sendDatabaseUnavailable(res);

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }

    res.status(200).json({
      success: true,
      token: createToken(user),
      user: { id: user._id.toString(), email: user.email }
    });
  } catch (err) {
    next(err);
  }
});

app.get('/tasks', authenticate, requireDatabase, async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
});

app.get('/tasks/:id', authenticate, validateTaskIdParam, requireDatabase, async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

app.post('/tasks', authenticate, async (req, res, next) => {
  try {
    const body = req.body;
    if (!isObjectBody(body) || hasUnknownTaskFields(body)) {
      return res.status(400).json({ success: false, message: 'The task request contains invalid fields' });
    }
    if (typeof body.title !== 'string' || body.title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Task title must be at least 3 characters' });
    }
    if (body.description !== undefined && typeof body.description !== 'string') {
      return res.status(400).json({ success: false, message: 'Description must be text' });
    }
    if (body.status !== undefined && !allowedStatuses.has(body.status)) {
      return res.status(400).json({ success: false, message: 'Status must be pending, ongoing, or complete' });
    }
    if (body.priority !== undefined && !allowedPriorities.has(body.priority)) {
      return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
    }
    if (mongoose.connection.readyState !== 1) return sendDatabaseUnavailable(res);

    const task = await Task.create({
      user: req.user.userId,
      title: body.title.trim(),
      description: body.description,
      status: body.status || 'pending',
      priority: body.priority || 'medium'
    });
    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (err) {
    next(err);
  }
});

app.put('/tasks/:id', authenticate, validateTaskIdParam, async (req, res, next) => {
  try {
    const body = req.body;
    if (!isObjectBody(body) || hasUnknownTaskFields(body) || Object.keys(body).length === 0) {
      return res.status(400).json({ success: false, message: 'Provide valid task fields to update' });
    }

    const updates = {};
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 3) {
        return res.status(400).json({ success: false, message: 'Task title must be at least 3 characters' });
      }
      updates.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        return res.status(400).json({ success: false, message: 'Description must be text' });
      }
      updates.description = body.description;
    }
    if (body.status !== undefined) {
      if (!allowedStatuses.has(body.status)) {
        return res.status(400).json({ success: false, message: 'Status must be pending, ongoing, or complete' });
      }
      updates.status = body.status;
      updates.completed = body.status === 'complete';
    }
    if (body.priority !== undefined) {
      if (!allowedPriorities.has(body.priority)) {
        return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
      }
      updates.priority = body.priority;
    }
    if (mongoose.connection.readyState !== 1) return sendDatabaseUnavailable(res);

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
  } catch (err) {
    next(err);
  }
});

app.delete('/tasks/:id', authenticate, validateTaskIdParam, requireDatabase, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task deleted successfully', data: task });
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  const status = err.code === 11000 ? 409
    : err.name === 'ValidationError' || err.name === 'SyntaxError' || err.name === 'CastError' ? 400
      : err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError' ? 503
        : 500;
  const safeMessage = String(err.message || 'Unknown error')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s@]+@[^\s]+/gi, 'mongodb://[redacted]');
  console.error(`Request error (${err.name || 'Error'}): ${safeMessage}`);

  if (res.headersSent) return next(err);
  const message = status === 409
    ? 'An account with that email already exists'
    : status === 400
      ? (err.name === 'ValidationError'
        ? Object.values(err.errors).map((item) => item.message).join(', ')
        : 'The request contains invalid data')
      : status === 503
        ? 'The database is unavailable. Check the MongoDB connection and try again.'
        : 'Something went wrong. Please try again.';
  res.status(status).json({ success: false, message });
});

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => {
      const safeMessage = String(err.message || 'Unknown error')
        .replace(/mongodb(?:\+srv)?:\/\/[^\s@]+@[^\s]+/gi, 'mongodb://[redacted]');
      console.error(`MongoDB connection failed: ${safeMessage}. Check MONGO_URI and confirm MongoDB is reachable.`);
    });
} else {
  console.error('MONGO_URI is missing. Add the MongoDB connection string to backend/.env.');
}

app.listen(PORT, () => {
  console.log(`Task Manager API listening on port ${PORT}`);
});
