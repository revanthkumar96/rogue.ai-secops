import pytest
from rouge.services.prompt_manager import PromptManager

def test_load_prompt_missing_template(tmp_path):
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    pm = PromptManager(str(prompts_dir))
    
    with pytest.raises(RuntimeError):
        pm.load_prompt("missing", {})

def test_load_prompt_interpolation(tmp_path):
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    template_file = prompts_dir / "test.txt"
    template_file.write_text("Hello {{ name }}!")
    
    pm = PromptManager(str(prompts_dir))
    prompt = pm.load_prompt("test", {"name": "ROUGE"})
    assert prompt == "Hello ROUGE!"
