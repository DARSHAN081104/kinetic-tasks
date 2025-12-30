// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import the new model
require('dotenv').config();
const SECRET_KEY=process.env.JWT_SECRET;

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // Allows Angular to talk to this server

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Kinetic Database Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

// 2. Define the Schema
const TaskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: String,
  energy: { type: String, required: true }, // 'Low', 'Medium', 'High'
  done: { type: Boolean, default: false }
});

const Task = mongoose.model('Task', TaskSchema);

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: "No token provided" });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(500).json({ error: "Failed to authenticate token" });
    req.userId = decoded.id; // Save the User ID for the next step
    next();
  });
};

// 3. API Routes

// GET: Fetch tasks (PROTECTED 🔒)
// We added 'verifyToken' here so only logged-in users can run this
app.get('/api/tasks/:energy', verifyToken, async (req, res) => {
  try {
    const energyLevel = req.params.energy;
    
    // Find tasks that match the energy, are not done, AND belong to THIS user
    const tasks = await Task.find({ 
      energy: energyLevel, 
      done: false,
      userId: req.userId // <--- NEW: Only show MY tasks
    });
    
    res.json(tasks);
  } catch (err) { res.status(500).json(err); }
});

// POST: Add a new task (PROTECTED 🔒)
app.post('/api/tasks', verifyToken, async (req, res) => {
  try {
    // Create task with the data sent + the User ID from the token
    const newTask = new Task({
      ...req.body,       // Copy title, energy, etc.
      userId: req.userId // <--- NEW: Stamp it with my ID
    });
    
    await newTask.save();
    res.json(newTask);
  } catch (err) { res.status(500).json(err); }
});

// PUT: Mark task as done
app.put('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { done: true });
    res.json({ message: "Task Completed" });
  } catch (err) { res.status(500).json(err); }
});

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.json({ message: "User registered!" });
  } catch (err) { res.status(500).json({ error: "Username likely taken" }); }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) return res.status(400).json({ error: "User not found" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password" });

    // Create Token (The ID Card)
    const token = jwt.sign({ id: user._id }, SECRET_KEY);
    res.json({ token, username: user.username });
  } catch (err) { res.status(500).json(err); }
});

// DELETE: Permanently delete a task (PROTECTED 🔒)
app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
  try {
    // 1. Find the task
    const task = await Task.findById(req.params.id);
    
    // 2. Check if task exists
    if (!task) return res.status(404).json({ error: "Task not found" });

    // 3. SECURITY CHECK: Ensure the task belongs to the logged-in user
    if (task.userId !== req.userId) {
      return res.status(403).json({ error: "You can only delete your own tasks!" });
    }

    // 4. Delete it
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task Deleted" });
  } catch (err) { res.status(500).json(err); }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Kinetic Server running on port ${PORT}`));