const express = require("express");
const client = require("prom-client");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3000;
let isReady = false;

app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "kubetask_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"]
});
register.registerMetric(httpRequestsTotal);

const httpRequestDuration = new client.Histogram({
  name: "kubetask_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

const dbConnectionErrors = new client.Counter({
  name: "kubetask_db_connection_errors_total",
  help: "Total database connection errors",
  labelNames: ["operation"]
});
register.registerMetric(dbConnectionErrors);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });

  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: req.path,
      status: String(res.statusCode)
    };
    httpRequestsTotal.inc(labels);
    end({ status: String(res.statusCode) });
  });

  next();
});

app.get("/healthz", async (_req, res) => {
  const dbHealthy = await db.healthCheck();
  if (!dbHealthy) {
    return res.status(503).json({ status: "unhealthy", reason: "database_unavailable" });
  }
  res.status(200).json({ status: "ok" });
});

app.get("/readyz", (_req, res) => {
  if (!isReady) {
    return res.status(503).json({ status: "not_ready", reason: "initialization_in_progress" });
  }
  res.status(200).json({ status: "ready" });
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await db.getTasks();
    res.status(200).json({ items: tasks });
  } catch (err) {
    console.error("Failed to fetch tasks:", err);
    dbConnectionErrors.inc({ operation: "get_tasks" });
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  const { title, assignee } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const task = await db.createTask(title, assignee);
    res.status(201).json(task);
  } catch (err) {
    console.error("Failed to create task:", err);
    dbConnectionErrors.inc({ operation: "create_task" });
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.patch("/api/tasks/:id/complete", async (req, res) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    const task = await db.completeTask(taskId);
    if (!task) {
      return res.status(404).json({ error: "task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error("Failed to complete task:", err);
    dbConnectionErrors.inc({ operation: "complete_task" });
    res.status(500).json({ error: "Failed to complete task" });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

async function start() {
  try {
    console.log("Initializing database schema...");
    await db.initSchema();
    isReady = true;
    console.log("Database schema initialized");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`KubeTask backend listening on port ${port}`);
  });
}

start();
