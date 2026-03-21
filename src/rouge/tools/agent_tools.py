"""LangChain-compatible tools that give agents autonomous filesystem and shell access.

These tools are passed to LangGraphOllamaAgent so agents can CREATE files,
READ existing code, LIST directories, and RUN commands — instead of just
giving suggestions.

All operations are scoped inside .rouge_operations/ for isolation.
Context sharing between agents is done via shared_context.json.
"""

import json
import os
import subprocess
from typing import Optional

from langchain_core.tools import tool

from ..utils.operations import RougeOperationsManager


def create_agent_tools(repo_path: str, deliverables_dir: str):
    """Create a set of LangChain tools scoped to a specific repo path.

    Args:
        repo_path: The target repository directory the agent operates on.
        deliverables_dir: Where to save final deliverables.

    Returns:
        List of LangChain tools the agent can invoke via Ollama function calling.
    """
    # Initialize operations manager for .rouge_operations
    ops_manager = RougeOperationsManager(repo_path)

    # Use .rouge_operations/deliverables as the deliverables directory
    actual_deliverables = str(ops_manager.deliverables_path)

    @tool
    def write_file(file_path: str, content: str) -> str:
        """Create or overwrite a file in the target repository. Use this to generate test files, configs, scripts, etc.

        Args:
            file_path: Relative path from repo root (e.g., 'tests/e2e/test_homepage.py')
            content: Full file content to write
        """
        full_path = os.path.join(repo_path, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} bytes to {file_path}"

    @tool
    def read_file(file_path: str) -> str:
        """Read the contents of a file in the target repository.

        Args:
            file_path: Relative path from repo root (e.g., 'package.json', 'src/App.tsx')
        """
        full_path = os.path.join(repo_path, file_path)
        if not os.path.exists(full_path):
            return f"File not found: {file_path}"
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read()
            # Truncate very large files
            if len(content) > 50000:
                return content[:50000] + f"\n\n... [truncated, file is {len(content)} bytes total]"
            return content
        except UnicodeDecodeError:
            return f"Cannot read {file_path}: binary file"

    @tool
    def list_directory(directory_path: str = ".") -> str:
        """List files and directories in the target repository.

        Args:
            directory_path: Relative path from repo root (e.g., '.', 'src', 'tests')
        """
        full_path = os.path.join(repo_path, directory_path)
        if not os.path.exists(full_path):
            return f"Directory not found: {directory_path}"
        if not os.path.isdir(full_path):
            return f"Not a directory: {directory_path}"

        entries = []
        try:
            for entry in sorted(os.listdir(full_path)):
                entry_path = os.path.join(full_path, entry)
                if os.path.isdir(entry_path):
                    entries.append(f"  {entry}/")
                else:
                    size = os.path.getsize(entry_path)
                    entries.append(f"  {entry} ({size} bytes)")
        except PermissionError:
            return f"Permission denied: {directory_path}"

        return f"Contents of {directory_path}/:\n" + "\n".join(entries) if entries else f"{directory_path}/ is empty"

    @tool
    def run_command(command: str, working_dir: Optional[str] = None) -> str:
        """Execute a shell command in the target repository.

        Use 'uv pip install' or 'uvx' instead of 'pip install'.
        Use 'uv run pytest' instead of 'pytest'.
        Use 'uv run python' instead of 'python' or 'python3'.

        Args:
            command: Shell command to execute
            working_dir: Optional subdirectory to run in (relative to repo root)
        """
        cwd = os.path.join(repo_path, working_dir) if working_dir else repo_path
        if not os.path.exists(cwd):
            return f"Working directory not found: {cwd}"

        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=120,
            )
            output = ""
            if result.stdout:
                output += f"STDOUT:\n{result.stdout[:10000]}"
            if result.stderr:
                output += f"\nSTDERR:\n{result.stderr[:5000]}"
            if result.returncode != 0:
                output += f"\nExit code: {result.returncode}"
            return output or "Command completed successfully (no output)"
        except subprocess.TimeoutExpired:
            return "Command timed out after 120 seconds"
        except Exception as e:
            return f"Command failed: {e}"

    @tool
    def save_deliverable(filename: str, content: str) -> str:
        """Save a final deliverable file (the agent's primary output artifact).

        Deliverables are saved to .rouge_operations/deliverables/.

        Args:
            filename: Name of the deliverable file (e.g., 'framework_architecture.md')
            content: Full content of the deliverable
        """
        os.makedirs(actual_deliverables, exist_ok=True)
        save_path = os.path.join(actual_deliverables, filename)
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Deliverable saved to .rouge_operations/deliverables/{filename} ({len(content)} bytes)"

    @tool
    def read_shared_context() -> str:
        """Read the shared context from prior agent runs.

        This contains findings, discoveries, and outputs from all agents
        that ran before you in this workflow. Always read this first to
        avoid duplicating work.

        Returns:
            JSON string of the shared context store
        """
        context = ops_manager.read_context()
        if not context.get("agents"):
            return "No prior agent context found. You are the first agent in this run."
        return json.dumps(context, indent=2, default=str)

    @tool
    def write_shared_context(key: str, value: str) -> str:
        """Write your findings to the shared context for subsequent agents.

        Use this at the end of your work to share what you discovered
        (project type, frameworks found, configs created, etc.) so the
        next agent can build on your work without repeating it.

        Args:
            key: A descriptive key for what you're sharing (e.g., 'project_type', 'test_framework')
            value: The value to store (can be a JSON string for complex data)
        """
        # Try to parse value as JSON for richer context
        try:
            parsed_value = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            parsed_value = value

        # We use the key as part of the agent name context
        # The agent_name will be set by who calls this
        result = ops_manager.write_context(
            agent_name=key,
            data={"value": parsed_value},
        )

        if result.get("success"):
            return f"Context saved under key '{key}'. Subsequent agents will be able to read this."
        return f"Failed to save context: {result.get('error', 'unknown error')}"

    return [
        write_file,
        read_file,
        list_directory,
        run_command,
        save_deliverable,
        read_shared_context,
        write_shared_context,
    ]
