import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { BINDING_ENTRY_TYPE, BindingStore, normalizeBinding } from "../state.js";
import { RepoPromptClient, textFromResult } from "../rp-cli.js";

function parseWorkspaceInfo(value: unknown): { workspaceName?: string; rootPaths?: string[] } {
	const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
	const roots = Array.from(text.matchAll(/(?:^|\s)(\/[\w.\- /]+)(?=\n|$)/gm), (m) => m[1].trim()).filter(Boolean);
	return { rootPaths: roots.length ? roots : undefined };
}

export function registerRepoPromptCommands(pi: ExtensionAPI, store: BindingStore, client: RepoPromptClient): void {
	pi.registerCommand("rp", {
		description: "RepoPrompt bridge: windows, bind, status, tree, search, read, context-builder",
		handler: async (args, ctx) => {
			const [subcommand = "status", ...rest] = args.trim().split(/\s+/).filter(Boolean);
			try {
				switch (subcommand) {
					case "windows": {
						const result = await client.windows();
						ctx.ui.notify(textFromResult(result) || "No RepoPrompt windows reported.", "info");
						return;
					}
					case "bind": {
						const id = Number(rest[0]);
						if (!Number.isInteger(id) || id <= 0) throw new Error("Usage: /rp bind <window_id>");
						const context = await client.call(id, "workspace_context", {});
						const metadata = parseWorkspaceInfo(context.json ?? context.stdout);
						const binding = store.set(normalizeBinding({ windowId: id, ...metadata, updatedAt: new Date().toISOString() }));
						pi.appendEntry(BINDING_ENTRY_TYPE, binding);
						ctx.ui.notify(`Bound RepoPrompt window ${binding.windowId}.`, "info");
						return;
					}
					case "status": {
						const binding = store.get();
						if (!binding) { ctx.ui.notify("RepoPrompt: not bound\nNo RepoPrompt window bound. Run /rp windows then /rp bind <id>.", "info"); return; }
						const lines = ["RepoPrompt: connected", `Window: ${binding.windowId}`];
						if (binding.workspaceName) lines.push(`Workspace: ${binding.workspaceName}`);
						if (binding.rootPaths?.length) lines.push("Roots:", ...binding.rootPaths.map((p) => `- ${p}`));
						ctx.ui.notify(lines.join("\n"), "info");
						return;
					}
					case "tree": await notifyCall(ctx, client, store, "get_file_tree", {}); return;
					case "search": await notifyCall(ctx, client, store, "file_search", { query: rest.join(" ") }); return;
					case "read": await notifyCall(ctx, client, store, "read_file", { path: rest.join(" ") }); return;
					case "context-builder": await notifyCall(ctx, client, store, "context_builder", { instructions: rest.join(" ") }); return;
					default: throw new Error(`Unknown /rp command: ${subcommand}`);
				}
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
			}
		},
	});
}

async function notifyCall(ctx: { ui: { notify(message: string, kind: "info" | "error"): void } }, client: RepoPromptClient, store: BindingStore, tool: string, args: Record<string, unknown>) {
	const binding = store.require();
	const result = await client.call(binding.windowId, tool, args);
	ctx.ui.notify(textFromResult(result), "info");
}
