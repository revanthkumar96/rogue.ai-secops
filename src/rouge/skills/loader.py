"""
Skills loader for custom automation skills.

Loads and parses skill definitions from markdown files.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import yaml


@dataclass
class Skill:
    """Represents a custom skill definition."""

    name: str
    description: str
    triggers: List[str]
    instructions: str
    file_path: Path
    metadata: Dict = field(default_factory=dict)
    is_builtin: bool = False


class SkillLoader:
    """Load and manage custom skills."""

    def __init__(self, skills_dir: Optional[Path] = None):
        """
        Initialize skills loader.

        Args:
            skills_dir: Directory containing skill definitions (default: ~/.rouge/skills)
        """
        self.skills_dir = skills_dir or Path.home() / ".rouge" / "skills"
        self.skills_dir.mkdir(parents=True, exist_ok=True)

        self.skills: Dict[str, Skill] = {}
        self._load_all_skills()

    def _load_all_skills(self):
        """Load all skills from skills directory."""
        # Load user skills
        for skill_file in self.skills_dir.glob("*.md"):
            try:
                skill = self._parse_skill_file(skill_file)
                self.skills[skill.name] = skill
            except Exception as e:
                print(f"Warning: Failed to load skill from {skill_file}: {e}")

    def _parse_skill_file(self, file_path: Path) -> Skill:
        """
        Parse skill definition from markdown file.

        Skill files use YAML frontmatter followed by markdown instructions:

        ```markdown
        ---
        name: "my-skill"
        triggers: ["keyword1", "keyword2"]
        description: "What this skill does"
        ---

        # Skill Instructions

        Detailed instructions here...
        ```

        Args:
            file_path: Path to skill markdown file

        Returns:
            Skill instance

        Raises:
            ValueError: If skill file is malformed
        """
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse YAML frontmatter
        frontmatter_pattern = re.compile(r"^---\s*\n(.*?)\n---\s*\n(.*)$", re.DOTALL)
        match = frontmatter_pattern.match(content)

        if not match:
            raise ValueError(f"Skill file {file_path} missing YAML frontmatter")

        frontmatter_str = match.group(1)
        instructions = match.group(2).strip()

        # Parse frontmatter
        frontmatter = yaml.safe_load(frontmatter_str)

        # Validate required fields
        if "name" not in frontmatter:
            raise ValueError(f"Skill file {file_path} missing 'name' in frontmatter")
        if "triggers" not in frontmatter:
            raise ValueError(f"Skill file {file_path} missing 'triggers' in frontmatter")
        if "description" not in frontmatter:
            raise ValueError(f"Skill file {file_path} missing 'description' in frontmatter")

        return Skill(
            name=frontmatter["name"],
            description=frontmatter["description"],
            triggers=frontmatter["triggers"],
            instructions=instructions,
            file_path=file_path,
            metadata=frontmatter.get("metadata", {}),
            is_builtin=False,
        )

    def find_skill_by_name(self, name: str) -> Optional[Skill]:
        """
        Find skill by name.

        Args:
            name: Skill name

        Returns:
            Skill instance or None
        """
        return self.skills.get(name)

    def find_skill_by_trigger(self, query: str) -> Optional[Skill]:
        """
        Find skill by matching query against triggers.

        Args:
            query: User query string

        Returns:
            Matching Skill or None
        """
        query_lower = query.lower()

        for skill in self.skills.values():
            for trigger in skill.triggers:
                if trigger.lower() in query_lower:
                    return skill

        return None

    def list_skills(self) -> List[Skill]:
        """
        Get list of all loaded skills.

        Returns:
            List of Skill instances
        """
        return list(self.skills.values())

    def add_skill(self, skill_path: Path) -> Skill:
        """
        Add a new skill from file.

        Args:
            skill_path: Path to skill markdown file

        Returns:
            Loaded Skill instance

        Raises:
            ValueError: If skill file is invalid
        """
        skill = self._parse_skill_file(skill_path)

        # Copy to skills directory if not already there
        if skill_path.parent != self.skills_dir:
            target_path = self.skills_dir / skill_path.name
            target_path.write_text(skill_path.read_text(), encoding="utf-8")
            skill.file_path = target_path

        self.skills[skill.name] = skill
        return skill

    def remove_skill(self, name: str) -> bool:
        """
        Remove a skill.

        Args:
            name: Skill name

        Returns:
            True if skill was removed, False if not found
        """
        if name not in self.skills:
            return False

        skill = self.skills[name]

        # Delete file if it's not builtin
        if not skill.is_builtin and skill.file_path.exists():
            skill.file_path.unlink()

        del self.skills[name]
        return True

    def reload_skills(self):
        """Reload all skills from disk."""
        self.skills.clear()
        self._load_all_skills()
