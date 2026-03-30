/* ── DATA ── */
const COLORS = ["#e8890c","#2d7a4f","#2563a8","#c0392b","#7c3aed","#0891b2","#be185d","#b45309"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SHIFT_OPTS = [
  {val:"morning",label:"Morning",time:"6–2pm",  cls:"sc-morning"},
  {val:"evening",label:"Evening",time:"2–10pm", cls:"sc-evening"},
  {val:"night",  label:"Night",  time:"10–6am", cls:"sc-night"},
  {val:"off",    label:"Off",    time:"",        cls:"sc-off"},
  {val:"absent", label:"Absent", time:"",        cls:"sc-absent"},
];


let STAFF = [
  {id:1,name:"Priya Sharma",  role:"Head Chef",     dept:"Kitchen", phone:"98765 43210",status:"active",  joined:"Jan 2022",salary:"₹42,000",rating:4.8},
  {id:2,name:"Ravi Kumar",    role:"Sous Chef",     dept:"Kitchen", phone:"87654 32109",status:"active",  joined:"Mar 2022",salary:"₹35,000",rating:4.5},
  {id:3,name:"Anjali Mehra",  role:"Grill Station", dept:"Kitchen", phone:"76543 21098",status:"active",  joined:"Jun 2022",salary:"₹28,000",rating:4.2},
  {id:4,name:"Deepak Nair",   role:"Cold Station",  dept:"Kitchen", phone:"65432 10987",status:"active",  joined:"Sep 2022",salary:"₹26,000",rating:4.0},
  {id:5,name:"Sunita Rao",    role:"Pkg Lead",      dept:"Dispatch",phone:"54321 09876",status:"on-leave",joined:"Dec 2022",salary:"₹24,000",rating:3.9},
  {id:6,name:"Manoj Pillai",  role:"Delivery Coord",dept:"Dispatch",phone:"43210 98765",status:"active",  joined:"Feb 2023",salary:"₹22,000",rating:4.1},
  {id:7,name:"Kavya Reddy",   role:"Quality Check", dept:"QA",      phone:"32109 87654",status:"active",  joined:"Apr 2023",salary:"₹27,000",rating:4.6},
];
let SCHEDULE = {
  1:["morning","morning","morning","evening","evening","off","off"],
  2:["evening","evening","morning","morning","morning","morning","off"],
  3:["morning","off","morning","morning","evening","evening","morning"],
  4:["night","night","off","night","night","off","night"],
  5:["off","off","off","off","off","off","off"],
  6:["evening","morning","evening","evening","off","morning","evening"],
  7:["morning","morning","evening","off","morning","morning","evening"],
};
let ANALYTICS = [
  {id:1,month:"Oct",orders:2840,efficiency:87,revenue:284000},
  {id:2,month:"Nov",orders:3120,efficiency:89,revenue:312000},
  {id:3,month:"Dec",orders:3780,efficiency:84,revenue:378000},
  {id:4,month:"Jan",orders:3240,efficiency:91,revenue:324000},
  {id:5,month:"Feb",orders:3560,efficiency:93,revenue:356000},
  {id:6,month:"Mar",orders:3890,efficiency:95,revenue:389000},
];
let ATTENDANCE = [
  {id:1,name:"Priya S.", values:[100,100,100,100,100,null,null]},
  {id:2,name:"Ravi K.",  values:[100,100,80, 100,100,100, null]},
  {id:3,name:"Anjali M.",values:[100,null,100,100,80, 80,  100]},
  {id:4,name:"Deepak N.",values:[80, 80, null,80, 80, null,80]},
  {id:5,name:"Kavya R.", values:[100,100,80, null,100,100,80]},
];

/* ── STATE ── */
let currentPage = "staff";
let staffSearch = "";
let staffFilter = "all";
let staffModalMode = null; // "add"|"edit"
let staffEditId = null;
let staffForm = {};
let shiftEditCell = null;
let shiftNewShift = "morning";
let shiftBulkModal = false;
let shiftBulkForm = {staffId:"",shift:"morning",days:[]};
let perfModal = false;
let perfForm = {};
let perfEditId = null;
let attModal = false;
let attForm = {};
let attEditId = null;

/* ── UTILS ── */
const uid = () => Date.now() + Math.random();
const initials = n => n.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const colorFor = i => COLORS[i % COLORS.length];
const shiftInfo = val => SHIFT_OPTS.find(s=>s.val===val) || SHIFT_OPTS[3];
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.innerHTML = "✓ " + esc(msg);
  el.style.display = "flex";
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.display = "none"; }, 2600);
}

