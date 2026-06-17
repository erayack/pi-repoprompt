import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { BindingStore } from "./state.js";
import { RepoPromptClient } from "./rp-cli.js";
import { registerRepoPromptCommands } from "./commands/index.js";
import { registerRepoPromptTools } from "./tools/index.js";

export default function piRepoPrompt(pi: ExtensionAPI): void {
	const store = new BindingStore();
	const client = new RepoPromptClient();

	pi.on("session_start", async (_event, ctx) => {
		store.load(ctx.sessionManager.getEntries());
	});

	registerRepoPromptCommands(pi, store, client);
	registerRepoPromptTools(pi, store, client);
}
