const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.POSTGRES_USER || "kubetask",
  password: process.env.POSTGRES_PASSWORD || "changeme",
  host: process.env.POSTGRES_HOST || "localhost",
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || "kubetask"
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        assignee VARCHAR(255),
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
    `);
    console.log("Schema initialized successfully");
  } catch (err) {
    console.error("Schema initialization failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function getTasks() {
  const result = await pool.query(
    "SELECT id, title, assignee, completed, created_at as \"createdAt\", completed_at as \"completedAt\" FROM tasks ORDER BY created_at DESC"
  );
  return result.rows;
}

async function createTask(title, assignee) {
  const result = await pool.query(
    `INSERT INTO tasks (title, assignee, completed, created_at)
     VALUES ($1, $2, FALSE, NOW())
     RETURNING id, title, assignee, completed, created_at as "createdAt", completed_at as "completedAt"`,
    [title, assignee || null]
  );
  return result.rows[0];
}

async function completeTask(taskId) {
  const result = await pool.query(
    `UPDATE tasks
     SET completed = TRUE, completed_at = NOW()
     WHERE id = $1
     RETURNING id, title, assignee, completed, created_at as "createdAt", completed_at as "completedAt"`,
    [taskId]
  );
  return result.rows[0] || null;
}

async function healthCheck() {
  try {
    const result = await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error("Health check failed:", err.message);
    return false;
  }
}

module.exports = {
  pool,
  initSchema,
  getTasks,
  createTask,
  completeTask,
  healthCheck
};
