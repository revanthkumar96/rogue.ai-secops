# Testing Guide for ROUGE

This document describes how to run tests and maintain test coverage for ROUGE.

## Running Tests

### Install Dependencies

First, ensure all dependencies are installed:

```bash
cd rouge
uv sync
```

### Run All Unit Tests

```bash
uv run pytest tests/test_unit_agents.py tests/test_unit_tools.py tests/test_chat_mode.py tests/test_skills.py tests/test_main_integration.py -v
```

### Run Specific Test Modules

```bash
# Chat mode tests
uv run pytest tests/test_chat_mode.py -v

# Skills system tests
uv run pytest tests/test_skills.py -v

# Integration tests
uv run pytest tests/test_main_integration.py -v

# Agent tests
uv run pytest tests/test_unit_agents.py -v

# Tool tests
uv run pytest tests/test_unit_tools.py -v
```

### Run with Coverage

```bash
uv run pytest tests/ -v --cov=src/rouge --cov-report=html --cov-report=term-missing
```

View the HTML coverage report:
```bash
# Open htmlcov/index.html in your browser
```

### Run Linting

```bash
uv run ruff check src/
```

Auto-fix linting issues:
```bash
uv run ruff check src/ --fix
```

### Run Type Checking

```bash
uv run mypy src/rouge --ignore-missing-imports
```

## Test Structure

### Unit Tests

```
tests/
├── test_unit_agents.py        # Agent registry and configuration tests
├── test_unit_tools.py          # Testing and DevOps tool tests
├── test_chat_mode.py           # Chat mode functionality tests
├── test_skills.py              # Skills system tests
└── test_main_integration.py    # Integration tests for main components
```

### Test Categories

Tests are organized by functionality:

**Agent Tests** (`test_unit_agents.py`):
- Agent registry validation
- Agent structure and metadata
- Phase and prerequisite validation
- Deliverable uniqueness

**Tool Tests** (`test_unit_tools.py`):
- Testing tools (Playwright, pytest, etc.)
- DevOps tools (Terraform, Docker, kubectl)
- Error handling

**Chat Mode Tests** (`test_chat_mode.py`):
- Command parsing (`/help`, `/stats`, etc.)
- Token tracking and cost calculation
- Configuration management

**Skills Tests** (`test_skills.py`):
- Skill file parsing
- Skill loading and discovery
- Trigger matching
- Skill management (add/remove)

**Integration Tests** (`test_main_integration.py`):
- Component integration
- Import verification
- End-to-end functionality

## CI/CD Integration

ROUGE uses GitHub Actions for continuous integration. Tests run automatically on push and pull requests.

### GitHub Workflows

**.github/workflows/ci.yml**:
- Linting (ruff)
- Unit tests (excluding E2E)
- E2E tests (on PR to main)

**.github/workflows/tests.yml**:
- Multi-OS testing (Ubuntu, Windows, macOS)
- Unit tests
- Integration tests
- Build verification
- Security scanning

### Running CI Locally

Simulate CI checks locally:

```bash
# Linting
uv run ruff check src/ --output-format=github

# Unit tests (what CI runs)
uv run pytest tests/test_unit_agents.py tests/test_unit_tools.py -v --cov=src/rouge

# Integration tests
uv run pytest tests/test_main_integration.py -v
```

## Writing New Tests

### Test File Template

```python
"""
Unit tests for <module>.

Tests <what it tests>.
"""

import pytest


class Test<Component>:
    """Test <component> functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        # Initialize test data

    def teardown_method(self):
        """Clean up after tests."""
        # Clean up resources

    def test_<feature>(self):
        """Test <specific feature>."""
        # Arrange
        # Act
        # Assert
```

### Testing Best Practices

1. **Use Descriptive Names**: Test names should describe what they test
   ```python
   def test_parse_help_command(self):
       """Test parsing /help command."""
   ```

2. **Follow AAA Pattern**: Arrange, Act, Assert
   ```python
   # Arrange
   parser = CommandParser()

   # Act
   result = parser.parse("/help")

   # Assert
   assert result.command_type == CommandType.HELP
   ```

3. **Test Edge Cases**: Don't just test happy paths
   ```python
   def test_parse_empty_input(self):
       """Test parsing empty input."""
       result = self.parser.parse("")
       assert result.command_type == CommandType.QUERY
   ```

4. **Use Fixtures**: Share setup code
   ```python
   @pytest.fixture
   def token_tracker():
       return TokenTracker()
   ```

5. **Clean Up Resources**: Use teardown or context managers
   ```python
   def teardown_method(self):
       if self.temp_file.exists():
           self.temp_file.unlink()
   ```

### Testing Async Code

For async functions, use `pytest-asyncio`:

```python
import pytest


@pytest.mark.asyncio
async def test_async_function():
    """Test async functionality."""
    result = await some_async_function()
    assert result is not None
```

### Mocking External Services

Use `pytest-mock` for mocking:

