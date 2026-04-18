import { component$, type QRL } from "@builder.io/qwik";
import type { Suggestion } from "@copilotkit/core";
import { CopilotChatSuggestionPill } from "./CopilotChatSuggestionPill";

export interface CopilotChatSuggestionViewProps {
  suggestions: Suggestion[];
  onSelectSuggestion$?: QRL<(suggestion: Suggestion, index: number) => void>;
  class?: string;
}

export const CopilotChatSuggestionView = component$<CopilotChatSuggestionViewProps>(
  (props) => {
    if (!props.suggestions || props.suggestions.length === 0) {
      return null;
    }

    return (
      <div
        data-copilotkit
        data-testid="copilot-suggestions"
        class={`copilotKitSuggestions ${props.class ?? ""}`}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
          padding: "0 16px",
        }}
      >
        {props.suggestions.map((suggestion, index) => (
          <CopilotChatSuggestionPill
            key={`${suggestion.title}-${index}`}
            title={suggestion.title}
            isLoading={suggestion.isLoading}
            onClick$={async () => {
              await props.onSelectSuggestion$?.(suggestion, index);
            }}
          />
        ))}
      </div>
    );
  },
);
