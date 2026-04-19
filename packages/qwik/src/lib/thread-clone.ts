import { HttpAgent } from "@ag-ui/client";
import type { AbstractAgent } from "@ag-ui/client";

/**
 * Module-level WeakMap: registryAgent → (threadId → clone).
 * Shared across all useAgent() calls so that every component using the same
 * (agentId, threadId) pair receives the same agent instance. WeakMap ensures
 * the clone map is GC-collected when the registry agent is replaced.
 */
export const globalThreadCloneMap = new WeakMap<
  AbstractAgent,
  Map<string, AbstractAgent>
>();

/**
 * Look up an existing per-thread clone without creating one.
 * Returns undefined when no clone has been created yet for this pair.
 */
export function getThreadClone(
  registryAgent: AbstractAgent | undefined | null,
  threadId: string | undefined | null,
): AbstractAgent | undefined {
  if (!registryAgent || !threadId) return undefined;
  return globalThreadCloneMap.get(registryAgent)?.get(threadId);
}

function cloneForThread(
  source: AbstractAgent,
  threadId: string,
  headers: Record<string, string>,
): AbstractAgent {
  const clone = source.clone();
  if (clone === source) {
    throw new Error(
      `useAgent: ${source.constructor.name}.clone() returned the same instance. ` +
        `clone() must return a new, independent object.`,
    );
  }
  clone.threadId = threadId;
  clone.setMessages([]);
  clone.setState({});
  if (clone instanceof HttpAgent) {
    clone.headers = { ...headers };
  }
  return clone;
}

export function getOrCreateThreadClone(
  existing: AbstractAgent,
  threadId: string,
  headers: Record<string, string>,
): AbstractAgent {
  let byThread = globalThreadCloneMap.get(existing);
  if (!byThread) {
    byThread = new Map();
    globalThreadCloneMap.set(existing, byThread);
  }
  const cached = byThread.get(threadId);
  if (cached) return cached;

  const clone = cloneForThread(existing, threadId, headers);
  byThread.set(threadId, clone);
  return clone;
}
