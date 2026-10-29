"""Sandbox tool registry (FR-AG-03, FR-AT-05).

The registry is the whitelist of everything an agent is allowed to invoke. A
tool that is not registered cannot be called: ``invoke`` returns a rejected
``ToolCallResult`` instead of running anything. That makes FR-AG-03
("attempts to use unregistered tools are rejected and recorded") a mechanical
property of the system rather than a rule the agent is trusted to follow.

Tool outputs are treated as untrusted content. This is where the "malicious
tool response" attack (AT-02) gets its injection: the controlled mock returns a
payload that *tries* to steer the agent. The registry only produces the
observation; whether that observation is acted on is the agent runtime's
decision, and whether the resulting action is permitted is the proxy's.
"""

from __future__ import annotations

from .models import ToolCallResult, ToolDefinition, ToolKind

# Registered tool ids. Kept as constants so attack definitions, agent
# configurations and tests can never drift from the registry.
WALLET_TRANSFER = "wallet.transfer"
TOKEN_READ_METADATA = "token.read_metadata"
ORACLE_GET_PRICE = "oracle.get_price"

# Alternate names per SRS & wallet tool specifications
TRANSFER_TOKEN = "transfer_token"
READ_TOKEN_METADATA = "read_token_metadata"
GET_BALANCE = "get_balance"

TOOL_ALIASES: dict[str, str] = {
    TRANSFER_TOKEN: WALLET_TRANSFER,
    READ_TOKEN_METADATA: TOKEN_READ_METADATA,
    GET_BALANCE: WALLET_TRANSFER,
}

# A tool that is deliberately *not* registered. Tests use it to prove that an
# unregistered capability is refused, and that the refusal is recorded.
UNREGISTERED_TOOL = "wallet.export_private_key"


class ToolRegistry:
    """Holds the registered sandbox tools and executes controlled calls."""

    def __init__(self, definitions: list[ToolDefinition] | None = None) -> None:
        self._tools: dict[str, ToolDefinition] = {}
        for definition in definitions or DEFAULT_TOOLS:
            self.register(definition)

    # -- registry ------------------------------------------------------------
    def register(self, definition: ToolDefinition) -> None:
        self._tools[definition.tool_id] = definition

    def get(self, tool_id: str) -> ToolDefinition | None:
        canonical = TOOL_ALIASES.get(tool_id, tool_id)
        return self._tools.get(canonical)

    def is_registered(self, tool_id: str) -> bool:
        canonical = TOOL_ALIASES.get(tool_id, tool_id)
        return canonical in self._tools

    def list_tools(self) -> list[ToolDefinition]:
        return [t.model_copy(deep=True) for t in self._tools.values()]

    def ids(self) -> set[str]:
        return set(self._tools)

    # -- execution -----------------------------------------------------------
    def invoke(
        self,
        tool_id: str,
        *,
        arguments: dict | None = None,
        outputs: dict[str, dict] | None = None,
    ) -> ToolCallResult:
        """Run a registered tool, or record a rejection for an unknown one.

        `outputs` lets a caller supply a canned result for a tool (used by the
        attack library to inject a specific payload). Without it the tool
        returns its benign default observation.
        """
        arguments = arguments or {}
        canonical = TOOL_ALIASES.get(tool_id, tool_id)
        definition = self.get(tool_id)
        if definition is None:
            return ToolCallResult(
                tool_id=tool_id,
                ok=False,
                arguments=arguments,
                rejected=True,
                rejection_reason=(
                    f"Tool {tool_id!r} is not registered for this agent configuration"
                ),
            )

        if outputs and (tool_id in outputs or canonical in outputs):
            output = dict(outputs.get(tool_id, outputs.get(canonical, {})))
        else:
            output = _DEFAULT_OUTPUTS.get(tool_id, _DEFAULT_OUTPUTS.get(canonical, {}))
        return ToolCallResult(
            tool_id=tool_id,
            ok=True,
            arguments=arguments,
            output=output,
        )


def _tool(tool_id: str, kind: ToolKind, description: str, *, proxy: bool = True) -> ToolDefinition:
    return ToolDefinition(
        tool_id=tool_id, kind=kind, description=description, requires_policy_proxy=proxy
    )


# The full sandbox tool catalogue. `wallet.transfer` is the only tool that can
# move funds, and it is the one the policy proxy guards (FR-PL-03).
DEFAULT_TOOLS: list[ToolDefinition] = [
    _tool(
        WALLET_TRANSFER,
        ToolKind.WALLET,
        "Transfer test tokens from the agent wallet to a recipient.",
        proxy=True,
    ),
    _tool(
        TOKEN_READ_METADATA,
        ToolKind.READ,
        "Read on-chain token metadata (name, symbol, description).",
        proxy=False,
    ),
    _tool(
        ORACLE_GET_PRICE,
        ToolKind.MOCK,
        "Controlled mock price oracle. Returns an untrusted payload in AT-02.",
        proxy=False,
    ),
]

_DEFAULT_OUTPUTS: dict[str, dict] = {
    TOKEN_READ_METADATA: {
        "name": "TESTCOIN",
        "symbol": "TST",
        "description": "Sandbox test token.",
    },
    ORACLE_GET_PRICE: {"price": 1.02, "note": "quote valid for 30s"},
    GET_BALANCE: {"balance": 10000 * 10**18, "token": "0x1111111111111111111111111111111111111111"},
}
