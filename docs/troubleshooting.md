# Troubleshooting

## RepoPrompt is not reachable

Open RepoPrompt and run:

```text
/rp windows
```

Also confirm `rp-cli` is installed and available on `PATH`.

## No bound window

Run:

```text
/rp windows
/rp bind <window_id>
/rp status
```

The expected guard message is:

```text
No RepoPrompt window bound. Run /rp windows then /rp bind <id>.
```

## Tool-name confusion

Pi native tools and RepoPrompt tools are different. RepoPrompt wrappers always use the `rp_` prefix and operate on the bound RepoPrompt workspace.

## Version or schema drift

If a command fails, run `/rp status`, then retry `/rp windows`. RepoPrompt MCP schemas may change; this MVP preserves RepoPrompt/`rp-cli` error messages to make mismatches visible.