/* ── NAV ── */
const META = {
  staff:     {title:"Staff Directory", sub:"Add, edit & manage your team"},
  shifts:    {title:"Shift Planner",   sub:"Weekly schedule — click any cell to edit"},
  analytics: {title:"Analytics",       sub:"Performance data & attendance"},
};

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    currentPage = btn.dataset.page;
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("pageTitle").textContent = META[currentPage].title;
    document.getElementById("pageSub").textContent = META[currentPage].sub;
    render();
  });
});

// Set today's date
document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-IN",{weekday:"short",month:"short",day:"numeric",year:"numeric"});

/* ── RENDER DISPATCH ── */
function render() {
  const c = document.getElementById("content");
  if (currentPage === "staff")     c.innerHTML = renderStaffPage();
  if (currentPage === "shifts")    c.innerHTML = renderShiftsPage();
  if (currentPage === "analytics") c.innerHTML = renderAnalyticsPage();
  bindPageEvents();
}

/* ── STAT CARD ── */
function statCard(icon,label,value,delta,up,color) {
  return `<div class="stat-card ${color}">
    <div class="stat-icon">${icon}</div>
    <div class="stat-val">${value}</div>
    <div class="stat-label">${label}</div>
    <div class="stat-delta ${up?"delta-pos":"delta-neg"}">${delta}</div>
  </div>`;
}

