// backend/tests/tasks.test.js

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { app, Task } = require("../server");

let mongoServer;

// ─── Setup & Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
  // Spin up an in-memory MongoDB — no real DB needed
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  // Wipe all tasks between tests so they don't interfere
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ─── Helper ──────────────────────────────────────────────────────────────────

const sampleTask = {
  title: "Chop vegetables",
  staff: "Ravi Kumar",
  shift: "Morning (6AM–2PM)",
};

async function createTask(overrides = {}) {
  return request(app)
    .post("/api/tasks")
    .send({ ...sampleTask, ...overrides });
}

// ─── GET /api/tasks ───────────────────────────────────────────────────────────

describe("GET /api/tasks", () => {
  test("returns empty array when no tasks exist", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns all tasks", async () => {
    await createTask({ title: "Task A" });
    await createTask({ title: "Task B" });
    const res = await request(app).get("/api/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test("returns tasks sorted newest first", async () => {
    await createTask({ title: "First task" });
    await createTask({ title: "Second task" });
    const res = await request(app).get("/api/tasks");
    expect(res.body[0].title).toBe("Second task");
  });
});

// ─── POST /api/tasks ──────────────────────────────────────────────────────────

describe("POST /api/tasks", () => {
  test("creates a task with valid fields", async () => {
    const res = await createTask();
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(sampleTask.title);
    expect(res.body.staff).toBe(sampleTask.staff);
    expect(res.body.shift).toBe(sampleTask.shift);
  });

  test("defaults status to Pending", async () => {
    const res = await createTask();
    expect(res.body.status).toBe("Pending");
  });

  test("returns 400 if title is missing", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ staff: "Ravi Kumar", shift: "Morning (6AM–2PM)" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("returns 400 if staff is missing", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Chop veg", shift: "Morning (6AM–2PM)" });
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 if shift is missing", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Chop veg", staff: "Ravi Kumar" });
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 if body is empty", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.statusCode).toBe(400);
  });

  test("saves task to database", async () => {
    await createTask();
    const count = await Task.countDocuments();
    expect(count).toBe(1);
  });
});

// ─── PATCH /api/tasks/:id ─────────────────────────────────────────────────────

describe("PATCH /api/tasks/:id", () => {
  test("updates status from Pending to Done", async () => {
    const created = await createTask();
    const id = created.body._id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ status: "Done" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Done");
  });

  test("can toggle status back to Pending", async () => {
    const created = await createTask();
    const id = created.body._id;

    await request(app).patch(`/api/tasks/${id}`).send({ status: "Done" });
    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ status: "Pending" });

    expect(res.body.status).toBe("Pending");
  });

  test("returns 404 for non-existent task id", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/tasks/${fakeId}`)
      .send({ status: "Done" });
    expect(res.statusCode).toBe(404);
  });
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────

describe("DELETE /api/tasks/:id", () => {
  test("deletes an existing task", async () => {
    const created = await createTask();
    const id = created.body._id;

    const res = await request(app).delete(`/api/tasks/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task deleted");

    const count = await Task.countDocuments();
    expect(count).toBe(0);
  });

  test("returns 200 even for non-existent id (idempotent delete)", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/tasks/${fakeId}`);
    expect(res.statusCode).toBe(200);
  });
});

// ─── Task Model ───────────────────────────────────────────────────────────────

describe("Task model validation", () => {
  test("rejects task without required fields", async () => {
    const task = new Task({});
    let err;
    try { await task.save(); } catch (e) { err = e; }
    expect(err).toBeDefined();
    expect(err.name).toBe("ValidationError");
  });

  test("stores all fields correctly", async () => {
    const task = new Task(sampleTask);
    await task.save();
    const found = await Task.findById(task._id);
    expect(found.title).toBe(sampleTask.title);
    expect(found.staff).toBe(sampleTask.staff);
    expect(found.shift).toBe(sampleTask.shift);
    expect(found.status).toBe("Pending");
    expect(found.createdAt).toBeDefined();
  });
});
