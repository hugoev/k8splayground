const express = require("express");
const client = require("prom-client");

const app = express();
const port = process.env.PORT || 3000;

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

const tasks = [];
let sequence = 1;

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

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/readyz", (_req, res) => {
  res.status(200).json({ status: "ready" });
});

app.get("/api/tasks", (_req, res) => {
  res.status(200).json({ items: tasks });
});

app.post("/api/tasks", (req, res) => {
  const { title, assignee } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const task = {
    id: sequence++,
    title,
    assignee: assignee || null,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  return res.status(201).json(task);
});

app.patch("/api/tasks/:id/complete", (req, res) => {
  const taskId = Number(req.params.id);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return res.status(404).json({ error: "task not found" });
  }

  task.completed = true;
  task.completedAt = new Date().toISOString();

  return res.status(200).json(task);
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(port, () => {
  console.log(`KubeTask backend listening on port ${port}`);
});
