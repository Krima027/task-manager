const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [3, 'Task title cannot be less than 3 characters']
  },
  description: {
    type: String,
  },
  completed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'complete'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority level.'
    },
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

taskSchema.pre('validate', function() {
  this.completed = this.status === 'complete';
});

module.exports = mongoose.model('Task', taskSchema);
