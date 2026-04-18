import { useContext, useSignal, useTask$ } from "@builder.io/qwik";
import type {
  DynamicSuggestionsConfig,
  StaticSuggestionsConfig,
  SuggestionsConfig,
  Suggestion,
} from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";

type StaticSuggestionInput = Omit<Suggestion, "isLoading"> &
  Partial<Pick<Suggestion, "isLoading">>;

type StaticSuggestionsConfigInput = Omit<
  StaticSuggestionsConfig,
  "suggestions"
> & {
  suggestions: StaticSuggestionInput[];
};

/**
 * Input config for the useConfigureSuggestions hook.
 *
 * Accepts either a `DynamicSuggestionsConfig` (AI-generated, with
 * `instructions`) or a `StaticSuggestionsConfigInput` (hand-crafted list of
 * suggestions). Pass `null` or `undefined` to clear any registered config.
 */
export type SuggestionsConfigInput =
  | DynamicSuggestionsConfig
  | StaticSuggestionsConfigInput;

function isDynamicConfig(
  config: SuggestionsConfigInput,
): config is DynamicSuggestionsConfig {
  return "instructions" in config;
}

function normalizeStaticSuggestions(
  suggestions: StaticSuggestionInput[],
): Suggestion[] {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    isLoading: suggestion.isLoading ?? false,
  }));
}

/**
 * Registers a suggestions configuration with the CopilotKit core so that the
 * runtime can produce suggestions for the given agent. Unregisters the config
 * when the component unmounts or when the inputs change. This is the Qwik
 * equivalent of the React `useConfigureSuggestions` hook from
 * `@copilotkit/react-core`.
 *
 * ## Usage — static suggestions
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { useConfigureSuggestions } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const MyComponent = component$(() => {
 *   useConfigureSuggestions({
 *     suggestions: [
 *       { title: "What can you do?", message: "Tell me what you can do." },
 *       { title: "Help", message: "I need help." },
 *     ],
 *   });
 *
 *   return <div>…</div>;
 * });
 * ```
 *
 * ## Usage — dynamic (AI-generated) suggestions
 *
 * ```tsx
 * export const MyComponent = component$(() => {
 *   useConfigureSuggestions({
 *     instructions: "Generate helpful suggestions for the current task.",
 *   });
 *
 *   return <div>…</div>;
 * });
 * ```
 */
export function useConfigureSuggestions(
  config: SuggestionsConfigInput | null | undefined,
): void {
  const ctx = useContext(CopilotKitContextId);
  const configIdRef = useSignal<string | undefined>(undefined);

  useTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);
    track(() => JSON.stringify(config));

    const core = ctx.coreRef.value;

    // Remove previous registration when config changes or core is gone.
    if (configIdRef.value && core) {
      core.removeSuggestionsConfig(configIdRef.value);
      configIdRef.value = undefined;
    }

    if (!core || !config) return;

    if (config.available === "disabled") return;

    let normalizedConfig: SuggestionsConfig;
    if (isDynamicConfig(config)) {
      normalizedConfig = { ...config } satisfies DynamicSuggestionsConfig;
    } else {
      normalizedConfig = {
        ...config,
        suggestions: normalizeStaticSuggestions(config.suggestions),
      } satisfies StaticSuggestionsConfig;
    }

    configIdRef.value = core.addSuggestionsConfig(normalizedConfig);

    cleanup(() => {
      if (configIdRef.value && ctx.coreRef.value) {
        ctx.coreRef.value.removeSuggestionsConfig(configIdRef.value);
        configIdRef.value = undefined;
      }
    });
  });
}
