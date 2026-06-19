# Setup

1. Install and launch RepoPrompt.
2. Ensure `rp-cli` is available on `PATH`.
3. Pi does **not** include MCP support built in. If you do not already have an MCP bridge for Pi, install [`pi-mcp-adapter`](https://github.com/nicobailon/pi-mcp-adapter).
4. Load this Pi extension.
5. Run `/rp windows`, then `/rp bind <window_id>`.
6. Confirm with `/rp status`.

All workspace-scoped commands and `rp_` tools require this explicit binding.
