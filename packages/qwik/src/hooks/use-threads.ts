import { useContext, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import {
  ɵcreateThreadStore,
  ɵselectThreads,
  ɵselectThreadsError,
  ɵselectThreadsIsLoading,
  ɵselectHasNextPage,
  ɵselectIsFetchingNextPage,
  type ɵThreadStore,
} from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * A conversation thread managed by the Intelligence platform.
 *
 * Each thread has a unique `id`, an optional human-readable `name`, and
 * timestamp fields tracking creation and update times.
 */
export interface Thread {
  id: string;
  agentId: string;
  name: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuration for the {@link useThreads} hook.
 */
export interface UseThreadsInput {
  /** The ID of the agent whose threads to list and manage. */
  agentId: string;
  /** When `true`, archived threads are included in the list. Defaults to `false`. */
  includeArchived?: boolean;
  /** Maximum number of threads to fetch per page. When set, enables cursor-based pagination. */
  limit?: number;
}

/**
 * Return value of the {@link useThreads} hook.
 */
export interface UseThreadsReturn {
  /**
   * Reactive signal containing threads for the current user/agent pair,
   * sorted by most recently updated first.
   */
  threads: Signal<Thread[]>;

  /**
   * Reactive signal that is `true` while the initial thread list is being
   * fetched from the platform.
   */
  isLoading: Signal<boolean>;

  /**
   * Reactive signal containing the most recent error from fetching threads
   * or executing a mutation, or `null` when there is no error.
   */
  error: Signal<Error | null>;

  /**
   * Reactive signal that is `true` when there are more threads available to
   * fetch via {@link fetchMoreThreads}. Only meaningful when `limit` is set.
   */
  hasMoreThreads: Signal<boolean>;

  /**
   * Reactive signal that is `true` while a subsequent page of threads is
   * being fetched.
   */
  isFetchingMoreThreads: Signal<boolean>;

  /**
   * Fetch the next page of threads. No-op when {@link hasMoreThreads} is
   * `false` or a fetch is already in progress.
   */
  fetchMoreThreads: () => void;

  /**
   * Rename a thread on the platform.
   * Resolves when the server confirms the update; rejects on failure.
   */
  renameThread: (threadId: string, name: string) => Promise<void>;

  /**
   * Archive a thread on the platform.
   * Resolves when the server confirms the update; rejects on failure.
   */
  archiveThread: (threadId: string) => Promise<void>;

  /**
   * Permanently delete a thread from the platform.
   * Resolves when the server confirms deletion; rejects on failure.
   */
  deleteThread: (threadId: string) => Promise<void>;
}

function selectFromStore<T>(
  store: ɵThreadStore,
  selector: (state: ReturnType<ɵThreadStore["getState"]>) => T,
  signal: Signal<T>,
): () => void {
  const subscription = store.select(selector).subscribe((value) => {
    signal.value = value;
  });
  return () => subscription.unsubscribe();
}

/**
 * Qwik hook for listing and managing Intelligence platform threads.
 *
 * On mount the hook fetches the thread list for the runtime-authenticated user
 * and the given `agentId`. When the Intelligence platform exposes a WebSocket
 * URL, it also opens a realtime subscription so the `threads` signal stays
 * current without polling. This is the Qwik equivalent of the React
 * `useThreads` hook from `@copilotkit/react-core`.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, useThreads } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const ThreadList = component$(() => {
 *   const { threads, isLoading, deleteThread } = useThreads({ agentId: "agent-1" });
 *
 *   return (
 *     <ul>
 *       {isLoading.value
 *         ? <li>Loading…</li>
 *         : threads.value.map((t) => (
 *             <li key={t.id}>
 *               {t.name ?? "Untitled"}
 *               <button onClick$={() => deleteThread(t.id)}>Delete</button>
 *             </li>
 *           ))
 *       }
 *     </ul>
 *   );
 * });
 * ```
 *
 * @param input - Agent identifier and optional list controls.
 * @returns Thread list state signals and stable mutation callbacks.
 */
export function useThreads({
  agentId,
  includeArchived,
  limit,
}: UseThreadsInput): UseThreadsReturn {
  const ctx = useContext(CopilotKitContextId);

  const threadsSig = useSignal<Thread[]>([]);
  const isLoadingSig = useSignal(false);
  const errorSig = useSignal<Error | null>(null);
  const hasMoreThreadsSig = useSignal(false);
  const isFetchingMoreThreadsSig = useSignal(false);

  // Store reference lives outside the task so that mutation callbacks can
  // always access the current store instance.
  const storeSig = useSignal<ɵThreadStore | null>(null);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);
    track(() => agentId);
    track(() => includeArchived);
    track(() => limit);

    const core = ctx.coreRef.value;

    // Tear down any previous store.
    if (storeSig.value) {
      storeSig.value.stop();
      storeSig.value = null;
    }

    if (!core) return;

    if (!core.runtimeUrl) {
      errorSig.value = new Error("Runtime URL is not configured");
      return;
    }

    const store = ɵcreateThreadStore({ fetch: globalThis.fetch });
    storeSig.value = store;

    // Subscribe store selectors to Qwik signals so the UI reacts to changes.
    const unsubs: Array<() => void> = [
      selectFromStore(store, ɵselectThreadsIsLoading, isLoadingSig),
      selectFromStore(store, ɵselectThreadsError, errorSig),
      selectFromStore(store, ɵselectHasNextPage, hasMoreThreadsSig),
      selectFromStore(
        store,
        ɵselectIsFetchingNextPage,
        isFetchingMoreThreadsSig,
      ),
    ];

    const threadsSubscription = store
      .select(ɵselectThreads)
      .subscribe((coreThreads: unknown) => {
        const threads = coreThreads as Thread[];
        threadsSig.value = threads.map(
          ({
            id,
            agentId: threadAgentId,
            name,
            archived,
            createdAt,
            updatedAt,
          }) => ({
            id,
            agentId: threadAgentId,
            name,
            archived,
            createdAt,
            updatedAt,
          }),
        );
      });
    unsubs.push(() => threadsSubscription.unsubscribe());

    store.setContext({
      runtimeUrl: core.runtimeUrl,
      headers: { ...core.headers },
      wsUrl: core.intelligence?.wsUrl,
      agentId,
      includeArchived,
      limit,
    });

    store.start();

    cleanup(() => {
      for (const unsub of unsubs) unsub();
      store.stop();
      storeSig.value = null;
    });
  });

  return {
    threads: threadsSig,
    isLoading: isLoadingSig,
    error: errorSig,
    hasMoreThreads: hasMoreThreadsSig,
    isFetchingMoreThreads: isFetchingMoreThreadsSig,
    fetchMoreThreads: () => {
      if (!storeSig.value) {
        console.warn(
          "[CopilotKit] useThreads: fetchMoreThreads called before the thread store was initialized.",
        );
        return;
      }
      storeSig.value.fetchNextPage();
    },
    renameThread: (threadId: string, name: string) =>
      storeSig.value
        ? storeSig.value.renameThread(threadId, name)
        : Promise.reject(new Error("Thread store not initialized")),
    archiveThread: (threadId: string) =>
      storeSig.value
        ? storeSig.value.archiveThread(threadId)
        : Promise.reject(new Error("Thread store not initialized")),
    deleteThread: (threadId: string) =>
      storeSig.value
        ? storeSig.value.deleteThread(threadId)
        : Promise.reject(new Error("Thread store not initialized")),
  };
}