/* ══════════════════════════════════════════
   STAFF PAGE
══════════════════════════════════════════ */
function renderStaffPage() {
  const q = staffSearch.toLowerCase();
  const filtered = STAFF.filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)) &&
    (staffFilter === "all" || s.status === staffFilter)
  );

  const stats = `<div class="stats-row">
    ${statCard("👨‍🍳","Total Staff",STAFF.length,"Full team",true,"saffron")}
    ${statCard("✅","Active",STAFF.filter(s=>s.status==="active").length,"On duty",true,"green")}
    ${statCard("🏖️","On Leave",STAFF.filter(s=>s.status==="on-leave").length,"Planned absence",true,"blue")}
    ${statCard("⚠️","Inactive",STAFF.filter(s=>s.status==="inactive").length,"Needs review",false,"red")}
  </div>`;

  const statusBadge = s => {
    if (s==="active")   return `<span class="badge badge-green">● Active</span>`;
    if (s==="on-leave") return `<span class="badge badge-saffron">◐ On Leave</span>`;
    return `<span class="badge badge-muted">○ Inactive</span>`;
  };

  let tableBody = filtered.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🔍</div><p>No staff match your search.</p></div>`
    : `<div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Phone</th><th>Salary</th><th>Joined</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${filtered.map((s,i) => `
          <tr>
            <td><div class="td-name"><div class="mini-av" style="background:${colorFor(i)}">${initials(s.name)}</div><span style="font-weight:600">${esc(s.name)}</span></div></td>
            <td>${esc(s.role)}</td>
            <td><span class="badge badge-blue">${esc(s.dept)}</span></td>
            <td style="font-family:var(--mono);font-size:12px">${esc(s.phone||"—")}</td>
            <td style="font-family:var(--mono);font-size:12px;font-weight:600">${esc(s.salary||"—")}</td>
            <td style="color:var(--muted);font-size:12px">${esc(s.joined)}</td>
            <td><span style="color:var(--saffron);font-weight:700">★ ${s.rating}</span></td>
            <td>${statusBadge(s.status)}</td>
            <td><div style="display:flex;gap:4px">
              <button class="btn btn-outline btn-sm staff-edit-btn" data-id="${s.id}">✏️ Edit</button>
              <button class="btn btn-danger btn-sm staff-del-btn" data-id="${s.id}">🗑️</button>
            </div></td>
          </tr>`).join("")}
        </tbody>
      </table></div>`;

  const card = `<div class="card">
    <div class="card-head">
      <div><div class="card-title">Staff Directory</div><div class="card-sub">${filtered.length} of ${STAFF.length} members</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input class="form-input" id="staffSearchInput" placeholder="Search…" value="${esc(staffSearch)}" style="width:155px"/>
        <select class="form-input form-select" id="staffFilterSelect" style="width:125px">
          <option value="all" ${staffFilter==="all"?"selected":""}>All Status</option>
          <option value="active" ${staffFilter==="active"?"selected":""}>Active</option>
          <option value="on-leave" ${staffFilter==="on-leave"?"selected":""}>On Leave</option>
          <option value="inactive" ${staffFilter==="inactive"?"selected":""}>Inactive</option>
        </select>
        <button class="btn btn-primary btn-sm" id="staffAddBtn">＋ Add Staff</button>
      </div>
    </div>
    ${tableBody}
  </div>`;

  return stats + card;
}

const path = require('path');

app.use(express.static(path.join(__dirname, '../frontend')));

function openStaffModal(mode, id) {
  staffModalMode = mode;
  if (mode === "add") {
    staffForm = {name:"",role:"",dept:"Kitchen",phone:"",salary:"",status:"active",joined:"",rating:"4.0"};
    staffEditId = null;
  } else {
    const s = STAFF.find(x=>x.id===id);
    staffForm = {name:s.name,role:s.role,dept:s.dept,phone:s.phone,salary:s.salary,status:s.status,joined:s.joined,rating:String(s.rating)};
    staffEditId = id;
  }
  renderStaffModal();
}

function renderStaffModal() {
  const title = staffModalMode==="add" ? "Add New Staff" : "Edit Staff";
  const btnLabel = staffModalMode==="add" ? "Add Member" : "Save Changes";
  document.getElementById("modalBox").style.maxWidth = "";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head">
      <span class="modal-title">${title}</span>
      <button class="btn-ghost" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Full Name *</label>
          <input class="form-input" id="sf-name" placeholder="e.g. Arjun Kumar" value="${esc(staffForm.name)}"/></div>
        <div class="form-group"><label class="form-label">Role *</label>
          <input class="form-input" id="sf-role" placeholder="e.g. Sous Chef" value="${esc(staffForm.role)}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Department</label>
          <select class="form-input form-select" id="sf-dept">
            ${["Kitchen","Dispatch","QA","Management"].map(d=>`<option ${staffForm.dept===d?"selected":""}>${d}</option>`).join("")}
          </select></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select class="form-input form-select" id="sf-status">
            <option value="active" ${staffForm.status==="active"?"selected":""}>Active</option>
            <option value="on-leave" ${staffForm.status==="on-leave"?"selected":""}>On Leave</option>
            <option value="inactive" ${staffForm.status==="inactive"?"selected":""}>Inactive</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label>
          <input class="form-input" id="sf-phone" placeholder="98765 43210" value="${esc(staffForm.phone)}"/></div>
        <div class="form-group"><label class="form-label">Monthly Salary</label>
          <input class="form-input" id="sf-salary" placeholder="₹28,000" value="${esc(staffForm.salary)}"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Joined (e.g. Mar 2024)</label>
          <input class="form-input" id="sf-joined" placeholder="Mar 2024" value="${esc(staffForm.joined)}"/></div>
        <div class="form-group"><label class="form-label">Rating (0–5)</label>
          <input class="form-input" id="sf-rating" type="number" min="0" max="5" step="0.1" value="${esc(staffForm.rating)}"/></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="modalCancel">Cancel</button>
      <button class="btn btn-primary" id="staffSaveBtn">${btnLabel}</button>
    </div>`;
  showModal();
  document.getElementById("modalClose").onclick = hideModal;
  document.getElementById("modalCancel").onclick = hideModal;
  document.getElementById("staffSaveBtn").onclick = saveStaff;
}

function saveStaff() {
  const name = document.getElementById("sf-name").value.trim();
  const role = document.getElementById("sf-role").value.trim();
  if (!name || !role) return;
  const data = {
    name, role,
    dept:   document.getElementById("sf-dept").value,
    status: document.getElementById("sf-status").value,
    phone:  document.getElementById("sf-phone").value,
    salary: document.getElementById("sf-salary").value,
    joined: document.getElementById("sf-joined").value,
    rating: parseFloat(document.getElementById("sf-rating").value) || 4.0,
  };
  if (staffModalMode === "add") {
    data.id = uid();
    data.joined = data.joined || new Date().toLocaleDateString("en-IN",{month:"short",year:"numeric"});
    STAFF.push(data);
    showToast("Staff member added");
  } else {
    STAFF = STAFF.map(s => s.id===staffEditId ? {...s,...data} : s);
    showToast("Staff member updated");
  }
  hideModal();
  render();
}

function deleteStaff(id) {
  const s = STAFF.find(x=>x.id===id);
  showConfirm("Remove Staff Member?", `"${s.name}" will be permanently deleted.`, () => {
    STAFF = STAFF.filter(x=>x.id!==id);
    showToast("Staff member removed");
    render();
  });
}

