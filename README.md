# pi-repoprompt

`pi-repoprompt` is a community Pi extension that uses RepoPrompt as a context engine from inside Pi. The MVP is intentionally thin: RepoPrompt remains the backend and this extension calls the existing RepoPrompt CLI/MCP surface through `rp-cli`.

## Requirements

- RepoPrompt app installed and running.
- RepoPrompt MCP/CLI installed and available as `rp-cli` on `PATH`.
- A RepoPrompt window explicitly bound before workspace-scoped commands or tools are used.

## Install / load

```text
pi install github:<owner>/pi-repoprompt
```

For local development:

```bash
pi -e ./pi-repoprompt
```

## MVP flow

```text
/rp windows
/rp bind <window_id>
/rp status
/rp tree
/rp search <query>
/rp read <path>
/rp context-builder <question-or-task>
```

Workspace calls fail until `/rp bind <window_id>` has been run.

## Tools

The extension exposes RepoPrompt-backed model tools with an `rp_` prefix to avoid collisions with Pi-native tools:

- `rp_get_file_tree` → RepoPrompt `get_file_tree`
- `rp_file_search` → RepoPrompt `file_search`
- `rp_read_file` → RepoPrompt `read_file`
- `rp_context_builder` → RepoPrompt `context_builder`

`rp_` tools operate on the bound RepoPrompt workspace. Pi native tools operate on Pi's current working directory. RepoPrompt selection/context is separate from Pi conversation context.

## Non-goals for MVP

This MVP does not reimplement RepoPrompt file trees, selected-file state, codemaps, prompt packaging, context builder internals, Oracle/chat workflows, or the RepoPrompt MCP server. It does not include V2/V3 workflows, TUI pickers, or native MCP transport.

## Development

```bash
npm test
npm run typecheck
```

When runtime/buildability is affected in this repository, also run:

```bash
xcodebuild -project RepoPrompt.xcodeproj -scheme RepoPrompt -configuration Debug build
```

See `docs/troubleshooting.md` for common failure modes.
