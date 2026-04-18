import { component$, useSignal, $ } from "@builder.io/qwik";
import type { AssistantMessage, Message } from "@ag-ui/core";
import { copyToClipboard } from "@copilotkit/shared";
import { CopilotChatToolCallsView } from "./CopilotChatToolCallsView";

export interface CopilotChatAssistantMessageProps {
  message: AssistantMessage;
  messages?: Message[];
  isRunning?: boolean;
  class?: string;
}

export const CopilotChatAssistantMessage = component$<CopilotChatAssistantMessageProps>(
  (props) => {
    const copied = useSignal(false);

    const handleCopy = $(async () => {
      if (props.message.content) {
        const success = await copyToClipboard(props.message.content);
        if (success) {
          copied.value = true;
          setTimeout(() => {
            copied.value = false;
          }, 2000);
        }
      }
    });

    const hasContent = !!(props.message.content && props.message.content.trim().length > 0);
    const isLatest =
      props.messages && props.messages.length > 0
        ? props.messages[props.messages.length - 1]?.id === props.message.id
        : false;
    const showToolbar = hasContent && !(props.isRunning && isLatest);

    return (
      <div
        data-copilotkit
        data-testid="copilot-assistant-message"
        class={`copilotKitMessage copilotKitAssistantMessage ${props.class ?? ""}`}
        data-message-id={props.message.id}
        style={{ marginBottom: "8px" }}
      >
        {hasContent && (
          <div
            style={{
              maxWidth: "100%",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            {props.message.content}
          </div>
        )}
        <CopilotChatToolCallsView
          message={props.message}
          messages={props.messages}
        />
        {showToolbar && (
          <div
            data-testid="copilot-assistant-toolbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "4px",
            }}
          >
            <button
              type="button"
              data-testid="copilot-copy-button"
              title="Copy"
              onClick$={handleCopy}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              {copied.value ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    );
  },
);
