// server/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
  title: String,
  energy: { type: String, required: true }, // 'Low', 'Medium', 'High'
  done: { type: Boolean, default: false }
});

const Task = mongoose.model('Task', TaskSchema);

// 3. API Routes

// GET: Fetch tasks based on energy level
app.get('/api/tasks/:energy', async (req, res) => {
  try {
    const energyLevel = req.params.energy;
    // Find tasks that match the energy AND are not done yet
    const tasks = await Task.find({ energy: energyLevel, done: false });
    res.json(tasks);
  } catch (err) { res.status(500).json(err); }
});

// POST: Add a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task(req.body);
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Kinetic Server running on port ${PORT}`));