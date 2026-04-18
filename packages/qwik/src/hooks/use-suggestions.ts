import { useContext, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import type { Suggestion } from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";

// Mirrors the DEFAULT_AGENT_ID constant from @copilotkit/shared to avoid a
// value import from a workspace package that may not be pre-built.
const DEFAULT_AGENT_ID = "default";

/**
 * Options for the useSuggestions hook.
 */
export interface UseSuggestionsOptions {
  /**
   * The ID of the agent whose suggestions to observe.
   * Defaults to the default agent ID.
   */
  agentId?: string;
}

/**
 * Return value from the useSuggestions hook.
 */
export interface UseSuggestionsReturn {
  /**
   * Reactive signal containing the current list of suggestions for the agent.
   */
  suggestions: Signal<Suggestion[]>;

  /**
   * Reactive signal indicating whether suggestions are currently loading.
   */
  isLoading: Signal<boolean>;

  /**
   * Trigger a fresh reload of suggestions from the runtime.
   */
  reloadSuggestions: () => void;

  /**
   * Clear the current list of suggestions.
   */
  clearSuggestions: () => void;
}

/**
 * Subscribes to AI-generated suggestions for the given agent and exposes
 * them as reactive Qwik signals. This is the Qwik equivalent of the React
 * `useSuggestions` hook from `@copilotkit/react-core`.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, useSuggestions } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const SuggestionBar = component$(() => {
 *   const { suggestions, isLoading, reloadSuggestions } = useSuggestions();
 *
 *   return (
 *     <div>
 *       {isLoading.value && <p>Loading suggestions…</p>}
 *       {suggestions.value.map((s, i) => (
 *         <button key={i}>{s.title}</button>
 *       ))}
 *       <button onClick$={() => reloadSuggestions()}>Reload</button>
 *     </div>
 *   );
 * });
 * ```
 */
export function useSuggestions({
  agentId,
}: UseSuggestionsOptions = {}): UseSuggestionsReturn {
  const ctx = useContext(CopilotKitContextId);
  const resolvedAgentId = agentId ?? DEFAULT_AGENT_ID;

  const suggestionsSig = useSignal<Suggestion[]>([]);
  const isLoadingSig = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);
    track(() => resolvedAgentId);

    const core = ctx.coreRef.value;
    if (!core) return;

    // Sync initial state from core.
    const initial = core.getSuggestions(resolvedAgentId);
    suggestionsSig.value = initial.suggestions;
    isLoadingSig.value = initial.isLoading;

    const subscription = core.subscribe({
      onSuggestionsChanged: ({ agentId: changedAgentId, suggestions }) => {
        if (changedAgentId !== resolvedAgentId) return;
        suggestionsSig.value = suggestions;
      },
      onSuggestionsStartedLoading: ({ agentId: changedAgentId }) => {
        if (changedAgentId !== resolvedAgentId) return;
        isLoadingSig.value = true;
      },
      onSuggestionsFinishedLoading: ({ agentId: changedAgentId }) => {
        if (changedAgentId !== resolvedAgentId) return;
        isLoadingSig.value = false;
      },
      onSuggestionsConfigChanged: () => {
        const result = core.getSuggestions(resolvedAgentId);
        suggestionsSig.value = result.suggestions;
        isLoadingSig.value = result.isLoading;
      },
    });

    cleanup(() => {
      subscription.unsubscribe();
    });
  });

  return {
    suggestions: suggestionsSig,
    isLoading: isLoadingSig,
    reloadSuggestions: () => {
      const core = ctx.coreRef.value;
      if (!core) return;
      core.reloadSuggestions(resolvedAgentId);
    },
    clearSuggestions: () => {
      const core = ctx.coreRef.value;
      if (!core) return;
      core.clearSuggestions(resolvedAgentId);
    },
  };
}
