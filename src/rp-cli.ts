import { spawn } from "node:child_process";
import { NO_BOUND_WINDOW_MESSAGE, type RepoPromptBinding } from "./state.js";

export type RpCliRunner = (args: string[], options?: { signal?: AbortSignal }) => Promise<RpCliResult>;
export type RpCliResult = { stdout: string; stderr: string; exitCode: number; json?: unknown };

export function createRpCliRunner(command = process.env.RP_CLI_PATH || "rp-cli"): RpCliRunner {
	return (args, options = {}) => new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], signal: options.signal });
		let stdout = "";
		let stderr = "";
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => { stdout += chunk; });
		child.stderr.on("data", (chunk) => { stderr += chunk; });
		child.on("error", reject);
		child.on("close", (code) => {
			const result: RpCliResult = { stdout, stderr, exitCode: code ?? 1 };
			const trimmed = stdout.trim();
			if (trimmed) {
				try { result.json = JSON.parse(trimmed); } catch { /* raw text is valid */ }
			}
			if (result.exitCode !== 0) reject(new Error(formatRpCliError(args, result)));
			else resolve(result);
		});
	});
}

export function formatRpCliError(args: string[], result: Pick<RpCliResult, "stderr" | "stdout" | "exitCode">): string {
	const message = (result.stderr || result.stdout).trim() || `rp-cli exited with code ${result.exitCode}`;
	return `RepoPrompt is not reachable or rp-cli failed. ${message}\nCommand: rp-cli ${redactedArgs(args).join(" ")}`;
}

function redactedArgs(args: string[]): string[] {
	const redacted: string[] = [];
	for (let index = 0; index < args.length; index += 1) {
		redacted.push(args[index]);
		if (args[index] === "--json" && index + 1 < args.length) {
			redacted.push("<redacted>");
			index += 1;
		}
	}
	return redacted;
}

export class RepoPromptClient {
	constructor(private readonly runner: RpCliRunner = createRpCliRunner()) {}

	async windows(signal?: AbortSignal): Promise<RpCliResult> {
		return this.runner(["-e", "windows"], { signal });
	}

	async call(windowId: number, tool: string, args: Record<string, unknown> = {}, signal?: AbortSignal): Promise<RpCliResult> {
		return this.runner(["-w", String(windowId), "--call", tool, "--json", JSON.stringify(args)], { signal });
	}

	async callBound(binding: RepoPromptBinding | undefined, tool: string, args: Record<string, unknown> = {}, signal?: AbortSignal): Promise<RpCliResult> {
		if (!binding) throw new Error(NO_BOUND_WINDOW_MESSAGE);
		return this.call(binding.windowId, tool, args, signal);
	}
}

export function textFromResult(result: RpCliResult): string {
	return result.stdout.trim() || (result.json === undefined ? "" : JSON.stringify(result.json, null, 2));
}
