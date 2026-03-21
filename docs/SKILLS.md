# ROUGE Skills System

The skills system allows you to define custom automation patterns that can be triggered via natural language in chat mode.

## What are Skills?

Skills are markdown files with YAML frontmatter that:
- Define automation patterns specific to your projects
- Can be triggered by keywords in natural language
- Inject custom instructions into the LLM context
- Enable reusable, shareable automation knowledge

## Skill File Format

Skills use a simple format: YAML frontmatter + Markdown instructions

```markdown
---
name: "skill-name"
triggers: ["keyword1", "keyword2", "phrase"]
description: "Brief description of what this skill does"
metadata:
  author: "Your Name"
  version: "1.0"
  tags: ["testing", "python"]
---

# Skill Title

Detailed instructions for the LLM go here.

When this skill is invoked, the LLM should:
1. Do X
2. Then do Y
3. Finally, do Z

## Examples

```python
# Example code showing the desired output format
```

## Special Requirements

- Use specific tools or frameworks
- Follow naming conventions
- Apply specific patterns
```

## Skill Anatomy

### Frontmatter Fields

#### Required Fields

- **name**: Unique identifier for the skill (lowercase, hyphens)
- **triggers**: List of keywords/phrases that activate the skill
- **description**: Brief one-line description

#### Optional Fields

- **metadata**: Additional information (author, version, tags, etc.)
  - `author`: Skill creator
  - `version`: Version number (semver recommended)
  - `tags`: Categorization tags
  - `created`: Creation date
  - `updated`: Last update date

### Instructions Section

The markdown content after frontmatter contains:

- **Context**: Explain when and why to use this skill
- **Step-by-step instructions**: Clear, actionable steps for the LLM
- **Examples**: Code samples showing desired output
- **Requirements**: Tools, frameworks, or conventions to follow
- **Tips**: Best practices or edge cases to handle

## Creating Custom Skills

### Step 1: Identify a Pattern

Look for repetitive tasks in your workflow:
- "I always structure tests the same way"
- "We have company-specific deployment steps"
- "Our API follows a specific pattern"

### Step 2: Write the Skill

Create `~/.rouge/skills/my-skill.md`:

```markdown
---
name: "my-skill"
triggers: ["my trigger phrase"]
description: "What this skill does"
---

# Instructions

Clear, step-by-step instructions...
```

### Step 3: Test the Skill

```bash
rouge --chat
› my trigger phrase
🎯 Detected skill: my-skill
[Skill executes]
```

Or invoke directly:
```bash
› /skill my-skill
```

### Step 4: Iterate

Refine the instructions based on results:
- Add more examples
- Clarify ambiguous steps
- Add edge case handling
- Update triggers for better detection

## Example Skills

### Example 1: Python API Test Generator

```markdown
---
name: "fastapi-test-generator"
triggers: ["generate fastapi tests", "create api tests"]
description: "Generate pytest tests for FastAPI endpoints"
metadata:
  author: "DevTeam"
  version: "1.0"
  tags: ["testing", "python", "fastapi"]
---

# FastAPI Test Generator

Generate pytest tests for FastAPI endpoints following our team standards.

## Instructions

When generating tests:

1. **Use pytest-asyncio** for async test functions
2. **Create fixtures** in `conftest.py` for:
   - Test database
   - Authenticated test client
   - Sample data factories

3. **Test Structure**:
   ```python
   @pytest.mark.asyncio
   async def test_endpoint_name():
       """
       Given: Setup conditions
       When: Action performed
       Then: Expected outcome
       """
       # Arrange
       # Act
       # Assert
   ```

4. **Coverage Requirements**:
   - Happy path
   - Authentication/authorization
   - Validation errors (422)
   - Not found (404)
   - Server errors (500)

5. **File Organization**:
   ```
   tests/
     conftest.py          # Shared fixtures
     test_users.py        # User endpoints
     test_auth.py         # Auth endpoints
     factories/           # Test data factories
       user_factory.py
   ```

## Example Test

```python
import pytest
from fastapi import status

