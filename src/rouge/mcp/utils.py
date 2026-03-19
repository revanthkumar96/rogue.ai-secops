from typing import List

from langchain_core.tools import Tool

from .server import RougeMcpServer


def mcp_to_langchain_tools(mcp_server: RougeMcpServer) -> List[Tool]:
    """
    Converts tools from a RougeMcpServer into LangChain-compatible tools.
    """
    langchain_tools = []

    # This is a simplified manual mapping for now.
    # In a more advanced implementation, we'd dynamically inspect
    # the MCP server's tools and wrap them.

    async def save_deliverable_wrapper(filename: str, content: str) -> str:
        result = await mcp_server.server.call_tool(
            "save_deliverable", {"filename": filename, "content": content}
        )
        return result[0].text

    async def generate_totp_wrapper(secret: str) -> str:
        result = await mcp_server.server.call_tool("generate_totp", {"secret": secret})
        return result[0].text

    langchain_tools.append(
        Tool(
            name="save_deliverable",
            func=save_deliverable_wrapper,
            description="Save a security deliverable to a file. Requires 'filename' and 'content'.",
        )
    )

    langchain_tools.append(
        Tool(
            name="generate_totp",
            func=generate_totp_wrapper,
            description="Generate a TOTP code from a secret string.",
        )
    )

    return langchain_tools
