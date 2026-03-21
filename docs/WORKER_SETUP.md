# ROUGE Worker Setup Guide

This guide explains how to set up and run the Temporal worker for ROUGE workflows.

## What is the Worker?

The **worker** is a background process that executes ROUGE workflows. When you start a workflow in chat mode or via CLI, the workflow instructions are sent to Temporal, and the worker picks them up and executes them.

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   ROUGE     │─────▶│   Temporal   │─────▶│   Worker    │
│   CLI/Chat  │      │   Server     │      │   Process   │
└─────────────┘      └──────────────┘      └─────────────┘
     Start                Orchestrate           Execute
   Workflow              State/Retry            Workflow
```

**Without a running worker, workflows will fail!**

## Quick Start

### 1. Start Temporal Server

In terminal 1:
```bash
temporal server start-dev
```

This starts the Temporal development server with a built-in UI at http://localhost:8233.

### 2. Start ROUGE Worker

In terminal 2:
```bash
cd rouge
uv run rouge worker
```

You should see:
```
🤖 ROUGE Worker started
📋 Polling task queue: rouge-task-queue
✨ Ready to execute workflows...
```

### 3. Use ROUGE

In terminal 3 (or the same terminal after starting worker in background):
```bash
cd rouge
uv run rouge
```

Now chat mode will work and workflows can execute!

## Detailed Setup

### Starting Temporal Server

The Temporal server is required for orchestration. ROUGE auto-downloads the Temporal CLI on first run.

**Option 1: Development Server (Recommended)**
```bash
temporal server start-dev
```

This starts:
- Temporal server on `localhost:7233`
- Web UI on `http://localhost:8233`
- SQLite persistence
- Perfect for local development

**Option 2: Docker**
```bash
docker run --rm -it \
  -p 7233:7233 \
  -p 8233:8233 \
  temporalio/auto-setup:latest
```

**Option 3: Production Setup**

