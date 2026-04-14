const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 15000);

setInterval(() => {
  console.log(`[worker] heartbeat ${new Date().toISOString()}`);
}, intervalMs);
