"""
Custom skills system for ROUGE.

Allows users to define custom automation skills via markdown files.
"""

from .executor import SkillExecutor
from .loader import Skill, SkillLoader

__all__ = ["SkillLoader", "SkillExecutor", "Skill"]
