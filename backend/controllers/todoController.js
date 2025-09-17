import Todo from '../models/todoModel.js';

// @desc    Get logged-in user's todos
// @route   GET /api/todos
// backend/controllers/todoController.js

export const getTodos = async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).populate('user', 'name'); // This gets the user's name too
  res.json(todos);
};

// @desc    Create a new todo
// @route   POST /api/todos
export const createTodo = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  const todo = new Todo({
    text,
    user: req.user._id,
  });

  const createdTodo = await todo.save();
  res.status(201).json(createdTodo);
};

// @desc    Update a todo (toggle complete)
// @route   PUT /api/todos/:id
export const updateTodo = async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (todo) {
    // Make sure the logged-in user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    todo.completed = !todo.completed;
    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } else {
    res.status(404).json({ message: 'Todo not found' });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
export const deleteTodo = async (req, res) => {
  const todo = await Todo.findById(req.params.id);

  if (todo) {
     // Make sure the logged-in user owns this todo
    if (todo.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await todo.deleteOne();
    res.json({ message: 'Todo removed' });
  } else {
    res.status(404).json({ message: 'Todo not found' });
  }
};