"""LangChain-compatible tools that give agents autonomous filesystem and shell access.

These tools are passed to LangGraphOllamaAgent so agents can CREATE files,
READ existing code, LIST directories, and RUN commands — instead of just
giving suggestions.
"""

import os
import subprocess
from typing import Optional

from langchain_core.tools import tool


def create_agent_tools(repo_path: str, deliverables_dir: str):
    """Create a set of LangChain tools scoped to a specific repo path.

    Args:
        repo_path: The target repository directory the agent operates on.
        deliverables_dir: Where to save final deliverables.

    Returns:
        List of LangChain tools the agent can invoke via Ollama function calling.
    """

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
        """Execute a shell command in the target repository (e.g., npm install, pip install, mkdir).

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

        Args:
            filename: Name of the deliverable file (e.g., 'framework_architecture.md')
            content: Full content of the deliverable
        """
        os.makedirs(deliverables_dir, exist_ok=True)
        save_path = os.path.join(deliverables_dir, filename)
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Deliverable saved to deliverables/{filename} ({len(content)} bytes)"

    return [write_file, read_file, list_directory, run_command, save_deliverable]
