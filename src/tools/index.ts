import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { BindingStore } from "../state.js";
import { RepoPromptClient, textFromResult } from "../rp-cli.js";

export function registerRepoPromptTools(pi: ExtensionAPI, store: BindingStore, client: RepoPromptClient): void {
	registerTool(pi, store, client, "rp_get_file_tree", "RepoPrompt File Tree", "get_file_tree", Type.Object({}));
	registerTool(pi, store, client, "rp_file_search", "RepoPrompt File Search", "file_search", Type.Object({ query: Type.String({ description: "Search query" }) }));
	registerTool(pi, store, client, "rp_read_file", "RepoPrompt Read File", "read_file", Type.Object({ path: Type.String({ description: "Workspace-relative path" }) }));
	registerTool(pi, store, client, "rp_context_builder", "RepoPrompt Context Builder", "context_builder", Type.Object({ instructions: Type.String({ description: "Task or question for RepoPrompt context_builder" }) }));
}

function registerTool(pi: ExtensionAPI, store: BindingStore, client: RepoPromptClient, name: string, label: string, rpTool: string, parameters: ReturnType<typeof Type.Object>): void {
	pi.registerTool({
		name,
		label,
		description: `Call RepoPrompt MCP ${rpTool} on the bound RepoPrompt window.`,
		promptSnippet: `Call RepoPrompt ${rpTool} on the bound RepoPrompt workspace.`,
		promptGuidelines: [`Use ${name} only for the explicitly bound RepoPrompt workspace; ask the user to run /rp bind if no window is bound.`],
		parameters,
		async execute(_toolCallId, params, signal) {
			const binding = store.require();
			const result = await client.call(binding.windowId, rpTool, params as Record<string, unknown>, signal);
			return {
				content: [{ type: "text", text: textFromResult(result) }],
				details: { windowId: binding.windowId, rpTool, raw: result.stdout, json: result.json },
			};
		},
	});
}
