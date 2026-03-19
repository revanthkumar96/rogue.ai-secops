from rouge.config.parser import DistributedConfig, load_config


def test_load_config_invalid_path():
    assert load_config("non_existent_path.yaml") is None


def test_load_config_valid_file(tmp_path):
    config_content = """
authentication:
  login_type: form
  login_url: http://test.com/login
avoid:
  - description: Avoid logout
    url_path: /logout
"""
    config_file = tmp_path / "test_config.yaml"
    config_file.write_text(config_content)

    config = load_config(str(config_file))
    assert isinstance(config, DistributedConfig)
    assert config.authentication.login_url == "http://test.com/login"
    assert len(config.avoid) == 1
    assert config.avoid[0].description == "Avoid logout"
