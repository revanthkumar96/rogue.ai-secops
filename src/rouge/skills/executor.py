"""
Skill executor for running custom skills.

Executes skills by injecting their instructions into the LLM context.
"""

from typing import Optional

from ..services.llm_provider import LLMProvider
from .loader import Skill, SkillLoader


class SkillExecutor:
    """Execute custom skills."""

    def __init__(self, skill_loader: SkillLoader, provider: LLMProvider):
        """
        Initialize skill executor.

        Args:
            skill_loader: SkillLoader instance
            provider: LLM provider for executing skills
        """
        self.skill_loader = skill_loader
        self.provider = provider

    async def execute_skill(self, skill: Skill, user_query: str, context: Optional[dict] = None) -> str:
        """
        Execute a skill with user query.

        Args:
            skill: Skill to execute
            user_query: User's query
            context: Optional context dictionary (repo_path, target_url, etc.)

        Returns:
            Skill execution result
        """
        # Build system prompt with skill instructions
        system_prompt = self._build_system_prompt(skill, context)

        # Build messages
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query},
        ]

        # Execute with LLM
        response = await self.provider.chat(messages=messages)

        return response.get("content", "")

    def _build_system_prompt(self, skill: Skill, context: Optional[dict] = None) -> str:
        """
        Build system prompt for skill execution.

        Args:
            skill: Skill to execute
            context: Optional context

        Returns:
            System prompt string
        """
        context = context or {}

        prompt = f"# {skill.name}\n\n"
        prompt += f"{skill.description}\n\n"
        prompt += "## Instructions\n\n"
        prompt += skill.instructions
        prompt += "\n\n"

        # Add context if provided
        if context:
            prompt += "## Context\n\n"
            for key, value in context.items():
                prompt += f"- **{key}**: {value}\n"
            prompt += "\n"

        prompt += (
            "Please follow the instructions above and respond to the user's query "
            "according to the skill definition."
        )

        return prompt

    async def execute_skill_by_name(self, skill_name: str, user_query: str, context: Optional[dict] = None) -> str:
        """
        Execute a skill by name.

        Args:
            skill_name: Name of skill to execute
            user_query: User's query
            context: Optional context

        Returns:
            Skill execution result

        Raises:
            ValueError: If skill not found
        """
        skill = self.skill_loader.find_skill_by_name(skill_name)
        if not skill:
            raise ValueError(f"Skill '{skill_name}' not found")

        return await self.execute_skill(skill, user_query, context)
