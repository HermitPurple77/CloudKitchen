// frontend/app.js

const API = "http://localhost:5000/api/tasks";

const form      = document.getElementById("task-form");
const taskList  = document.getElementById("task-list");
const loading   = document.getElementById("loading");
const empty     = document.getElementById("empty");
const submitBtn = document.getElementById("submit-btn");

// --- Populate staff dropdown from localStorage ---
function populateStaffDropdown() {
  const select = document.getElementById("staff");
  const staffList = JSON.parse(localStorage.getItem("kitchen_staff") || "[]");

  // Clear all except the placeholder
  select.innerHTML = `<option value="">Select staff member</option>`;

  if (staffList.length === 0) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "— No staff added yet (go to Staff page) —";
    select.appendChild(opt);
    return;
  }

  staffList.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = `${s.name} · ${s.role}`;
    select.appendChild(opt);
  });
}

// Fetch and render all tasks
async function loadTasks() {
  try {
    const res = await fetch(API);
    const tasks = await res.json();
    loading.style.display = "none";
    renderTasks(tasks);
  } catch (err) {
    loading.textContent = "⚠ Could not connect to server.";
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = `task-card ${task.status === "Done" ? "done" : ""}`;
    card.innerHTML = `
      <div class="task-info">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="meta-chip"><span class="icon">👤</span>${escapeHtml(task.staff)}</span>
          <span class="meta-chip"><span class="icon">🕐</span>${escapeHtml(task.shift)}</span>
          <span class="status-chip ${task.status === "Done" ? "done" : "pending"}">${task.status}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-toggle" onclick="toggleStatus('${task._id}', '${task.status}')">
          ${task.status === "Done" ? "Undo" : "✓ Done"}
        </button>
        <button class="btn-delete" onclick="deleteTask('${task._id}')">✕</button>
      </div>
    `;
    taskList.appendChild(card);
  });
}

// Add new task
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const staff = document.getElementById("staff").value;
  const shift = document.getElementById("shift").value;

  if (!title || !staff || !shift) return;

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Adding…";

  try {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, staff, shift }),
    });
    form.reset();
    populateStaffDropdown(); // re-populate after reset
    loadTasks();
  } catch (err) {
    alert("Failed to add task. Is the server running?");
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Add Assignment";
  }
});

// Toggle task status
async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === "Done" ? "Pending" : "Done";
  try {
    await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadTasks();
  } catch (err) {
    alert("Failed to update task.");
  }
}

// Delete a task
async function deleteTask(id) {
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    loadTasks();
  } catch (err) {
    alert("Failed to delete task.");
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Init
populateStaffDropdown();
loadTasks();
