import os
import jinja2
from typing import Dict, Any, Optional
from ..config.parser import DistributedConfig

class PromptManager:
    def __init__(self, prompts_dir: str):
        self.prompts_dir = prompts_dir
        self.env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(prompts_dir),
            autoescape=False
        )
    
    def load_prompt(self, template_name: str, variables: Dict[str, Any], config: Optional[DistributedConfig] = None) -> str:
        try:
            template = self.env.get_template(f"{template_name}.txt")
            
            # Combine variables with config-derived context
            context = {**variables}
            if config:
                # Add rules, login instructions etc.
                context["rules_avoid"] = "\n".join([f"- {r.description}" for r in config.avoid]) or "None"
                context["rules_focus"] = "\n".join([f"- {r.description}" for r in config.focus]) or "None"
                # etc.
            
            return template.render(context)
        except Exception as e:
            raise RuntimeError(f"Failed to load prompt {template_name}: {e}")
