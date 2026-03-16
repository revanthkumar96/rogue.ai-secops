# Contributing to ROUGE

Thank you for your interest in ROUGE! As an open-source project, we welcome contributions from the community.

## Development Setup

1. **Install uv**:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/rouge.git
   cd rouge
   ```

3. **Install dependencies**:
   ```bash
   uv sync
   ```

4. **Install Playwright browsers**:
   ```bash
   uv run playwright install
   ```

## Workflow

1. Create a new branch for your feature or bugfix.
2. Write tests for your changes.
3. Ensure all tests pass:
   ```bash
   uv run pytest
   ```
4. Check linting and formatting:
   ```bash
   uv run ruff check .
   uv run ruff format .
   ```
5. Submit a Pull Request.

## Code Style

We use `ruff` for linting and formatting. Please ensure your code adheres to the project's standards.

## Security

If you discover a security vulnerability, please do NOT open a public issue. Instead, report it privately to the maintainers.
