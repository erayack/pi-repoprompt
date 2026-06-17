export type RepoPromptBinding = {
	windowId: number;
	workspaceName?: string;
	rootPaths?: string[];
	updatedAt: string;
};

export const BINDING_ENTRY_TYPE = "pi-repoprompt-binding";
export const NO_BOUND_WINDOW_MESSAGE = "No RepoPrompt window bound. Run /rp windows then /rp bind <id>.";

export class BindingStore {
	private binding: RepoPromptBinding | undefined;

	load(entries: Array<{ type?: string; customType?: string; data?: unknown }> = []): void {
		for (const entry of entries) {
			if (entry.type !== "custom" || entry.customType !== BINDING_ENTRY_TYPE) continue;
			const data = entry.data as Partial<RepoPromptBinding> | undefined;
			if (typeof data?.windowId === "number") this.binding = normalizeBinding({ ...data, windowId: data.windowId });
		}
	}

	get(): RepoPromptBinding | undefined { return this.binding; }

	set(binding: RepoPromptBinding): RepoPromptBinding {
		this.binding = binding;
		return binding;
	}

	require(): RepoPromptBinding {
		if (!this.binding) throw new Error(NO_BOUND_WINDOW_MESSAGE);
		return this.binding;
	}
}

export function normalizeBinding(input: Partial<RepoPromptBinding> & { windowId: number }): RepoPromptBinding {
	return {
		windowId: input.windowId,
		workspaceName: input.workspaceName,
		rootPaths: Array.isArray(input.rootPaths) ? input.rootPaths.filter((p): p is string => typeof p === "string") : undefined,
		updatedAt: input.updatedAt ?? new Date().toISOString(),
	};
}
