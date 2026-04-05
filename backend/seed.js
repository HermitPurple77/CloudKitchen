// backend/seed.js
// Run with: node seed.js
// Or inside Docker: docker exec kitchen_backend node seed.js

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kitchendb";

const taskSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  staff:     { type: String, required: true },
  shift:     { type: String, required: true },
  status:    { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);

const seedTasks = [
  // Morning shift — done
  { title: "Wash and chop vegetables",        staff: "Ravi Kumar",     shift: "Morning (6AM–2PM)",    status: "Done" },
  { title: "Prepare chicken stock",           staff: "Anita Sharma",   shift: "Morning (6AM–2PM)",    status: "Done" },
  { title: "Bake sourdough bread",            staff: "Priya Nair",     shift: "Morning (6AM–2PM)",    status: "Done" },
  { title: "Set up breakfast station",        staff: "Ravi Kumar",     shift: "Morning (6AM–2PM)",    status: "Done" },
  { title: "Marinate overnight proteins",     staff: "Suresh Patel",   shift: "Morning (6AM–2PM)",    status: "Done" },

  // Morning shift — pending
  { title: "Restock dry goods from storage",  staff: "Anita Sharma",   shift: "Morning (6AM–2PM)",    status: "Pending" },
  { title: "Deep clean prep counters",        staff: "Priya Nair",     shift: "Morning (6AM–2PM)",    status: "Pending" },

  // Afternoon shift — done
  { title: "Prep lunch buffet items",         staff: "Meena Iyer",     shift: "Afternoon (2PM–10PM)", status: "Done" },
  { title: "Portion desserts for service",    staff: "Suresh Patel",   shift: "Afternoon (2PM–10PM)", status: "Done" },
  { title: "Maintain grill station temp",     staff: "Kiran Bose",     shift: "Afternoon (2PM–10PM)", status: "Done" },
  { title: "Label and date all containers",   staff: "Meena Iyer",     shift: "Afternoon (2PM–10PM)", status: "Done" },

  // Afternoon shift — pending
  { title: "Prepare dinner mise en place",    staff: "Kiran Bose",     shift: "Afternoon (2PM–10PM)", status: "Pending" },
  { title: "Restock sauce stations",          staff: "Suresh Patel",   shift: "Afternoon (2PM–10PM)", status: "Pending" },
  { title: "Check fridge temperatures",       staff: "Meena Iyer",     shift: "Afternoon (2PM–10PM)", status: "Pending" },
  { title: "Prepare soup of the day",         staff: "Kiran Bose",     shift: "Afternoon (2PM–10PM)", status: "Pending" },

  // Night shift — done
  { title: "Break down and sanitize station", staff: "Arjun Reddy",    shift: "Night (10PM–6AM)",     status: "Done" },
  { title: "Dispose kitchen waste",           staff: "Divya Menon",    shift: "Night (10PM–6AM)",     status: "Done" },
  { title: "Sweep and mop kitchen floor",     staff: "Arjun Reddy",    shift: "Night (10PM–6AM)",     status: "Done" },

  // Night shift — pending
  { title: "Prep dough for morning bake",     staff: "Divya Menon",    shift: "Night (10PM–6AM)",     status: "Pending" },
  { title: "Update inventory checklist",      staff: "Arjun Reddy",    shift: "Night (10PM–6AM)",     status: "Pending" },
  { title: "Lock cold storage units",         staff: "Divya Menon",    shift: "Night (10PM–6AM)",     status: "Pending" },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await Task.countDocuments();
    if (existing > 0) {
      console.log(`⚠️  Database already has ${existing} tasks.`);
      console.log("   Delete them first? Run: db.tasks.deleteMany({}) in mongo shell");
      console.log("   Or force re-seed by passing --force flag: node seed.js --force");

      if (!process.argv.includes("--force")) {
        await mongoose.disconnect();
        return;
      }

      await Task.deleteMany({});
      console.log("🗑️  Cleared existing tasks.");
    }

    await Task.insertMany(seedTasks);
    console.log(`🌱 Seeded ${seedTasks.length} tasks successfully!`);

    // Summary
    const done    = seedTasks.filter(t => t.status === "Done").length;
    const pending = seedTasks.filter(t => t.status === "Pending").length;
    console.log(`   ✅ Done: ${done}  ⏳ Pending: ${pending}`);
    console.log(`   👥 Staff: Ravi, Anita, Priya, Suresh, Meena, Kiran, Arjun, Divya`);

  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
  }
}

seed();
