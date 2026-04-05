// frontend/staff.js
// Staff data stored in localStorage

const form    = document.getElementById("staff-form");
const grid    = document.getElementById("staff-grid");
const loading = document.getElementById("staff-loading");
const empty   = document.getElementById("staff-empty");
const countEl = document.getElementById("staff-count");
const btn     = document.getElementById("staff-btn");

// Default staff matching the seeded DB tasks — auto-loaded if localStorage is empty
const DEFAULT_STAFF = [
  { name: "Ravi Kumar",   role: "Line Cook",       shift: "Morning (6AM–2PM)",    phone: "" },
  { name: "Anita Sharma", role: "Kitchen Helper",   shift: "Morning (6AM–2PM)",    phone: "" },
  { name: "Priya Nair",   role: "Pastry Chef",      shift: "Morning (6AM–2PM)",    phone: "" },
  { name: "Suresh Patel", role: "Sous Chef",        shift: "Afternoon (2PM–10PM)", phone: "" },
  { name: "Meena Iyer",   role: "Line Cook",        shift: "Afternoon (2PM–10PM)", phone: "" },
  { name: "Kiran Bose",   role: "Head Chef",        shift: "Afternoon (2PM–10PM)", phone: "" },
  { name: "Arjun Reddy",  role: "Kitchen Helper",   shift: "Night (10PM–6AM)",     phone: "" },
  { name: "Divya Menon",  role: "Dishwasher",       shift: "Night (10PM–6AM)",     phone: "" },
];

function getStaff() {
  return JSON.parse(localStorage.getItem("kitchen_staff") || "[]");
}

function saveStaff(list) {
  localStorage.setItem("kitchen_staff", JSON.stringify(list));
}

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function render() {
  const list = getStaff();
  loading.style.display = "none";
  grid.innerHTML = "";
  countEl.textContent = `${list.length} member${list.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.forEach((s, i) => {
    const card = document.createElement("div");
    card.className = "staff-card";
    card.innerHTML = `
      <button class="staff-delete" onclick="removeStaff(${i})" title="Remove">✕</button>
      <div class="staff-avatar">${initials(s.name)}</div>
      <div>
        <div class="staff-name">${escapeHtml(s.name)}</div>
        <div class="staff-role-badge">${escapeHtml(s.role)}</div>
      </div>
      <div class="staff-details">
        <div class="staff-detail-row"><span class="icon">🕐</span>${escapeHtml(s.shift)}</div>
        ${s.phone ? `<div class="staff-detail-row"><span class="icon">📞</span>${escapeHtml(s.phone)}</div>` : ""}
      </div>
    `;
    grid.appendChild(card);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name  = document.getElementById("s-name").value.trim();
  const role  = document.getElementById("s-role").value;
  const shift = document.getElementById("s-shift").value;
  const phone = document.getElementById("s-phone").value.trim();
  if (!name || !role || !shift) return;

  btn.disabled = true;
  const list = getStaff();

  // Prevent duplicate names
  if (list.some(s => s.name.toLowerCase() === name.toLowerCase())) {
    alert(`"${name}" is already in the roster.`);
    btn.disabled = false;
    return;
  }

  list.unshift({ name, role, shift, phone });
  saveStaff(list);
  form.reset();
  render();
  btn.disabled = false;
});

window.removeStaff = function(index) {
  const list = getStaff();
  list.splice(index, 1);
  saveStaff(list);
  render();
};

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Auto-seed default staff if localStorage is empty
if (getStaff().length === 0) {
  saveStaff(DEFAULT_STAFF);
}

render();