For production, use Temporal Cloud or self-hosted cluster. See [Temporal docs](https://docs.temporal.io/).

### Starting the Worker

The worker must be running for workflows to execute.

**Foreground (recommended for development)**:
```bash
uv run rouge worker
```

Press Ctrl+C to stop.

**Background**:
```bash
# Linux/macOS
nohup uv run rouge worker > worker.log 2>&1 &

# Windows
start /B uv run rouge worker
```

**As a Service** (production):

Create a systemd service (Linux):
```ini
[Unit]
Description=ROUGE Temporal Worker
After=network.target

[Service]
Type=simple
User=rouge
WorkingDirectory=/opt/rouge
ExecStart=/usr/local/bin/uv run rouge worker
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save to `/etc/systemd/system/rouge-worker.service`, then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable rouge-worker
sudo systemctl start rouge-worker
```

## Verifying Setup

### Check Temporal Server

```bash
# Should show server info
temporal server health

# Or visit web UI
open http://localhost:8233
```

### Check Worker Status

**Method 1: Temporal CLI**
```bash
temporal task-queue describe --task-queue rouge-task-queue
```

You should see active pollers.

**Method 2: Temporal Web UI**
1. Go to http://localhost:8233
2. Click "Task Queues" in the left sidebar
3. Find `rouge-task-queue`
4. Should show active workers

**Method 3: Worker Logs**
The worker prints:
```
🤖 ROUGE Worker started
📋 Polling task queue: rouge-task-queue
✨ Ready to execute workflows...
```

## Common Issues

### "No Workers Running" Error

**Problem**: You see "No Workers polling the rouge-task-queue Task Queue"

**Solution**:
1. Make sure Temporal server is running:
   ```bash
   temporal server start-dev
   ```

2. Start the worker:
   ```bash
   uv run rouge worker
   ```

3. Try your workflow again

### Temporal Connection Failed

**Problem**: `Error: could not connect to temporal server`

**Cause**: Temporal server not running

**Solution**:
```bash
# Start Temporal dev server
temporal server start-dev
```

### Worker Crashes Immediately

**Problem**: Worker starts but exits immediately

**Possible Causes**:
1. Port 7233 already in use
2. Missing dependencies
3. Configuration error

**Debug Steps**:
```bash
# Check if port is in use
lsof -i :7233  # Linux/macOS
netstat -ano | findstr :7233  # Windows

# Check dependencies
uv sync

# Run worker with verbose output
uv run rouge worker --verbose
```

### Workflows Stuck in "Running"

**Problem**: Workflow starts but never completes

**Cause**: Worker stopped or crashed mid-execution

**Solution**:
1. Check worker logs for errors
2. Restart worker
3. Check Temporal UI for workflow status
4. May need to cancel stuck workflow:
   ```bash
   temporal workflow cancel --workflow-id <id>
   ```

## Worker Configuration

### Environment Variables

Configure worker behavior:

```bash
# Temporal server address
export TEMPORAL_ADDRESS=localhost:7233

# Task queue name
export TEMPORAL_TASK_QUEUE=rouge-task-queue

# Worker settings
export WORKER_MAX_CONCURRENT_ACTIVITIES=10
export WORKER_MAX_CONCURRENT_WORKFLOWS=10
```

### Custom Task Queue

To use a custom task queue:

1. Set environment variable:
   ```bash
   export TEMPORAL_TASK_QUEUE=my-custom-queue
   ```

2. Start worker:
   ```bash
   uv run rouge worker
   ```

3. Update ROUGE config:
   ```yaml
   # ~/.rouge/config.yaml
   temporal:
     task_queue: my-custom-queue
   ```

## Production Deployment

### Best Practices

1. **Use Temporal Cloud**: Managed service, no ops burden

2. **Run Multiple Workers**: For redundancy and scale
   ```bash
   # Start 3 workers
   uv run rouge worker &
   uv run rouge worker &
   uv run rouge worker &
   ```

3. **Monitor Worker Health**: Use Temporal metrics and dashboards

4. **Set Resource Limits**: Configure memory and CPU limits

5. **Use Process Manager**: systemd, supervisor, or Docker

6. **Enable Auto-Restart**: Workers should restart on failure

7. **Separate Workers by Type**: Different workers for different workflow types

### Scaling Workers

**Horizontal Scaling**:
```bash
# Start multiple worker processes
for i in {1..5}; do
  uv run rouge worker &
done
```

**Vertical Scaling**:
Increase worker concurrency:
```bash
export WORKER_MAX_CONCURRENT_ACTIVITIES=50
export WORKER_MAX_CONCURRENT_WORKFLOWS=50
uv run rouge worker
```

### Docker Deployment

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY . .

RUN pip install uv
RUN uv sync

CMD ["uv", "run", "python", "-m", "rouge worker"]
```

Build and run:
```bash
docker build -t rouge-worker .
docker run -d --name rouge-worker \
  -e TEMPORAL_ADDRESS=temporal:7233 \
  rouge-worker
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rouge-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rouge-worker
  template:
    metadata:
      labels:
        app: rouge-worker
    spec:
      containers:
      - name: worker
        image: rouge-worker:latest
        env:
        - name: TEMPORAL_ADDRESS
          value: "temporal-frontend:7233"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
```

## Monitoring

### Worker Metrics

Workers expose metrics for monitoring:

- **Activities Started**: Number of activities executed
- **Activities Completed**: Successfully finished activities
- **Activities Failed**: Failed activities
- **Workflow Tasks**: Number of workflow tasks processed
- **Task Queue Lag**: Time waiting in queue

### Temporal UI

Monitor workers at http://localhost:8233:
- Active workers count
- Task queue backlog
- Workflow execution history
- Error rates

### Logging

Worker logs include:
- Workflow starts/completions
- Activity execution
- Errors and retries
- Performance metrics

Enable debug logging:
```bash
export TEMPORAL_LOG_LEVEL=DEBUG
uv run rouge worker
```

## Troubleshooting Commands

```bash
# Check Temporal server
temporal server health

# Describe task queue
temporal task-queue describe --task-queue rouge-task-queue

# List workflows
temporal workflow list

# Get workflow details
temporal workflow describe --workflow-id <id>

# Show workflow history
temporal workflow show --workflow-id <id>

# Cancel workflow
temporal workflow cancel --workflow-id <id>

# Restart Temporal server
temporal server start-dev

# Check worker process
ps aux | grep "rouge worker"

# Kill worker (if stuck)
pkill -f "rouge worker"
```

## Alternative: Workflow-less Chat Mode

If you don't need Temporal workflows (just chat with ROUGE), you can use chat mode without running Temporal/worker:

```bash
# Just run chat mode
uv run rouge

# Use it for Q&A, guidance, skill execution
› How do I set up tests?
› Explain this architecture
› /skill example-skill
```

**Note**: Workflows (`run test`, `run infra`, etc.) won't work without Temporal/worker.

## Getting Help

If you encounter issues:

1. Check this guide
2. Review worker logs
3. Check Temporal UI at http://localhost:8233
4. See [docs/CHAT_MODE.md](CHAT_MODE.md) for chat-specific help
5. Open an issue on GitHub

## Summary

**To use ROUGE with workflows:**

1. Terminal 1: `temporal server start-dev`
2. Terminal 2: `uv run rouge worker`
3. Terminal 3: `uv run rouge`

**To use just chat mode (no workflows):**

1. `uv run rouge`
2. Use for Q&A, guidance, skills (but not `run test`, etc.)

For production, use Temporal Cloud or self-hosted cluster with multiple workers.
