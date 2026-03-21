"""
File picker utilities for ROUGE CLI.

Provides GUI file/directory selection with fallback to text input for headless environments.
"""

import os
import sys
from typing import Optional


def is_gui_available() -> bool:
    """
    Check if GUI is available for file picker dialogs.

    Returns:
        True if GUI environment is available, False otherwise
    """
    # Check if running in headless environment
    if os.environ.get("ROUGE_HEADLESS", "").lower() == "true":
        return False

    # Check for SSH session
    if os.environ.get("SSH_CONNECTION") or os.environ.get("SSH_CLIENT"):
        return False

    # Try to detect display on Linux/macOS
    if sys.platform in ["linux", "darwin"]:
        if not os.environ.get("DISPLAY"):
            return False

    # On Windows, tkinter is usually available
    if sys.platform == "win32":
        try:
            import tkinter
            # Try to create a root window to verify tkinter works
            root = tkinter.Tk()
            root.withdraw()
            root.destroy()
            return True
        except Exception:
            return False

    # For other platforms, try tkinter
    try:
        import tkinter
        return True
    except ImportError:
        return False


def select_directory_gui(title: str = "Select Directory", initial_dir: Optional[str] = None) -> Optional[str]:
    """
    Open GUI dialog to select a directory.

    Args:
        title: Dialog window title
        initial_dir: Initial directory to show

    Returns:
        Selected directory path or None if cancelled
    """
    try:
        import tkinter
        from tkinter import filedialog

        # Create root window (hidden)
        root = tkinter.Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        # Set initial directory
        if initial_dir is None:
            initial_dir = os.getcwd()

        # Show directory picker
        selected = filedialog.askdirectory(
            title=title,
            initialdir=initial_dir,
            mustexist=True
        )

        root.destroy()

        return selected if selected else None

    except Exception as e:
        print(f"Error opening file picker: {e}")
        return None


def select_file_gui(
    title: str = "Select File",
    initial_dir: Optional[str] = None,
    file_types: Optional[list] = None
) -> Optional[str]:
    """
    Open GUI dialog to select a file.

    Args:
        title: Dialog window title
        initial_dir: Initial directory to show
        file_types: List of tuples (description, pattern), e.g. [("Python Files", "*.py"), ("All Files", "*.*")]

    Returns:
        Selected file path or None if cancelled
    """
    try:
        import tkinter
        from tkinter import filedialog

        # Create root window (hidden)
        root = tkinter.Tk()
        root.withdraw()
        root.attributes('-topmost', True)

        # Set initial directory
        if initial_dir is None:
            initial_dir = os.getcwd()

        # Default file types
        if file_types is None:
            file_types = [("All Files", "*.*")]

        # Show file picker
        selected = filedialog.askopenfilename(
            title=title,
            initialdir=initial_dir,
            filetypes=file_types
        )

        root.destroy()

        return selected if selected else None

    except Exception as e:
        print(f"Error opening file picker: {e}")
        return None


async def select_directory_interactive(
    prompt: str = "Select directory",
    default: Optional[str] = None,
    instruction: Optional[str] = None
) -> str:
    """
    Interactive directory selection with GUI fallback.

    Tries GUI file picker first, falls back to text input if unavailable.

    Args:
        prompt: Prompt message for the user
        default: Default directory path
        instruction: Additional instruction text

    Returns:
        Selected directory path
    """
    import questionary
    from rich.console import Console

    console = Console()

    if default is None:
        default = os.getcwd()

    # Try GUI first
    if is_gui_available():
        console.print(f"\n[cyan]{prompt}[/cyan]")
        if instruction:
            console.print(f"[dim]{instruction}[/dim]")
        console.print("[yellow]Opening file picker dialog...[/yellow]")

        selected = select_directory_gui(title=prompt, initial_dir=default)

        if selected:
            console.print(f"[green]✓ Selected: {selected}[/green]")
            return selected
        else:
            console.print("[yellow]No directory selected, falling back to text input[/yellow]")

    # Fallback to text input
    result = await questionary.path(
        prompt,
        default=default,
        only_directories=True,
        validate=lambda path: os.path.isdir(path) or "Directory does not exist"
    ).ask_async()

    return result


async def select_file_interactive(
    prompt: str = "Select file",
    default: Optional[str] = None,
    file_types: Optional[list] = None,
    instruction: Optional[str] = None
) -> str:
    """
    Interactive file selection with GUI fallback.

    Tries GUI file picker first, falls back to text input if unavailable.

    Args:
        prompt: Prompt message for the user
        default: Default file path
        file_types: List of tuples (description, pattern)
        instruction: Additional instruction text

    Returns:
        Selected file path
    """
    import questionary
    from rich.console import Console

    console = Console()

    if default is None:
        default = os.getcwd()

    # Try GUI first
    if is_gui_available():
        console.print(f"\n[cyan]{prompt}[/cyan]")
        if instruction:
            console.print(f"[dim]{instruction}[/dim]")
        console.print("[yellow]Opening file picker dialog...[/yellow]")

        initial_dir = default if os.path.isdir(default) else os.path.dirname(default)
        selected = select_file_gui(title=prompt, initial_dir=initial_dir, file_types=file_types)

        if selected:
            console.print(f"[green]✓ Selected: {selected}[/green]")
            return selected
        else:
            console.print("[yellow]No file selected, falling back to text input[/yellow]")

    # Fallback to text input
    result = await questionary.path(
        prompt,
        default=default,
        validate=lambda path: os.path.isfile(path) or "File does not exist"
    ).ask_async()

    return result
