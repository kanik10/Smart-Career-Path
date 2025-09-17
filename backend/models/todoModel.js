import mongoose from 'mongoose';

const todoSchema = mongoose.Schema({
  // This links the todo item to a specific user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    required: true,
    default: false,
  },
}, {
  timestamps: true,
});

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;