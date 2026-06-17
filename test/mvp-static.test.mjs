import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("rp-cli transport builds the V1 window-scoped call contract", () => {
	const source = read("src/rp-cli.ts");
	assert.match(source, /\["-w", String\(windowId\), "--call", tool, "--json", JSON\.stringify\(args\)\]/);
	assert.match(source, /\["-e", "windows"\]/);
});

test("binding state includes required fields and no-bound-window guard", () => {
	const source = read("src/state.ts");
	for (const field of ["windowId", "workspaceName", "rootPaths", "updatedAt"]) assert.match(source, new RegExp(field));
	assert.match(source, /No RepoPrompt window bound\. Run \/rp windows then \/rp bind <id>\./);
	assert.match(source, /throw new Error\(NO_BOUND_WINDOW_MESSAGE\)/);
});

test("/rp command implementation maps MVP subcommands to RepoPrompt MCP tools", () => {
	const source = read("src/commands/index.ts");
	for (const command of ["windows", "bind", "status", "tree", "search", "read", "context-builder"]) {
		assert.match(source, new RegExp(`case "${command}"`));
	}
	for (const tool of ["get_file_tree", "file_search", "read_file", "context_builder"]) assert.match(source, new RegExp(tool));
});

test("MVP rp_ tools are registered with bound-window guard and RepoPrompt mappings", () => {
	const source = read("src/tools/index.ts");
	const mappings = {
		rp_get_file_tree: "get_file_tree",
		rp_file_search: "file_search",
		rp_read_file: "read_file",
		rp_context_builder: "context_builder",
	};
	for (const [piTool, rpTool] of Object.entries(mappings)) {
		assert.match(source, new RegExp(piTool));
		assert.match(source, new RegExp(rpTool));
	}
	assert.match(source, /store\.require\(\)/);
	assert.match(source, /windowId: binding\.windowId/);
});
