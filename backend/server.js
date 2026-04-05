// backend/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Task Schema
const taskSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  staff:     { type: String, required: true },
  shift:     { type: String, required: true },
  status:    { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);

// Routes

// GET all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, staff, shift } = req.body;
    if (!title || !staff || !shift) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const task = new Task({ title, staff, shift });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PATCH update task status
app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Export app for testing — only start server when run directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/kitchendb";
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB connected");
      app.listen(PORT, () => console.log("🚀 Server running on port " + PORT));
    })
    .catch((err) => console.error("❌ MongoDB error:", err));
}

module.exports = { app, Task };