/* ══════════════════════════════════════════
   SHIFTS PAGE
══════════════════════════════════════════ */
function renderShiftsPage() {
  const active = STAFF.filter(s=>s.status!=="inactive");
  const todayIdx = (new Date().getDay()+6)%7;

  const counts = DAYS.map((_,di) => {
    const c = {morning:0,evening:0,night:0,absent:0};
    active.forEach(s => {
      const sh = SCHEDULE[s.id]?.[di];
      if (sh && sh!=="off") c[sh] = (c[sh]||0)+1;
    });
    return c;
  });

  const stats = `<div class="stats-row">
    ${statCard("🌅","Morning Today",counts[todayIdx].morning,"6am – 2pm",true,"saffron")}
    ${statCard("🌆","Evening Today",counts[todayIdx].evening,"2pm – 10pm",true,"blue")}
    ${statCard("🌙","Night Today",counts[todayIdx].night,"10pm – 6am",true,"green")}
    ${statCard("❌","Absent Today",counts[todayIdx].absent,"Unplanned",false,"red")}
  </div>`;

  const unscheduled = active.filter(s=>!SCHEDULE[s.id]);
  let alertHtml = "";
  if (unscheduled.length > 0) {
    alertHtml = `<div class="alert alert-info">
      <span>ℹ️</span>
      <span style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
        <strong>${unscheduled.length} staff not yet scheduled:</strong>
        ${unscheduled.map(s=>s.name.split(" ")[0]).join(", ")}.
        ${unscheduled.map(s=>`<button class="btn btn-success btn-sm shift-add-btn" data-id="${s.id}">+ Add ${esc(s.name.split(" ")[0])}</button>`).join("")}
      </span>
    </div>`;
  }

  const scheduledStaff = active.filter(s=>SCHEDULE[s.id]);
  let gridRows = "";
  scheduledStaff.forEach((s,si) => {
    gridRows += `<div class="shift-name-cell">
      <div class="mini-av" style="width:24px;height:24px;font-size:10px;background:${colorFor(si)}">${initials(s.name)}</div>
      <span style="flex:1;font-size:11px">${esc(s.name.split(" ")[0])}</span>
      <button class="btn-ghost" style="font-size:11px;padding:1px 4px" title="Remove from schedule" data-rmid="${s.id}">✕</button>
    </div>`;
    DAYS.forEach((_,di) => {
      const sh = SCHEDULE[s.id]?.[di] || "off";
      const info = shiftInfo(sh);
      gridRows += `<button class="shift-cell ${info.cls} shift-cell-btn" data-sid="${s.id}" data-di="${di}">
        <span>${info.label}</span>
        ${info.time?`<span class="shift-time-tag">${info.time}</span>`:""}
      </button>`;
    });
  });

  const card = `<div class="card">
    <div class="card-head">
      <div><div class="card-title">Weekly Shift Schedule</div><div class="card-sub">Click any cell to edit a shift</div></div>
      <button class="btn btn-outline btn-sm" id="bulkAssignBtn">⚡ Bulk Assign</button>
    </div>
    <div class="card-body" style="overflow-x:auto">
      <div class="shift-grid">
        <div></div>
        ${DAYS.map((d,i)=>`<div class="shift-head-cell" style="${i===todayIdx?"color:var(--saffron);font-weight:700":""}">${d}${i===todayIdx?" ●":""}</div>`).join("")}
        ${gridRows}
      </div>
    </div>
  </div>`;

  return stats + alertHtml + card;
}

