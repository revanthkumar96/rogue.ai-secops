# ROUGE Chat Mode

ROUGE now features an interactive chat mode that provides a natural language interface to all automation capabilities.

## Getting Started

### Prerequisites

Before using ROUGE, you need:

1. **Temporal Server** (for workflows):
   ```bash
   # In a separate terminal
   temporal server start-dev
   ```

2. **ROUGE Worker** (for workflows):
   ```bash
   # In another terminal
   uv run rouge worker
   ```

**Note**: Chat mode works without Temporal/worker, but workflows (`run test`, `run infra`) require them. See [WORKER_SETUP.md](WORKER_SETUP.md) for details.

### First Time Setup

On first run, ROUGE will guide you through an interactive configuration wizard:

```bash
rouge
```

The wizard will ask you to:

1. **Choose LLM Provider**: Ollama (local, free) or Groq (cloud, fast)
2. **Configure Provider Settings**: API keys, base URLs, model selection
3. **Set UI Preferences**: Live token tracking, auto-save options
4. **Configure Paths**: Default directories for projects, skills, cache

Configuration is saved to `~/.rouge/config.yaml` and reused in future sessions.

### Entering Chat Mode

After configuration, simply run:

```bash
rouge
```

This enters interactive chat mode where you can:
- Ask questions in natural language
- Run automation workflows
- Manage custom skills
- Track token usage in real-time

## Chat Mode Features

### Natural Language Queries

Ask ROUGE anything about your automation needs:

```
› How do I add tests to my project?
› Set up CI/CD for my web app
› Explain this code structure
› Generate infrastructure for AWS
```

ROUGE intelligently routes queries to the appropriate workflow or provides direct answers.

### Special Commands

ROUGE supports special character commands for quick actions:

#### `/` Commands (System Commands)

- `/help` - Show available commands
- `/clear` - Clear conversation history
- `/stats` - Show detailed token usage statistics
- `/config` - View or modify configuration
- `/skill <name>` - Invoke a specific skill
- `/skill list` - List all available skills
- `/skill add <path>` - Add a custom skill
- `/skill remove <name>` - Remove a skill
- `/history` - Show conversation history
- `/export` - Export chat to markdown
- `/reset` - Reset session and clear history
- `/exit` or `/quit` - Exit chat mode

#### `?` Command (Contextual Help)

- `?` - Show contextual help
- `? <topic>` - Get help about a specific topic

Example:
```
› ? skills
[Shows help about the skills system]
```

### Live Token Tracking

ROUGE displays real-time token usage at the bottom of each response:

```
Tokens: 1,234 | Context: 45% used
```

View detailed statistics with `/stats`:
- Total input/output tokens
- Session cost (for paid APIs)
- Average tokens per message
- Context window usage
- Session duration

### Custom Skills System

ROUGE supports custom automation skills defined in markdown files.

#### Creating a Custom Skill

1. Create a file in `~/.rouge/skills/my-skill.md`:

```markdown
---
name: "my-test-generator"
triggers: ["generate my tests", "create test suite"]
description: "Generate test suites for my specific project structure"
---

# My Test Generator

When triggered, generate test suites following these rules:

1. Use pytest with our custom fixtures
2. Place tests in `tests/` directory
3. Follow naming convention: `test_<feature>.py`
4. Include docstrings with Given/When/Then format
5. Add markers for slow tests: `@pytest.mark.slow`

## Example Test Structure

```python
@pytest.mark.integration
def test_api_endpoint():
    """
    Given: API server is running
    When: POST request to /api/users
    Then: User is created and returns 201
    """
    # test implementation
```
```

2. Use the skill in chat:

```
› generate my tests for the user authentication module
🎯 Detected skill: my-test-generator
[Generates tests following your custom rules]
```

#### Managing Skills

```bash
# List available skills
› /skill list

# Add skill from file
› /skill add ~/my-skills/project-specific.md

# Remove skill
› /skill remove my-test-generator

# Invoke skill directly
› /skill my-test-generator
```

## Configuration Management

### Viewing Configuration

```
› /config
```

Shows current configuration:
- LLM provider and model
- Config file location
- Active settings

### Reconfiguring

To change configuration:

```bash
rouge --reset-config
```

This runs the configuration wizard again, allowing you to:
- Switch between Ollama and Groq
- Change models
- Update API keys
- Modify UI preferences

