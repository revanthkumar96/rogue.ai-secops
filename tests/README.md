# ROUGE Test Suite

Comprehensive test coverage for the ROUGE DevOps & Testing Automation Platform.

## Test Organization

```
tests/
├── conftest.py                          # Shared fixtures and test configuration
├── test_unit_agents.py                  # Unit tests for agent system
├── test_unit_tools.py                   # Unit tests for MCP tools
├── test_integration_workflows.py        # Integration tests for workflows
├── test_e2e_full_automation.py         # End-to-end tests for complete automation
└── README.md                            # This file
```

## Test Categories

### Unit Tests (`@pytest.mark.unit`)
Tests individual components in isolation.

- **test_unit_agents.py**: Agent registry, definitions, prerequisites, phases
- **test_unit_tools.py**: TestingTools and DevOpsTools functionality

### Integration Tests (`@pytest.mark.integration`)
Tests component interactions and workflow coordination.

- **test_integration_workflows.py**: Workflow execution, agent coordination, deliverable generation

### E2E Tests (`@pytest.mark.e2e`)
Tests complete workflows and generated code quality.

- **test_e2e_full_automation.py**: Full workflow execution, code execution, production readiness

## Running Tests

### Prerequisites

```bash
# Install dependencies
uv sync

# Install Playwright browsers (for E2E tests)
playwright install
```

### Run All Tests

```bash
# Run entire test suite
uv run pytest

# With coverage report
uv run pytest --cov=src/rouge --cov-report=html

# With verbose output
uv run pytest -v
```

### Run Specific Test Categories

```bash
# Unit tests only (fast)
uv run pytest -m unit

# Integration tests
uv run pytest -m integration

# E2E tests (slow)
uv run pytest -m e2e

# Exclude slow tests
uv run pytest -m "not slow"
```

### Run Specific Test Files

```bash
# Agent tests
uv run pytest tests/test_unit_agents.py -v

# Tool tests
uv run pytest tests/test_unit_tools.py -v

# Workflow tests
uv run pytest tests/test_integration_workflows.py -v

# E2E tests
uv run pytest tests/test_e2e_full_automation.py -v
```

### Run Specific Test Classes

```bash
# Test agent registry
uv run pytest tests/test_unit_agents.py::TestAgentRegistry -v

# Test testing tools
uv run pytest tests/test_unit_tools.py::TestTestingTools -v

# Test workflow execution
uv run pytest tests/test_integration_workflows.py::TestTestAutomationWorkflow -v
```

### Run Specific Test Functions

```bash
# Test specific agent functionality
uv run pytest tests/test_unit_agents.py::TestAgentRegistry::test_all_agents_defined -v

# Test specific tool
uv run pytest tests/test_unit_tools.py::TestTestingTools::test_run_pytest_suite -v
```

### Parallel Execution

```bash
# Run tests in parallel (faster)
uv run pytest -n auto

# Run specific number of workers
uv run pytest -n 4
```

### Coverage Reports

```bash
# Generate HTML coverage report
uv run pytest --cov=src/rouge --cov-report=html
# Open htmlcov/index.html in browser

# Generate terminal coverage report
uv run pytest --cov=src/rouge --cov-report=term-missing

# Generate XML coverage (for CI)
uv run pytest --cov=src/rouge --cov-report=xml
```

## Test Markers

Tests are organized with pytest markers:

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (medium speed)
- `@pytest.mark.e2e` - End-to-end tests (slow, comprehensive)
- `@pytest.mark.slow` - Tests that take significant time

### Custom Test Runs

```bash
# Fast tests only (unit)
uv run pytest -m "unit and not slow"

# Integration and E2E
uv run pytest -m "integration or e2e"

# Everything except E2E
uv run pytest -m "not e2e"
```

## Test Coverage Goals

- **Overall**: >80% code coverage
- **Critical paths**: >90% coverage
- **Agent system**: 100% coverage
- **MCP tools**: >85% coverage
- **Workflows**: >80% coverage