```python
def test_with_mock(mocker):
    """Test with mocked external service."""
    mock_client = mocker.patch('module.Client')
    mock_client.return_value.get.return_value = {"status": "ok"}

    result = function_that_uses_client()
    assert result["status"] == "ok"
```

## Test Coverage Goals

### Current Coverage

Run to see current coverage:
```bash
uv run pytest tests/ --cov=src/rouge --cov-report=term-missing
```

### Coverage Targets

- **Overall**: Target 70%+ coverage
- **Critical modules**: 90%+ coverage
  - `config/manager.py` - Configuration management
  - `chat/command_parser.py` - Command parsing
  - `chat/token_tracker.py` - Token tracking
  - `skills/loader.py` - Skills loading

### Coverage by Module (Current)

| Module | Coverage | Status |
|--------|----------|--------|
| `chat/command_parser.py` | 97% | ✅ Excellent |
| `chat/token_tracker.py` | 96% | ✅ Excellent |
| `skills/loader.py` | 95% | ✅ Excellent |
| `config/manager.py` | 88% | ✅ Good |
| `config/parser.py` | 89% | ✅ Good |
| `chat/chat_session.py` | 22% | ⚠️ Needs tests |
| `chat/repl.py` | 17% | ⚠️ Needs tests |
| `ui/live_display.py` | 15% | ⚠️ Needs tests |

## Debugging Failed Tests

### Verbose Output

```bash
uv run pytest tests/test_chat_mode.py -v -s
```

The `-s` flag shows print statements and console output.

### Run Single Test

```bash
uv run pytest tests/test_chat_mode.py::TestCommandParser::test_parse_help_command -v
```

### Show Full Traceback

```bash
uv run pytest tests/test_chat_mode.py --tb=long
```

### Stop on First Failure

```bash
uv run pytest tests/ -x
```

### Drop into Debugger on Failure

```bash
uv run pytest tests/test_chat_mode.py --pdb
```

## Common Test Failures

### Import Errors

**Problem**: `ModuleNotFoundError`

**Solution**: Ensure dependencies are installed:
```bash
uv sync
```

### Async Test Failures

**Problem**: `RuntimeError: no running event loop`

**Solution**: Use `@pytest.mark.asyncio` decorator:
```python
@pytest.mark.asyncio
async def test_async_function():
    ...
```

### File Not Found Errors

**Problem**: Test can't find test data files

**Solution**: Use absolute paths or Path objects:
```python
from pathlib import Path

test_file = Path(__file__).parent / "test_data" / "skill.md"
```

### Cleanup Failures

**Problem**: Test leaves files/resources behind

**Solution**: Use `teardown_method` or `finally`:
```python
def teardown_method(self):
    if self.temp_file.exists():
        self.temp_file.unlink()
```

## Performance Testing

### Benchmark Tests

For performance-critical code, use `pytest-benchmark`:

```bash
pip install pytest-benchmark
```

```python
def test_token_counting_performance(benchmark):
    """Benchmark token counting."""
    tracker = TokenTracker()
    result = benchmark(tracker.add_message_tokens, 1000, 2000, "model", "ollama")
    assert result.total_tokens == 3000
```

### Profiling

Profile tests to find slow code:

```bash
uv run pytest tests/ --profile
```

## E2E Tests

End-to-end tests are marked with `@pytest.mark.e2e`:

```python
@pytest.mark.e2e
def test_full_workflow():
    """Test complete workflow end-to-end."""
    # Full workflow test
```

Run only E2E tests:
```bash
uv run pytest -m e2e
```

Skip E2E tests:
```bash
uv run pytest -m "not e2e"
```

## Continuous Improvement

### Adding Tests for New Features

When adding new features:

1. **Write tests first** (TDD approach)
2. **Test happy path** - Normal usage
3. **Test edge cases** - Empty inputs, invalid data
4. **Test errors** - Expected failures
5. **Test integration** - How it works with other components

### Improving Coverage

To improve coverage for existing code:

1. **Identify untested code**:
   ```bash
   uv run pytest --cov=src/rouge --cov-report=html
   # Open htmlcov/index.html to see uncovered lines
   ```

2. **Write targeted tests** for uncovered lines

3. **Focus on critical paths** first

4. **Add integration tests** for complex interactions

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [pytest-cov](https://pytest-cov.readthedocs.io/)
- [pytest-mock](https://pytest-mock.readthedocs.io/)
- [Ruff Linter](https://docs.astral.sh/ruff/)

## Getting Help

If tests fail and you need help:

1. Check the error message carefully
2. Run with `-v` for verbose output
3. Check this guide for common issues
4. Review the test file to understand what it's testing
5. Ask in GitHub Discussions or Issues

## Summary

ROUGE has comprehensive unit tests covering:
- ✅ 38 agent tests
- ✅ 42 chat mode tests
- ✅ 23 skills tests
- ✅ 10 integration tests
- ✅ **Total: 113 passing tests**

All tests pass on Windows, macOS, and Linux through GitHub Actions CI.
