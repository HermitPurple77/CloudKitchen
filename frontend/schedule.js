// frontend/schedule.js

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SHIFT_LABELS = {
  morning:   "☀️ Morning",
  afternoon: "🌤 Afternoon",
  night:     "🌙 Night"
};

const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];

function getSchedule() {
  return JSON.parse(localStorage.getItem("kitchen_schedule") || "{}");
}

function saveSchedule(data) {
  localStorage.setItem("kitchen_schedule", JSON.stringify(data));
}

// --- Populate staff dropdown from localStorage ---
function populateStaffDropdown() {
  const select = document.getElementById("sc-staff");
  const staffList = JSON.parse(localStorage.getItem("kitchen_staff") || "[]");

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

function renderGrid() {
  const schedule = getSchedule();
  const grid = document.getElementById("week-grid");
  grid.innerHTML = "";

  DAYS.forEach(day => {
    const col = document.createElement("div");
    col.className = "day-col";

    const header = document.createElement("div");
    header.className = `day-header ${day === todayName ? "today" : ""}`;
    header.textContent = day === todayName ? `${day} ●` : day;
    col.appendChild(header);

    const slots = document.createElement("div");
    slots.className = "day-slots";

    const entries = schedule[day] || [];
    if (entries.length === 0) {
      slots.innerHTML = `<div class="day-empty">— off —</div>`;
    } else {
      entries.forEach((entry, i) => {
        const slot = document.createElement("div");
        slot.className = `slot ${entry.shift}`;
        slot.innerHTML = `
          <span class="slot-name">${escapeHtml(entry.staff)}</span>
          <span class="slot-label">${SHIFT_LABELS[entry.shift] || entry.shift}</span>
          <button class="slot-remove" onclick="removeSlot('${day}', ${i})" title="Remove">✕</button>
        `;
        slots.appendChild(slot);
      });
    }

    col.appendChild(slots);
    grid.appendChild(col);
  });
}

document.getElementById("schedule-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const staff = document.getElementById("sc-staff").value;
  const day   = document.getElementById("sc-day").value;
  const shift = document.getElementById("sc-shift").value;
  if (!staff || !day || !shift) return;

  const schedule = getSchedule();
  if (!schedule[day]) schedule[day] = [];
  schedule[day].push({ staff, shift });
  saveSchedule(schedule);
  document.getElementById("schedule-form").reset();
  populateStaffDropdown(); // re-populate after reset clears the select
  renderGrid();
});

window.removeSlot = function(day, index) {
  const schedule = getSchedule();
  schedule[day].splice(index, 1);
  saveSchedule(schedule);
  renderGrid();
};

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Init
populateStaffDropdown();
renderGrid();
