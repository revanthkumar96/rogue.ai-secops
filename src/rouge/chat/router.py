"""
Query router for chat mode.

Routes natural language queries to appropriate workflows or handlers.
"""

from enum import Enum
from typing import Optional

from ..services.llm_provider import LLMProvider


class QueryIntent(Enum):
    """Intent classification for user queries."""

    TEST_AUTOMATION = "test_automation"
    INFRASTRUCTURE = "infrastructure"
    CICD_PIPELINE = "cicd_pipeline"
    UNIFIED_DEVOPS = "unified_devops"
    CODE_ANALYSIS = "code_analysis"
    GENERAL_QUESTION = "general_question"
    SKILL_INVOCATION = "skill_invocation"


class QueryRouter:
    """Route natural language queries to appropriate handlers."""

    # Keywords for intent detection
    INTENT_KEYWORDS = {
        QueryIntent.TEST_AUTOMATION: [
            "test",
            "testing",
            "playwright",
            "selenium",
            "cypress",
            "ui test",
            "api test",
            "performance test",
            "e2e",
            "end-to-end",
        ],
        QueryIntent.INFRASTRUCTURE: [
            "infrastructure",
            "terraform",
            "kubernetes",
            "k8s",
            "aws",
            "azure",
            "gcp",
            "cloud",
            "provision",
            "deploy infrastructure",
        ],
        QueryIntent.CICD_PIPELINE: [
            "ci/cd",
            "cicd",
            "pipeline",
            "github actions",
            "jenkins",
            "gitlab",
            "deployment pipeline",
            "continuous integration",
            "continuous deployment",
        ],
        QueryIntent.CODE_ANALYSIS: [
            "analyze",
            "explain",
            "understand",
            "tell me about",
            "what is",
            "how does",
            "code review",
        ],
    }

    def __init__(self, provider: Optional[LLMProvider] = None):
        """
        Initialize query router.

        Args:
            provider: Optional LLM provider for advanced routing
        """
        self.provider = provider

    def route_query(self, query: str) -> QueryIntent:
        """
        Route query to appropriate intent.

        Uses keyword matching for now. Can be enhanced with LLM classification.

        Args:
            query: User query string

        Returns:
            QueryIntent enum
        """
        query_lower = query.lower()

        # Check for unified devops keywords (combination)
        if self._matches_multiple_intents(query_lower):
            return QueryIntent.UNIFIED_DEVOPS

        # Check each intent
        for intent, keywords in self.INTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in query_lower:
                    return intent

        # Default to general question
        return QueryIntent.GENERAL_QUESTION

    def _matches_multiple_intents(self, query_lower: str) -> bool:
        """
        Check if query matches multiple workflow intents.

        Args:
            query_lower: Lowercase query string

        Returns:
            True if matches multiple intents
        """
        matched_intents = []

        for intent in [QueryIntent.TEST_AUTOMATION, QueryIntent.INFRASTRUCTURE, QueryIntent.CICD_PIPELINE]:
            keywords = self.INTENT_KEYWORDS.get(intent, [])
            if any(keyword in query_lower for keyword in keywords):
                matched_intents.append(intent)

        return len(matched_intents) >= 2

    async def classify_with_llm(self, query: str) -> QueryIntent:
        """
        Classify query intent using LLM (advanced routing).

        Args:
            query: User query string

        Returns:
            QueryIntent enum
        """
        if not self.provider:
            return self.route_query(query)

        # Build classification prompt
        prompt = f"""Classify the following user query into one of these categories:
- test_automation: Generate test suites, UI tests, API tests, performance tests
- infrastructure: Provision cloud infrastructure, Terraform, Kubernetes
- cicd_pipeline: Create CI/CD pipelines, GitHub Actions, Jenkins
- unified_devops: Complete end-to-end automation (multiple workflows)
- code_analysis: Analyze, explain, or understand code
- general_question: General questions, help, or conversation

Query: "{query}"

Respond with only the category name."""

        messages = [{"role": "user", "content": prompt}]

        response = await self.provider.chat(messages=messages, temperature=0.0)
        intent_str = response.get("content", "").strip().lower()

        # Map response to QueryIntent
        try:
            return QueryIntent(intent_str)
        except ValueError:
            # Fallback to keyword-based routing
            return self.route_query(query)
