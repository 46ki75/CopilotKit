import { component$, type QRL } from "@builder.io/qwik";

export interface CopilotChatSuggestionPillProps {
  title: string;
  isLoading?: boolean;
  onClick$?: QRL<() => void>;
  class?: string;
}

export const CopilotChatSuggestionPill = component$<CopilotChatSuggestionPillProps>(
  (props) => {
    return (
      <button
        type="button"
        data-copilotkit
        data-testid="copilot-suggestion"
        class={`copilotKitSuggestionPill ${props.class ?? ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          borderRadius: "9999px",
          border: "1px solid rgba(0,0,0,0.1)",
          background: "white",
          padding: "4px 12px",
          fontSize: "12px",
          cursor: props.isLoading ? "not-allowed" : "pointer",
          opacity: props.isLoading ? "0.6" : "1",
          whiteSpace: "nowrap",
          fontWeight: "500",
        }}
        disabled={props.isLoading}
        onClick$={props.onClick$}
      >
        {props.isLoading && (
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid #ccc",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "cpk-spin 0.6s linear infinite",
            }}
          />
        )}
        <span>{props.title}</span>
      </button>
    );
  },
);
