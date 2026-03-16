import os
from typing import List

import pyotp
from mcp.server import Server
from mcp.types import TextContent, Tool


class RougeMcpServer:
    def __init__(self, target_dir: str):
        self.target_dir = target_dir
        self.server = Server("rouge-helper")
        self._setup_tools()

    def _setup_tools(self):
        @self.server.list_tools()
        async def list_tools() -> List[Tool]:
            return [
                Tool(
                    name="save_deliverable",
                    description="Save a security deliverable to a file",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "filename": {"type": "string"},
                            "content": {"type": "string"},
                        },
                        "required": ["filename", "content"],
                    },
                ),
                Tool(
                    name="generate_totp",
                    description="Generate a TOTP code from a secret",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "secret": {"type": "string"},
                        },
                        "required": ["secret"],
                    },
                ),
            ]

        @self.server.call_tool()
        async def call_tool(name: str, arguments: dict) -> List[TextContent]:
            if name == "save_deliverable":
                filename = arguments["filename"]
                content = arguments["content"]
                save_path = os.path.join(self.target_dir, "deliverables", filename)

                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, "w") as f:
                    f.write(content)

                return [TextContent(type="text", text=f"Saved deliverable to {filename}")]

            elif name == "generate_totp":
                secret = arguments["secret"]
                totp = pyotp.TOTP(secret)
                code = totp.now()
                return [TextContent(type="text", text=f"TOTP Code: {code}")]

            raise ValueError(f"Unknown tool: {name}")
