"""
Worker status checking utilities.

Provides functions to check if Temporal worker is running.
"""

from temporalio.client import Client


async def check_worker_status(task_queue: str = "rouge-task-queue") -> bool:
    """
    Check if a worker is polling the specified task queue.

    Args:
        task_queue: Task queue name to check

    Returns:
        True if worker is running, False otherwise
    """
    try:
        client = await Client.connect("localhost:7233")

        from temporalio.api.taskqueue.v1 import TaskQueue as TaskQueueProto
        from temporalio.api.workflowservice.v1 import DescribeTaskQueueRequest

        request = DescribeTaskQueueRequest(
            namespace="default",
            task_queue=TaskQueueProto(name=task_queue),
        )
        desc = await client.workflow_service.describe_task_queue(request)
        pollers = getattr(desc, "pollers", [])
        return len(pollers) > 0
    except Exception:
        return False


def format_worker_warning() -> str:
    """
    Format a warning message about missing worker.

    Returns:
        Formatted warning string
    """
    return """
No Temporal worker detected!

Workflows will fail without a running worker.

To start the worker, run this in another terminal:
  uv run rouge worker

Or see the setup guide: docs/WORKER_SETUP.md
"""
