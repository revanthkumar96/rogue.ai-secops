"""
Unit tests for skills system.

Tests skill loading, parsing, and management.
"""

import tempfile
from pathlib import Path

import pytest

from rouge.skills.loader import SkillLoader


class TestSkillLoader:
    """Test skill loader functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        # Create temporary skills directory
        self.temp_dir = Path(tempfile.mkdtemp())
        self.loader = SkillLoader(skills_dir=self.temp_dir)

    def teardown_method(self):
        """Clean up test files."""
        # Remove test skills
        for f in self.temp_dir.glob("*.md"):
            f.unlink()
        self.temp_dir.rmdir()

    def create_test_skill(self, name: str, triggers: list, content: str = "Test instructions") -> Path:
        """Helper to create a test skill file."""
        skill_path = self.temp_dir / f"{name}.md"
        skill_content = f"""---
name: "{name}"
triggers: {triggers}
description: "Test skill"
---

# {name}

{content}
"""
        skill_path.write_text(skill_content, encoding="utf-8")
        return skill_path

    def test_parse_skill_file(self):
        """Test parsing valid skill file."""
        skill_path = self.create_test_skill(
            "test-skill",
            ["test", "demo"],
            "These are test instructions."
        )

        skill = self.loader._parse_skill_file(skill_path)
        assert skill.name == "test-skill"
        assert skill.triggers == ["test", "demo"]
        assert skill.description == "Test skill"
        assert "test instructions" in skill.instructions.lower()

    def test_parse_skill_file_missing_frontmatter(self):
        """Test parsing skill file without frontmatter fails."""
        skill_path = self.temp_dir / "invalid.md"
        skill_path.write_text("# Invalid Skill\n\nNo frontmatter", encoding="utf-8")

        with pytest.raises(ValueError, match="missing YAML frontmatter"):
            self.loader._parse_skill_file(skill_path)

    def test_parse_skill_file_missing_required_field(self):
        """Test parsing skill file without required field fails."""
        skill_path = self.temp_dir / "incomplete.md"
        skill_content = """---
name: "incomplete"
description: "Missing triggers"
---

# Incomplete
"""
        skill_path.write_text(skill_content, encoding="utf-8")

        with pytest.raises(ValueError, match="missing 'triggers'"):
            self.loader._parse_skill_file(skill_path)

    def test_find_skill_by_name(self):
        """Test finding skill by name."""
        self.create_test_skill("my-skill", ["trigger1"])
        self.loader._load_all_skills()

        skill = self.loader.find_skill_by_name("my-skill")
        assert skill is not None
        assert skill.name == "my-skill"

    def test_find_skill_by_name_not_found(self):
        """Test finding non-existent skill returns None."""
        skill = self.loader.find_skill_by_name("non-existent")
        assert skill is None

    def test_find_skill_by_trigger(self):
        """Test finding skill by trigger keyword."""
        self.create_test_skill("test-skill", ["generate tests", "create test suite"])
        self.loader._load_all_skills()

        # Should find with exact trigger
        skill = self.loader.find_skill_by_trigger("generate tests for my app")
        assert skill is not None
        assert skill.name == "test-skill"

        # Should find with partial match
        skill2 = self.loader.find_skill_by_trigger("I want to create test suite")
        assert skill2 is not None
        assert skill2.name == "test-skill"

    def test_find_skill_by_trigger_not_found(self):
        """Test finding skill with non-matching trigger returns None."""
        self.create_test_skill("test-skill", ["specific-trigger"])
        self.loader._load_all_skills()

        skill = self.loader.find_skill_by_trigger("completely different query")
        assert skill is None

    def test_list_skills(self):
        """Test listing all skills."""
        self.create_test_skill("skill1", ["t1"])
        self.create_test_skill("skill2", ["t2"])
        self.loader._load_all_skills()

        skills = self.loader.list_skills()
        assert len(skills) == 2
        skill_names = [s.name for s in skills]
        assert "skill1" in skill_names
        assert "skill2" in skill_names

    def test_add_skill_from_file(self):
        """Test adding skill from external file."""
        # Create skill in different location
        external_path = Path(tempfile.gettempdir()) / "external_skill.md"
        external_path.write_text("""---
name: "external"
triggers: ["ext"]
description: "External skill"
---

# External
""", encoding="utf-8")

        try:
            skill = self.loader.add_skill(external_path)
            assert skill.name == "external"
            assert skill.name in self.loader.skills

            # Check it was copied to skills dir
            assert (self.temp_dir / "external_skill.md").exists()
        finally:
            external_path.unlink()

    def test_remove_skill(self):
        """Test removing a skill."""
        self.create_test_skill("removable", ["rem"])
        self.loader._load_all_skills()

        assert "removable" in self.loader.skills
        result = self.loader.remove_skill("removable")
        assert result is True
        assert "removable" not in self.loader.skills

        # File should be deleted
        assert not (self.temp_dir / "removable.md").exists()

    def test_remove_nonexistent_skill(self):
        """Test removing non-existent skill returns False."""
        result = self.loader.remove_skill("non-existent")
        assert result is False

    def test_reload_skills(self):
        """Test reloading skills from disk."""
        self.create_test_skill("initial", ["i1"])
        self.loader._load_all_skills()
        assert len(self.loader.skills) == 1

        # Add another skill file
        self.create_test_skill("new", ["n1"])

        # Reload
        self.loader.reload_skills()
        assert len(self.loader.skills) == 2

    def test_skill_with_metadata(self):
        """Test skill with metadata fields."""
        skill_path = self.temp_dir / "metadata_skill.md"
        skill_content = """---
name: "metadata-skill"
triggers: ["meta"]
description: "Skill with metadata"
metadata:
  author: "Test Author"
  version: "1.0"
  tags: ["testing", "demo"]
---

# Metadata Skill
"""
        skill_path.write_text(skill_content, encoding="utf-8")

        skill = self.loader._parse_skill_file(skill_path)
        assert skill.metadata["author"] == "Test Author"
        assert skill.metadata["version"] == "1.0"
        assert skill.metadata["tags"] == ["testing", "demo"]

    def test_multiple_triggers_matching(self):
        """Test skill with multiple triggers can be found by any."""
        self.create_test_skill("multi", ["trigger1", "trigger2", "trigger3"])
        self.loader._load_all_skills()

        skill1 = self.loader.find_skill_by_trigger("use trigger1")
        skill2 = self.loader.find_skill_by_trigger("apply trigger2")
        skill3 = self.loader.find_skill_by_trigger("run trigger3")

        assert skill1 is not None
        assert skill2 is not None
        assert skill3 is not None
        assert skill1.name == skill2.name == skill3.name == "multi"
