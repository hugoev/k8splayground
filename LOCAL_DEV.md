# KubeTask — Local Development & Testing

## Quick Start with Docker Compose

Run the full stack locally (for development/testing before pushing to Kubernetes):

```bash
docker-compose up --build
```

Then visit:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api/tasks
- **Metrics:** http://localhost:3000/metrics

## Backend Only (for quick iteration)

### Prerequisites

```bash
cd kubetask-app/backend
npm install
```

### Run with local PostgreSQL

If you have PostgreSQL running locally on `localhost:5432`:

```bash
POSTGRES_HOST=localhost \
POSTGRES_USER=kubetask \
POSTGRES_PASSWORD=changeme \
POSTGRES_DB=kubetask \
npm start
```

### Run with Docker Compose (services only)

```bash
# Start just postgres + redis (no backend/frontend)
docker-compose up postgres redis
```

Then in another terminal:

```bash
cd kubetask-app/backend
POSTGRES_HOST=localhost npm start
```

## Testing Endpoints

### Create a task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Kubernetes","assignee":"me"}'
```

### List tasks

```bash
curl http://localhost:3000/api/tasks
```

### Complete a task

```bash
curl -X PATCH http://localhost:3000/api/tasks/1/complete
```

### Check health

```bash
curl http://localhost:3000/healthz
curl http://localhost:3000/readyz
```

### View metrics

```bash
curl http://localhost:3000/metrics
```
