const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Task = require('./models/tasks');
const User = require('./models/users');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'task-manager-development-secret';


mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully!');
    // Drop stale indexes left by older versions of the task and user schemas.
    // A leftover unique index on `user` can otherwise block a second task.
    try {
      await Task.syncIndexes();
      await User.syncIndexes();
    } catch (err) {
      console.error('Index sync error:', err);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(cors());

const createToken = (user) => jwt.sign(
  { userId: user._id.toString(), email: user.email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};


app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`${time} | ${req.method} | ${req.originalUrl} | IP: ${req.ip}`);
  next();
});

app.post('/auth/register', async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Enter a valid email and a password of at least 6 characters' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'An account with that email already exists' });
    const user = await User.create({ email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ success: true, token: createToken(user), user: { email: user.email } });
  } catch (err) {
    next(err);
  }
});

app.post('/auth/login', async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
      return res.status(401).json({ success: false, message: 'Email or password is incorrect' });
    }
    res.json({ success: true, token: createToken(user), user: { email: user.email } });
  } catch (err) {
    next(err);
  }
});


app.use((req, res, next) => {
  if (
    (req.method === 'POST' || req.method === 'PUT') &&
    !req.is('application/json')
  ) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Content-Type must be application/json'
    });
  }
  next();
});


app.get('/tasks', authenticate, async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
});


app.get('/tasks/:id', authenticate, async (req, res, next) => {
  try {
    // Catch malformed ObjectIds before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid task ID format'
      });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id ${req.params.id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
});

app.post('/tasks', authenticate, async (req, res, next) => {
  try {
    const { title, description, priority, status } = req.body;

    const task = await Task.create({
      user: req.user.userId,
      title,
      description,
      priority,
      status,
      completed: status === 'complete'
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (err) {
    

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors
      });
    }
    next(err);
  }
});

app.put('/tasks/:id', authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid task ID format'
      });
    }

    const { title, description, priority, status } = req.body;

    // runValidators ensures schema rules apply on update too
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { title, description, priority, status, completed: status === 'complete' },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id ${req.params.id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        error: 'Validation Error',
        messages: errors
      });
    }
    next(err);
  }
});

app.delete('/tasks/:id', authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid task ID format'
      });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.userId });

    if (!task) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task with id ${req.params.id} not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: task
    });
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route Not Found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);   // <- full error goes HERE, not to Postman
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});