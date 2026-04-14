# KubeTask App Repo

Application source for the KubeTask platform.

## Services

- `backend`: Node.js API with `/api/tasks` and `/metrics`
- `frontend`: NGINX-served static UI
- `worker`: placeholder background worker process

## Build Images

```bash
# backend
docker build -t ghcr.io/your-org/kubetask-backend:0.1.0 ./backend

# frontend
docker build -t ghcr.io/your-org/kubetask-frontend:0.1.0 ./frontend

# worker
docker build -t ghcr.io/your-org/kubetask-worker:0.1.0 ./worker
```

## Local Run (backend only)

```bash
cd backend
npm install
npm start
```

API starts on `http://localhost:3000`.
