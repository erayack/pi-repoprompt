# MVP tools

All RepoPrompt wrappers use the `rp_` prefix and call RepoPrompt through `rp-cli -w <window_id> --call <tool> --json '<args>'`.

| Pi tool | RepoPrompt MCP tool |
| --- | --- |
| `rp_get_file_tree` | `get_file_tree` |
| `rp_file_search` | `file_search` |
| `rp_read_file` | `read_file` |
| `rp_context_builder` | `context_builder` |

These tools require a bound RepoPrompt window and include the `windowId` in result details.