### Configuration File

Configuration is stored in `~/.rouge/config.yaml`:

```yaml
llm:
  provider: groq
  model: mixtral-8x7b-32768
  ollama_url: http://localhost:11434
  groq_api_key: ***xxxx  # Obfuscated in file

ui:
  theme: dark
  live_tokens: true
  auto_save_chat: true

paths:
  default_repo: ~/projects
  skills_dir: ~/.rouge/skills
  cache_dir: ~/.rouge/cache
  history_dir: ~/.rouge/history
```

### Environment Variable Overrides

You can override configuration with environment variables:

```bash
export ROUGE_PROVIDER=groq
export ROUGE_MODEL=mixtral-8x7b-32768
export GROQ_API_KEY=gsk_xxx...
```

## Chat History

### Auto-Save

If enabled in configuration, ROUGE automatically saves your chat history when you exit.

### Manual Export

Export current chat session:

```
› /export
✓ Chat history saved to: ~/.rouge/history/chat_20260321_143022.md
```

### Viewing History

```
› /history
```

Shows a summary of the current conversation.

## Token Optimization

ROUGE includes several optimizations to reduce token consumption:

### Context Window Management

- Automatically tracks context usage
- Warns when approaching limit
- Implements sliding window for long conversations
- Summarizes old messages to preserve context

### Query Routing

- Lightweight model for intent classification
- Caches common responses
- Optimized system prompts

### Cost Tracking

For paid APIs (Groq), ROUGE shows:
- Real-time cost per message
- Session total cost
- Cost estimates before execution

Example:
```
Tokens: 1,234 input | 567 output | 1,801 total
Cost: $0.0012 (session) | Context: 45% used
```

## Workflow Integration

### Triggering Workflows from Chat

ROUGE intelligently detects when you want to run a workflow:

```
› I need to add tests to my React app
[ROUGE detects test automation intent]
I can help you with test automation!

To run this workflow interactively, you can:
1. Exit chat mode with /exit
2. Run the workflow command from the main menu

Or, I can guide you through the setup here. What would you like to know?
```

### Legacy Workflow Commands

You can still use traditional commands:

```bash
# Run specific workflows
rouge run test
rouge run infra
rouge run cicd
rouge run unified

# Execute generated code
rouge execute tests
rouge execute terraform

# View results
rouge list
rouge deliverables
```

## Tips & Best Practices

### Effective Prompting

**Be specific about your needs:**
```
❌ "help me with tests"
✅ "generate Playwright tests for my React login form at http://localhost:3000"
```

**Provide context:**
```
› I have a Python FastAPI app in ~/projects/myapp.
  Generate API tests for the /users endpoints.
```

**Use skills for repetitive tasks:**
```
Create a skill for your common patterns and reuse it:
› /skill my-api-tester
```

### Managing Context

- Use `/clear` to reset context for new topics
- Use `/stats` to monitor token usage
- Export long conversations with `/export` before clearing

### Custom Skills

- Create skills for project-specific patterns
- Share skills with your team
- Version control skills in your project repository
- Use metadata to track authors and versions

## Troubleshooting

### Configuration Issues

**Problem**: GROQ API key not found
```bash
# Solution: Set environment variable
export GROQ_API_KEY=your_key_here
```

**Problem**: Ollama connection failed
```bash
# Solution: Start Ollama server
ollama serve
```

### Chat Mode Issues

**Problem**: Commands not recognized
```
# Solution: Use / prefix for commands
› /help
```

**Problem**: High token usage
```
# Solution: Clear conversation periodically
› /clear
```

### File Picker Issues

**Problem**: GUI file picker not appearing (SSH/headless)
```
# Solution: ROUGE automatically falls back to text input
# Or set headless mode:
export ROUGE_HEADLESS=true
```

## Keyboard Shortcuts

- **Ctrl+C**: Interrupt current operation (returns to prompt)
- **Ctrl+D**: Exit chat mode
- **Up Arrow**: Previous command (in some terminals)

## Next Steps

- Try the example skill: `/skill example-skill`
- Create your first custom skill
- Explore the workflow commands
- Join the community and share your skills

For more information:
- [Skills Documentation](./SKILLS.md)
- [Configuration Reference](./CONFIGURATION.md)
- [API Documentation](./API.md)