function openShiftCellModal(sId, dIdx) {
  sId = Number(sId);
  shiftEditCell = {sId, dIdx};
  shiftNewShift = SCHEDULE[sId]?.[dIdx] || "off";
  const s = STAFF.find(x=>x.id===sId);
  document.getElementById("modalBox").style.maxWidth = "340px";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head">
      <span class="modal-title">Edit Shift</span>
      <button class="btn-ghost" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:var(--muted)"><strong style="color:var(--charcoal)">${esc(s?.name)}</strong> — ${DAYS[dIdx]}</p>
      <div class="form-group"><label class="form-label">Shift Type</label>
        <select class="form-input form-select" id="shiftTypeSelect">
          ${SHIFT_OPTS.map(o=>`<option value="${o.val}" ${shiftNewShift===o.val?"selected":""}>${o.label}${o.time?` (${o.time})`:""}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="modalCancel">Cancel</button>
      <button class="btn btn-primary" id="shiftSaveBtn">Save</button>
    </div>`;
  showModal();
  document.getElementById("modalClose").onclick = hideModal;
  document.getElementById("modalCancel").onclick = hideModal;
  document.getElementById("shiftSaveBtn").onclick = saveShiftCell;
}

function saveShiftCell() {
  const val = document.getElementById("shiftTypeSelect").value;
  const {sId,dIdx} = shiftEditCell;
  if (!SCHEDULE[sId]) SCHEDULE[sId] = Array(7).fill("off");
  SCHEDULE[sId] = SCHEDULE[sId].map((s,i) => i===dIdx ? val : s);
  showToast("Shift updated");
  hideModal();
  render();
}

function openBulkModal() {
  shiftBulkForm = {staffId:"",shift:"morning",days:[]};
  const active = STAFF.filter(s=>s.status!=="inactive");
  document.getElementById("modalBox").style.maxWidth = "";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head">
      <span class="modal-title">⚡ Bulk Assign Shifts</span>
      <button class="btn-ghost" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Staff Member</label>
        <select class="form-input form-select" id="bulk-staff">
          <option value="">Select staff…</option>
          ${active.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Shift to Apply</label>
        <select class="form-input form-select" id="bulk-shift">
          ${SHIFT_OPTS.map(o=>`<option value="${o.val}">${o.label}${o.time?` (${o.time})`:""}</option>`).join("")}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Apply to Days</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
          ${DAYS.map((d,i)=>`<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer">
            <input type="checkbox" class="bulk-day-cb" value="${i}"/> ${d}
          </label>`).join("")}
          <button class="btn btn-ghost btn-sm" id="bulk-all">All</button>
          <button class="btn btn-ghost btn-sm" id="bulk-none">None</button>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="modalCancel">Cancel</button>
      <button class="btn btn-primary" id="bulkApplyBtn">Apply</button>
    </div>`;
  showModal();
  document.getElementById("modalClose").onclick = hideModal;
  document.getElementById("modalCancel").onclick = hideModal;
  document.getElementById("bulk-all").onclick = () => {
    document.querySelectorAll(".bulk-day-cb").forEach(cb => cb.checked=true);
  };
  document.getElementById("bulk-none").onclick = () => {
    document.querySelectorAll(".bulk-day-cb").forEach(cb => cb.checked=false);
  };
  document.getElementById("bulkApplyBtn").onclick = applyBulk;
}

function applyBulk() {
  const staffId = Number(document.getElementById("bulk-staff").value);
  const shift = document.getElementById("bulk-shift").value;
  const days = [...document.querySelectorAll(".bulk-day-cb:checked")].map(cb=>Number(cb.value));
  if (!staffId || days.length===0) return;
  if (!SCHEDULE[staffId]) SCHEDULE[staffId] = Array(7).fill("off");
  SCHEDULE[staffId] = SCHEDULE[staffId].map((s,i) => days.includes(i) ? shift : s);
  showToast("Bulk shifts applied");
  hideModal();
  render();
}

function removeFromSchedule(id) {
  id = Number(id);
  const s = STAFF.find(x=>x.id===id);
  showConfirm("Remove from Schedule?", `${s?.name}'s week will be cleared.`, () => {
    delete SCHEDULE[id];
    showToast("Removed from schedule");
    render();
  });
}

function addToSchedule(id) {
  id = Number(id);
  if (!SCHEDULE[id]) {
    SCHEDULE[id] = Array(7).fill("off");
    showToast("Staff added to schedule");
    render();
  }
}

/* ══════════════════════════════════════════
   ANALYTICS PAGE
══════════════════════════════════════════ */
function renderAnalyticsPage() {
  const totalOrders = ANALYTICS.reduce((a,b)=>a+b.orders,0);
  const avgEff = ANALYTICS.length ? Math.round(ANALYTICS.reduce((a,b)=>a+b.efficiency,0)/ANALYTICS.length) : 0;

  const stats = `<div class="stats-row">
    ${statCard("📈","Total Orders",totalOrders.toLocaleString(),"All months",true,"saffron")}
    ${statCard("⚡","Avg Efficiency",`${avgEff}%`,"Historical avg",true,"green")}
    ${statCard("🗓️","Months Tracked",ANALYTICS.length,"Performance rows",true,"blue")}
    ${statCard("📋","Attendance Rows",ATTENDANCE.length,"Staff tracked",true,"red")}
  </div>`;

  const maxOrders = Math.max(...ANALYTICS.map(r=>r.orders),1);
  const chartHtml = ANALYTICS.length===0
    ? `<div class="empty-state"><div class="empty-icon">📊</div><p>No performance data. Add a month to get started.</p></div>`
    : `<div class="chart-bars">${ANALYTICS.map((r,i)=>`
        <div class="chart-col">
          <div class="chart-bar-val">${r.orders.toLocaleString()}</div>
          <div class="chart-bar" style="height:${(r.orders/maxOrders)*80}px;background:${colorFor(i)}"></div>
          <div class="chart-bar-label">${esc(r.month)}</div>
        </div>`).join("")}
      </div>`;

  const tableHtml = ANALYTICS.length===0 ? "" : `
    <div class="table-wrap"><table>
      <thead><tr><th>Month</th><th>Orders</th><th>Efficiency</th><th>Revenue</th><th>Actions</th></tr></thead>
      <tbody>${ANALYTICS.map(r=>`
        <tr>
          <td style="font-weight:600">${esc(r.month)}</td>
          <td style="font-family:var(--mono)">${r.orders.toLocaleString()}</td>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div style="width:70px;height:6px;border-radius:3px;background:var(--cream2);overflow:hidden">
              <div style="height:100%;width:${r.efficiency}%;background:var(--green);border-radius:3px"></div>
            </div>
            <span style="font-family:var(--mono);font-size:12px">${r.efficiency}%</span>
          </div></td>
          <td style="font-family:var(--mono);font-size:12px;font-weight:600">₹${r.revenue.toLocaleString()}</td>
          <td><div style="display:flex;gap:4px">
            <button class="btn btn-outline btn-sm perf-edit-btn" data-id="${r.id}">✏️ Edit</button>
            <button class="btn btn-danger btn-sm perf-del-btn" data-id="${r.id}">🗑️</button>
          </div></td>
        </tr>`).join("")}
      </tbody>
    </table></div>`;

  const perfCard = `<div class="card">
    <div class="card-head">
      <div><div class="card-title">Monthly Performance</div><div class="card-sub">Orders, efficiency & revenue</div></div>
      <button class="btn btn-primary btn-sm" id="addPerfBtn">＋ Add Month</button>
    </div>
    <div class="card-body" style="border-bottom:${ANALYTICS.length?"1px solid var(--border)":"none"}">${chartHtml}</div>
    ${tableHtml}
  </div>`;

  // Attendance heatmap
  const heatCls = v => v===null?"hoff":v===100?"h100":v>=80?"h80":v>=60?"h60":"h0";
  const heatmapHtml = ATTENDANCE.length===0
    ? `<div class="empty-state"><div class="empty-icon">📅</div><p>No attendance records yet.</p></div>`
    : `<div style="display:flex;gap:3px;margin-bottom:8px;margin-left:96px">
        ${DAYS.map(d=>`<div style="width:26px;text-align:center;font-size:10px;font-weight:600;color:var(--muted);font-family:var(--mono)">${d}</div>`).join("")}
      </div>
      ${ATTENDANCE.map(r=>`
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span class="att-name" style="font-size:11px;font-weight:600;color:var(--charcoal3);width:86px;text-align:right;flex-shrink:0;cursor:pointer;text-decoration:underline dotted" data-attid="${r.id}">${esc(r.name)}</span>
          <div style="display:flex;gap:3px">
            ${DAYS.map((_,i)=>`<div class="heat-cell ${heatCls(r.values[i])}" title="${esc(r.name)} — ${DAYS[i]}: ${r.values[i]===null?"Day off":r.values[i]+"%"}">${r.values[i]!==null?r.values[i]:"—"}</div>`).join("")}
          </div>
          <div style="display:flex;gap:4px;margin-left:4px">
            <button class="btn btn-outline btn-sm btn-icon att-edit-btn" data-attid="${r.id}">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon att-del-btn" data-attid="${r.id}">🗑️</button>
          </div>
        </div>`).join("")}
      <div style="display:flex;gap:12px;margin-top:14px;font-size:11px;color:var(--muted);flex-wrap:wrap">
        ${[["h100","100% full"],["h80","80% slight delay"],["h60","60% late"],["h0","absent"],["hoff","day off"]].map(([c,l])=>`
          <span style="display:flex;align-items:center;gap:4px">
            <span class="heat-cell ${c}" style="width:14px;height:14px;font-size:0px"></span>${l}
          </span>`).join("")}
      </div>`;

  const attCard = `<div class="card">
    <div class="card-head">
      <div><div class="card-title">Attendance Heatmap</div><div class="card-sub">Weekly attendance % per staff · click name to edit</div></div>
      <button class="btn btn-primary btn-sm" id="addAttBtn">＋ Add Row</button>
    </div>
    <div class="card-body">${heatmapHtml}</div>
  </div>`;

  return stats + perfCard + attCard;
}

function openPerfModal(id) {
  perfEditId = id || null;
  if (id) {
    const r = ANALYTICS.find(x=>x.id===id);
    perfForm = {month:r.month,orders:r.orders,efficiency:r.efficiency,revenue:r.revenue};
  } else {
    perfForm = {month:"",orders:"",efficiency:"",revenue:""};
  }
  const title = id ? "Edit Record" : "Add Month";
  const btnLabel = id ? "Save Changes" : "Add Record";
  document.getElementById("modalBox").style.maxWidth = "400px";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head">
      <span class="modal-title">${title}</span>
      <button class="btn-ghost" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Month label (e.g. Apr)</label>
        <input class="form-input" id="pf-month" placeholder="Apr" value="${esc(String(perfForm.month))}"/></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Orders Dispatched</label>
          <input class="form-input" id="pf-orders" type="number" placeholder="3500" value="${esc(String(perfForm.orders))}"/></div>
        <div class="form-group"><label class="form-label">Efficiency %</label>
          <input class="form-input" id="pf-eff" type="number" min="0" max="100" placeholder="92" value="${esc(String(perfForm.efficiency))}"/></div>
      </div>
      <div class="form-group"><label class="form-label">Revenue (₹ number)</label>
        <input class="form-input" id="pf-rev" type="number" placeholder="350000" value="${esc(String(perfForm.revenue))}"/></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="modalCancel">Cancel</button>
      <button class="btn btn-primary" id="perfSaveBtn">${btnLabel}</button>
    </div>`;
  showModal();
  document.getElementById("modalClose").onclick = hideModal;
  document.getElementById("modalCancel").onclick = hideModal;
  document.getElementById("perfSaveBtn").onclick = savePerf;
}

function savePerf() {
  const month = document.getElementById("pf-month").value.trim();
  if (!month) return;
  const row = {
    month,
    orders: Number(document.getElementById("pf-orders").value)||0,
    efficiency: Number(document.getElementById("pf-eff").value)||0,
    revenue: Number(document.getElementById("pf-rev").value)||0,
  };
  if (perfEditId) {
    ANALYTICS = ANALYTICS.map(r => r.id===perfEditId ? {...r,...row} : r);
    showToast("Record updated");
  } else {
    ANALYTICS.push({id:uid(),...row});
    showToast("Record added");
  }
  hideModal();
  render();
}

function openAttModal(id) {
  attEditId = id || null;
  if (id) {
    const r = ATTENDANCE.find(x=>x.id===id);
    attForm = {name:r.name, values:[...r.values]};
  } else {
    attForm = {name:"", values:Array(7).fill(null)};
  }
  const title = id ? "Edit Attendance" : "Add Attendance Row";
  const btnLabel = id ? "Save Changes" : "Add Row";
  document.getElementById("modalBox").style.maxWidth = "";
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head">
      <span class="modal-title">${title}</span>
      <button class="btn-ghost" id="modalClose">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Staff Name / Label</label>
        <input class="form-input" id="af-name" placeholder="e.g. Priya S." value="${esc(attForm.name)}"/></div>
      <div class="form-group"><label class="form-label">Attendance % per Day (leave blank = Day Off)</label>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:4px">
          ${DAYS.map((d,i)=>`
            <div style="display:flex;flex-direction:column;gap:3px;align-items:center">
              <span style="font-size:10px;color:var(--muted);font-family:var(--mono)">${d}</span>
              <input class="form-input att-day-input" data-idx="${i}" type="number" min="0" max="100" placeholder="—"
                value="${attForm.values[i]===null?"":attForm.values[i]}"
                style="text-align:center;padding:6px 4px;font-size:12px"/>
            </div>`).join("")}
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="modalCancel">Cancel</button>
      <button class="btn btn-primary" id="attSaveBtn">${btnLabel}</button>
    </div>`;
  showModal();
  document.getElementById("modalClose").onclick = hideModal;
  document.getElementById("modalCancel").onclick = hideModal;
  document.getElementById("attSaveBtn").onclick = saveAtt;
}

function saveAtt() {
  const name = document.getElementById("af-name").value.trim();
  if (!name) return;
  const values = [...document.querySelectorAll(".att-day-input")].map(inp =>
    inp.value==="" ? null : Number(inp.value)
  );
  if (attEditId) {
    ATTENDANCE = ATTENDANCE.map(r => r.id===attEditId ? {...r,name,values} : r);
    showToast("Attendance updated");
  } else {
    ATTENDANCE.push({id:uid(),name,values});
    showToast("Attendance row added");
  }
  hideModal();
  render();
}

/* ══════════════════════════════════════════
   MODAL HELPERS
══════════════════════════════════════════ */
function showModal() {
  document.getElementById("modalBg").style.display = "flex";
}
function hideModal() {
  document.getElementById("modalBg").style.display = "none";
}
document.getElementById("modalBg").addEventListener("click", e => {
  if (e.target === e.currentTarget) hideModal();
});

let confirmCallback = null;
function showConfirm(title, desc, onConfirm) {
  confirmCallback = onConfirm;
  document.getElementById("confirmBox").innerHTML = `
    <div class="confirm-icon">🗑️</div>
    <div class="confirm-title">${esc(title)}</div>
    <div class="confirm-desc">${esc(desc)}</div>
    <div class="confirm-actions">
      <button class="btn btn-outline" id="confirmCancel">Cancel</button>
      <button class="btn btn-danger" id="confirmOk">Yes, Delete</button>
    </div>`;
  document.getElementById("confirmBg").style.display = "flex";
  document.getElementById("confirmCancel").onclick = hideConfirm;
  document.getElementById("confirmOk").onclick = () => { hideConfirm(); confirmCallback && confirmCallback(); };
}
function hideConfirm() {
  document.getElementById("confirmBg").style.display = "none";
}
document.getElementById("confirmBg").addEventListener("click", e => {
  if (e.target === e.currentTarget) hideConfirm();
});

/* ══════════════════════════════════════════
   EVENT BINDING (after each render)
══════════════════════════════════════════ */
function bindPageEvents() {
  // Staff page
  const si = document.getElementById("staffSearchInput");
  if (si) si.addEventListener("input", e => { staffSearch=e.target.value; render(); });

  const sf = document.getElementById("staffFilterSelect");
  if (sf) sf.addEventListener("change", e => { staffFilter=e.target.value; render(); });

  const sab = document.getElementById("staffAddBtn");
  if (sab) sab.addEventListener("click", () => openStaffModal("add"));

  document.querySelectorAll(".staff-edit-btn").forEach(btn =>
    btn.addEventListener("click", () => openStaffModal("edit", Number(btn.dataset.id))));

  document.querySelectorAll(".staff-del-btn").forEach(btn =>
    btn.addEventListener("click", () => deleteStaff(Number(btn.dataset.id))));

  // Shifts page
  document.querySelectorAll(".shift-cell-btn").forEach(btn =>
    btn.addEventListener("click", () => openShiftCellModal(btn.dataset.sid, Number(btn.dataset.di))));

  document.querySelectorAll(".shift-add-btn").forEach(btn =>
    btn.addEventListener("click", () => addToSchedule(btn.dataset.id)));

  document.querySelectorAll("[data-rmid]").forEach(btn =>
    btn.addEventListener("click", () => removeFromSchedule(btn.dataset.rmid)));

  const bab = document.getElementById("bulkAssignBtn");
  if (bab) bab.addEventListener("click", openBulkModal);

  // Analytics page
  const apb = document.getElementById("addPerfBtn");
  if (apb) apb.addEventListener("click", () => openPerfModal(null));

  document.querySelectorAll(".perf-edit-btn").forEach(btn =>
    btn.addEventListener("click", () => openPerfModal(Number(btn.dataset.id))));

  document.querySelectorAll(".perf-del-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      showConfirm("Delete Record?", "This monthly entry will be removed.", () => {
        ANALYTICS = ANALYTICS.filter(r=>r.id!==Number(btn.dataset.id));
        showToast("Record deleted");
        render();
      });
    }));

  const aab = document.getElementById("addAttBtn");
  if (aab) aab.addEventListener("click", () => openAttModal(null));

  document.querySelectorAll(".att-edit-btn, .att-name").forEach(btn =>
    btn.addEventListener("click", () => openAttModal(Number(btn.dataset.attid))));

  document.querySelectorAll(".att-del-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      showConfirm("Delete Attendance?", "This attendance row will be removed.", () => {
        ATTENDANCE = ATTENDANCE.filter(r=>r.id!==Number(btn.dataset.attid));
        showToast("Row deleted");
        render();
      });
    }));
}

async function placeOrder() {
    const name = document.getElementById("name").value;
    const item = document.getElementById("item").value;
    const quantity = document.getElementById("quantity").value;

    const response = await fetch("http://localhost:3000/order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            customerName: name,
            foodItem: item,
            quantity: quantity
        })
    });

    const data = await response.text();
    alert(data);
}

/* ── INIT ── */
render();