@pytest.mark.asyncio
async def test_create_user_success(client, user_factory):
    """
    Given: Valid user data
    When: POST to /users
    Then: User created with 201
    """
    # Arrange
    user_data = user_factory.build()

    # Act
    response = await client.post("/users", json=user_data)

    # Assert
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
    assert "password" not in data  # Never return password
```

## Requirements

- Use `pytest>=7.0`
- Use `httpx` for async client
- Use `factory-boy` for test data
- Run with: `pytest tests/ -v --asyncio-mode=auto`
```

### Example 2: Docker Compose Generator

```markdown
---
name: "docker-compose-generator"
triggers: ["create docker compose", "generate compose file"]
description: "Generate docker-compose.yml for development environments"
metadata:
  author: "DevOps"
  version: "1.0"
  tags: ["docker", "devops"]
---

# Docker Compose Generator

Generate production-ready docker-compose.yml files for development.

## Instructions

When creating docker-compose.yml:

1. **Version**: Use compose file format version 3.8
2. **Services**: Create services for:
   - Application container
   - Database (with persistence)
   - Redis (if needed)
   - Nginx (reverse proxy)

3. **Best Practices**:
   - Use environment variables from `.env`
   - Define health checks
   - Set restart policies
   - Configure logging
   - Use named volumes for persistence
   - Set up networks

4. **Structure**:
```yaml
version: '3.8'

services:
  app:
    build: .
    env_file: .env
    volumes:
      - .:/app
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network
    restart: unless-stopped

volumes:
  db-data:

networks:
  app-network:
    driver: bridge
```

5. **Also Create**:
   - `.env.example` with required variables
   - `.dockerignore` with exclusions
   - `Dockerfile` if not present

## Requirements

- Use official images from Docker Hub
- Pin versions for reproducibility
- Include health checks for all services
- Use multi-stage builds for production
```

### Example 3: Git Workflow

```markdown
---
name: "feature-branch-workflow"
triggers: ["start new feature", "create feature branch"]
description: "Create feature branch following team conventions"
metadata:
  author: "DevTeam"
  version: "1.0"
  tags: ["git", "workflow"]
---

# Feature Branch Workflow

Guide for creating feature branches following team conventions.

## Instructions

When starting a new feature:

1. **Update main branch**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**:
   - Format: `feature/TICKET-123-short-description`
   - Example: `feature/PROJ-456-user-authentication`

   ```bash
   git checkout -b feature/TICKET-123-description
   ```

3. **Set upstream**:
   ```bash
   git push -u origin feature/TICKET-123-description
   ```

4. **Commit conventions**:
   - Format: `type(scope): message`
   - Types: feat, fix, docs, style, refactor, test, chore
   - Example: `feat(auth): add JWT authentication`

5. **Before pushing**:
   - Run tests: `pytest`
   - Run linter: `ruff check .`
   - Format code: `ruff format .`

6. **Create PR**:
   - Title: `[TICKET-123] Short description`
   - Link to ticket in description
   - Add screenshots for UI changes
   - Request reviews from 2 team members

## Example Workflow

```bash
# Start feature
git checkout main
git pull origin main
git checkout -b feature/USER-123-login-form

# Make changes
git add .
git commit -m "feat(auth): add login form component"

# Push
git push -u origin feature/USER-123-login-form

# Create PR on GitHub
gh pr create --title "[USER-123] Add login form" --body "Implements login UI per design specs"
```
```

## Managing Skills

### Listing Skills

```bash
› /skill list
```

Shows all available skills with descriptions and triggers.

### Adding Skills

From file:
```bash
› /skill add ~/my-skills/custom-skill.md
```

From team repository:
```bash
cd ~/projects/company-rouge-skills
rouge --chat
› /skill add ./backend-api-test.md
```

### Removing Skills

```bash
› /skill remove skill-name
```

### Invoking Skills

Auto-detection (via triggers):
```bash
› generate fastapi tests for user endpoints
🎯 Detected skill: fastapi-test-generator
```