## Writing New Tests

### Unit Test Template

```python
"""Unit tests for new component"""

import pytest
from rouge.my_component import MyComponent


class TestMyComponent:
    """Unit tests for MyComponent"""

    def test_initialization(self):
        """Test component initialization"""
        component = MyComponent()
        assert component is not None

    def test_method_success(self):
        """Test successful method execution"""
        component = MyComponent()
        result = component.my_method()
        assert result["success"] is True

    def test_method_failure(self):
        """Test method handles errors"""
        component = MyComponent()
        with pytest.raises(ValueError):
            component.invalid_method()
```

### Integration Test Template

```python
"""Integration tests for workflow"""

import pytest


@pytest.mark.integration
class TestMyWorkflow:
    """Integration tests for MyWorkflow"""

    @pytest.mark.asyncio
    async def test_workflow_execution(self, my_input, temporal_env):
        """Test complete workflow execution"""
        # Test workflow coordination
        pass
```

### E2E Test Template

```python
"""E2E tests for generated code"""

import pytest


@pytest.mark.e2e
class TestGeneratedCode:
    """E2E tests for code generation"""

    @pytest.mark.slow
    def test_generated_code_is_executable(self, temp_dir):
        """Test generated code can be executed"""
        # Test end-to-end functionality
        pass
```

## Continuous Integration

Tests run automatically in CI/CD on every push and pull request.

### GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - name: Install uv
        run: pip install uv
      - name: Install dependencies
        run: uv sync
      - name: Run tests
        run: uv run pytest --cov --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Run with Debugging

```bash
# Drop into debugger on failure
uv run pytest --pdb

# Show local variables on failure
uv run pytest -l

# Show full traceback
uv run pytest --tb=long
```

### Run Specific Failed Tests

```bash
# Run only last failed tests
uv run pytest --lf

# Run failed tests first, then others
uv run pytest --ff
```

### Verbose Output

```bash
# Maximum verbosity
uv run pytest -vv

# Show print statements
uv run pytest -s

# Show test durations
uv run pytest --durations=10
```

## Test Fixtures

Common fixtures available in `conftest.py`:

- `temp_dir` - Temporary directory for test outputs
- `rouge_settings` - ROUGE configuration
- `test_automation_input` - Test automation workflow input
- `infrastructure_input` - Infrastructure workflow input
- `cicd_input` - CI/CD workflow input
- `unified_input` - Unified DevOps workflow input
- `testing_tools` - TestingTools instance
- `devops_tools` - DevOpsTools instance
- `sample_playwright_test` - Sample Playwright test code
- `sample_terraform_code` - Sample Terraform code
- `sample_github_actions_workflow` - Sample GitHub Actions workflow

## Troubleshooting

### Tests Fail with Import Errors

```bash
# Ensure src/ is in Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"

# Or use uv run
uv run pytest
```

### Temporal Tests Timeout

```bash
# Skip slow tests
uv run pytest -m "not slow"

# Increase timeout
uv run pytest --timeout=300
```

### Playwright Tests Fail

```bash
# Install Playwright browsers
playwright install

# Update Playwright
uv sync
```

## Performance

### Typical Test Execution Times

- **Unit tests**: ~5-10 seconds
- **Integration tests**: ~30-60 seconds
- **E2E tests**: ~2-5 minutes
- **Full suite**: ~5-10 minutes

### Optimizations

- Use `-n auto` for parallel execution
- Use `-m "not slow"` to skip slow tests during development
- Use `--last-failed` to run only failed tests

## Contributing

When adding new features:

1. Write unit tests for new components
2. Write integration tests for component interactions
3. Write E2E tests for user-facing features
4. Ensure coverage remains >80%
5. Run full test suite before committing

```bash
# Pre-commit check
uv run pytest -m "not slow" --cov=src/rouge
```

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Temporal Python testing](https://docs.temporal.io/develop/python/testing)
- [Coverage.py](https://coverage.readthedocs.io/)
