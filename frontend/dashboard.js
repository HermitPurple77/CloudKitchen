// frontend/dashboard.js

const API = "http://localhost:5000/api/tasks";

function getStaff() {
  return JSON.parse(localStorage.getItem("kitchen_staff") || "[]");
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}

function shiftKey(shift) {
  const s = (shift || "").toLowerCase();
  if (s.includes("morning"))   return "morning";
  if (s.includes("afternoon")) return "afternoon";
  if (s.includes("night"))     return "night";
  return "other";
}

async function loadDashboard() {
  let tasks = [];
  try {
    const res = await fetch(API);
    tasks = await res.json();
  } catch {
    tasks = [];
  }

  const staff = getStaff();
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === "Done").length;
  const pending = total - done;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  // Stat cards
  document.getElementById("stat-total").textContent   = total;
  document.getElementById("stat-done").textContent    = done;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-staff").textContent   = staff.length;

  // Progress bar
  document.getElementById("pct-label").textContent = `${pct}%`;
  setTimeout(() => {
    document.getElementById("progress-fill").style.width = `${pct}%`;
  }, 100);

  // Shift breakdown
  const shiftCounts = { morning: 0, afternoon: 0, night: 0, other: 0 };
  tasks.forEach(t => { shiftCounts[shiftKey(t.shift)]++; });
  const maxShift = Math.max(...Object.values(shiftCounts), 1);

  const shiftLabels = {
    morning:   "☀️ Morning",
    afternoon: "🌤 Afternoon",
    night:     "🌙 Night",
    other:     "❓ Other"
  };

  const breakdown = document.getElementById("shift-breakdown");
  breakdown.innerHTML = "";
  Object.entries(shiftCounts).forEach(([key, count]) => {
    if (count === 0) return;
    const row = document.createElement("div");
    row.className = "shift-row";
    row.innerHTML = `
      <span class="shift-name">${shiftLabels[key]}</span>
      <div class="shift-bar-track">
        <div class="shift-bar-fill ${key}" style="width:${(count/maxShift)*100}%"></div>
      </div>
      <span class="shift-count">${count}</span>
    `;
    breakdown.appendChild(row);
  });
  if (breakdown.innerHTML === "") breakdown.innerHTML = `<div class="empty-state">No task data yet.</div>`;

  // Staff workload
  const workloadEl = document.getElementById("staff-workload");
  workloadEl.innerHTML = "";
  const staffMap = {};
  tasks.forEach(t => {
    staffMap[t.staff] = (staffMap[t.staff] || 0) + 1;
  });
  const sorted = Object.entries(staffMap).sort((a, b) => b[1] - a[1]);
  const maxLoad = sorted[0]?.[1] || 1;

  if (sorted.length === 0) {
    workloadEl.innerHTML = `<div class="empty-state">No task data yet.</div>`;
  } else {
    sorted.forEach(([name, count]) => {
      const row = document.createElement("div");
      row.className = "workload-row";
      row.innerHTML = `
        <div class="workload-name">${escapeHtml(name)}</div>
        <div class="workload-bar-track">
          <div class="workload-bar-fill" style="width:${(count/maxLoad)*100}%"></div>
        </div>
        <div class="workload-count">${count} task${count !== 1 ? "s" : ""}</div>
      `;
      workloadEl.appendChild(row);
    });
  }

  // Recent tasks (last 5)
  const recentEl = document.getElementById("recent-tasks");
  recentEl.innerHTML = "";
  const recent = tasks.slice(0, 5);
  if (recent.length === 0) {
    recentEl.innerHTML = `<div class="empty-state">No tasks yet.</div>`;
  } else {
    recent.forEach(t => {
      const card = document.createElement("div");
      card.className = "task-card";
      card.innerHTML = `
        <div>
          <div class="task-title">${escapeHtml(t.title)}</div>
          <div class="task-meta" style="margin-top:4px;">
            <span class="meta-chip"><span class="icon">👤</span>${escapeHtml(t.staff)}</span>
            <span class="meta-chip"><span class="icon">🕐</span>${escapeHtml(t.shift)}</span>
          </div>
        </div>
        <span class="status-chip ${t.status === "Done" ? "done" : "pending"}">${t.status}</span>
      `;
      recentEl.appendChild(card);
    });
  }
}

loadDashboard();
