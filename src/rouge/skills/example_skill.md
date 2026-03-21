---
name: "example-skill"
triggers: ["example", "demo skill"]
description: "Example skill demonstrating the skill definition format"
metadata:
  author: "ROUGE"
  version: "1.0"
---

# Example Skill

This is an example skill file showing the format for custom skills in ROUGE.

## What This Skill Does

This skill demonstrates how to create custom automation skills that can be triggered
by natural language in chat mode.

## Instructions for LLM

When this skill is triggered, you should:

1. **Explain the skill system**: Describe how skills work in ROUGE
2. **Show the format**: Display the skill file format with YAML frontmatter
3. **Provide examples**: Give examples of useful custom skills

## Skill File Format

Skills are markdown files with YAML frontmatter:

```markdown
---
name: "skill-name"
triggers: ["keyword1", "keyword2"]
description: "Brief description"
---

# Skill Instructions

Instructions for the LLM go here...
```

## Example Use Cases

Custom skills are useful for:

- **Project-specific workflows**: Automate your specific development patterns
- **Domain knowledge**: Encode expertise in a reusable format
- **Repetitive tasks**: Create shortcuts for common operations
- **Company standards**: Codify company-specific practices

## Creating Your Own Skills

To create a custom skill:

1. Create a new `.md` file in `~/.rouge/skills/`
2. Add YAML frontmatter with name, triggers, and description
3. Write instructions for the LLM in markdown
4. Test with `/skill <name>` in chat mode

## Tips for Writing Good Skills

- **Clear triggers**: Use specific keywords that match user intent
- **Detailed instructions**: Be explicit about what the LLM should do
- **Context-aware**: Reference provided context (repo_path, target_url, etc.)
- **Examples**: Include examples in the instructions
- **Metadata**: Add author, version, and other useful metadata
