import assert from "node:assert/strict";
import { test } from "node:test";
import { registerRepoPromptCommands } from "../src/commands/index.ts";
import { registerRepoPromptTools } from "../src/tools/index.ts";
import { BindingStore } from "../src/state.ts";
import { formatRpCliError } from "../src/rp-cli.ts";

function makePi() {
	const commands = new Map<string, { handler(args: string, ctx: any): Promise<void> }>();
	const tools = new Map<string, any>();
	const entries: Array<{ customType: string; data: unknown }> = [];
	return {
		commands,
		tools,
		entries,
		registerCommand(name: string, command: any) { commands.set(name, command); },
		registerTool(tool: any) { tools.set(tool.name, tool); },
		appendEntry(customType: string, data: unknown) { entries.push({ customType, data }); },
	};
}

function makeContext() {
	const notifications: Array<{ message: string; kind: string }> = [];
	return {
		notifications,
		ctx: { ui: { notify(message: string, kind: string) { notifications.push({ message, kind }); } } },
	};
}

function makeClient() {
	const calls: Array<{ windowId?: number; tool: string; args: Record<string, unknown> }> = [];
	const client = {
		calls,
		async windows() { calls.push({ tool: "windows", args: {} }); return { stdout: "1 RepoPrompt — demo\n", stderr: "", exitCode: 0 }; },
		async call(windowId: number, tool: string, args: Record<string, unknown>) {
			calls.push({ windowId, tool, args });
			if (windowId === 404) throw new Error("window not found");
			return { stdout: `${tool} ok`, stderr: "", exitCode: 0, json: { tool, args } };
		},
	};
	return client as any;
}

test("/rp bind rejects unreachable windows and does not persist binding", async () => {
	const pi = makePi();
	const store = new BindingStore();
	const client = makeClient();
	registerRepoPromptCommands(pi as any, store, client);
	const command = pi.commands.get("rp")!;
	const { ctx, notifications } = makeContext();

	await command.handler("bind 404", ctx);

	assert.equal(store.get(), undefined);
	assert.equal(pi.entries.length, 0);
	assert.equal(notifications.at(-1)?.kind, "error");
	assert.match(notifications.at(-1)?.message ?? "", /window not found/);
});

test("/rp commands enforce binding before workspace calls", async () => {
	const pi = makePi();
	const store = new BindingStore();
	const client = makeClient();
	registerRepoPromptCommands(pi as any, store, client);
	const command = pi.commands.get("rp")!;
	const { ctx, notifications } = makeContext();

	await command.handler("tree", ctx);

	assert.equal(notifications.at(-1)?.kind, "error");
	assert.match(notifications.at(-1)?.message ?? "", /No RepoPrompt window bound/);
	assert.deepEqual(client.calls, []);
});

test("/rp search invokes RepoPrompt file_search on the bound window", async () => {
	const pi = makePi();
	const store = new BindingStore();
	store.set({ windowId: 7, updatedAt: new Date().toISOString() });
	const client = makeClient();
	registerRepoPromptCommands(pi as any, store, client);
	const command = pi.commands.get("rp")!;
	const { ctx, notifications } = makeContext();

	await command.handler("search auth token", ctx);

	assert.deepEqual(client.calls.at(-1), { windowId: 7, tool: "file_search", args: { query: "auth token" } });
	assert.equal(notifications.at(-1)?.message, "file_search ok");
});

test("rp_read_file tool uses binding and returns RepoPrompt details", async () => {
	const pi = makePi();
	const store = new BindingStore();
	store.set({ windowId: 3, updatedAt: new Date().toISOString() });
	const client = makeClient();
	registerRepoPromptTools(pi as any, store, client);
	const tool = pi.tools.get("rp_read_file");

	const result = await tool.execute("call-1", { path: "README.md" });

	assert.deepEqual(client.calls.at(-1), { windowId: 3, tool: "read_file", args: { path: "README.md" } });
	assert.equal(result.details.windowId, 3);
	assert.equal(result.details.rpTool, "read_file");
	assert.equal(result.content[0].text, "read_file ok");
});

test("rp-cli error formatting redacts JSON payloads", () => {
	const message = formatRpCliError(["-w", "1", "--call", "context_builder", "--json", "{\"instructions\":\"secret plan\"}"], { stdout: "", stderr: "boom", exitCode: 1 });

	assert.match(message, /--json <redacted>/);
	assert.doesNotMatch(message, /secret plan/);
});