Direct invocation:
```bash
› /skill fastapi-test-generator
Query for fastapi-test-generator: create tests for /users endpoint
```

## Sharing Skills

### With Your Team

1. Create a team skills repository:
```bash
git clone git@github.com:company/rouge-skills.git
cd rouge-skills
```

2. Add skills to the repo:
```
rouge-skills/
  README.md
  skills/
    python-api-tests.md
    docker-compose.md
    terraform-aws.md
```

3. Team members install:
```bash
cd rouge-skills/skills
for skill in *.md; do
  rouge --chat
  › /skill add "$skill"
done
```

### Public Sharing

Share your skills on GitHub:
1. Create a repository (e.g., `awesome-rouge-skills`)
2. Add skills with good documentation
3. Include README with installation instructions
4. Tag with `rouge-skill` topic

## Best Practices

### Writing Clear Instructions

**Do**:
- Use numbered steps
- Include code examples
- Specify tools and versions
- Handle edge cases
- Provide context

**Don't**:
- Be vague or ambiguous
- Assume knowledge
- Skip error handling
- Forget examples

### Trigger Keywords

**Good triggers**:
- Specific: "generate fastapi tests"
- Action-oriented: "create docker compose"
- Natural: "start new feature"

**Bad triggers**:
- Too generic: "help"
- Too short: "test"
- Ambiguous: "do stuff"

### Metadata

Include useful metadata:
```yaml
metadata:
  author: "team-name"
  version: "1.2.0"
  tags: ["python", "testing", "api"]
  created: "2024-01-15"
  updated: "2024-03-20"
  dependencies: ["pytest>=7.0", "fastapi"]
  docs: "https://internal-docs.company.com/testing"
```

### Versioning

Use semantic versioning:
- `1.0.0` - Initial release
- `1.1.0` - Add new features
- `1.0.1` - Bug fixes
- `2.0.0` - Breaking changes

## Advanced Patterns

### Conditional Logic

```markdown
## Instructions

Based on the project type:

**If Python project**:
- Use pytest
- Follow PEP 8
- Add type hints

**If Node.js project**:
- Use Jest
- Follow ESLint rules
- Use TypeScript

**If Go project**:
- Use testing package
- Follow Go conventions
- Use table-driven tests
```

### Context Variables

Reference context in skills:
```markdown
## Instructions

Given:
- Repository path: {repo_path}
- Target URL: {target_url}

Analyze the repository and generate tests...
```

### Multi-Step Workflows

```markdown
## Instructions

This is a multi-step process:

1. **Phase 1: Analysis**
   - Scan repository structure
   - Identify test targets
   - Check existing tests

2. **Phase 2: Generation**
   - Create test files
   - Generate fixtures
   - Add test data

3. **Phase 3: Integration**
   - Update pytest.ini
   - Add CI configuration
   - Document test commands
```

## Troubleshooting

### Skill Not Detected

**Problem**: Trigger phrase not working
```
Solution: Check trigger keywords:
› /skill list
[Shows all triggers]
```

**Problem**: Multiple skills match
```
Solution: Use more specific trigger or invoke directly:
› /skill exact-skill-name
```

### Skill Not Loading

**Problem**: Parsing error
```
Solution: Validate YAML frontmatter:
- Check for balanced quotes
- Verify indentation
- Ensure required fields present
```

**Problem**: File not found
```
Solution: Check skills directory:
› Check ~/.rouge/skills/
› Verify file extension is .md
```

### Inconsistent Results

**Problem**: Skill produces different results
```
Solution: Make instructions more specific:
- Add more examples
- Specify exact formats
- Include validation steps
```

## Resources

- [Example Skills](../src/rouge/skills/example_skill.md)
- [Chat Mode Documentation](./CHAT_MODE.md)
- [Configuration Guide](./CONFIGURATION.md)

## Contributing

Share your skills with the community:
1. Test thoroughly
2. Document clearly
3. Add examples
4. Submit to community repository
