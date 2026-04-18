import { component$, useSignal, $ } from "@builder.io/qwik";
import type { UserMessage } from "@ag-ui/core";
import { copyToClipboard } from "@copilotkit/shared";

function flattenUserMessageContent(content?: UserMessage["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;

  return (content as Array<{ type?: string; text?: string }>)
    .map((part) => {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "text" &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
      return "";
    })
    .filter((text) => text.length > 0)
    .join("\n");
}

export interface CopilotChatUserMessageProps {
  message: UserMessage;
  class?: string;
}

export const CopilotChatUserMessage = component$<CopilotChatUserMessageProps>(
  (props) => {
    const copied = useSignal(false);
    const flatContent = flattenUserMessageContent(props.message.content);

    const handleCopy = $(async () => {
      if (flatContent) {
        const success = await copyToClipboard(flatContent);
        if (success) {
          copied.value = true;
          setTimeout(() => {
            copied.value = false;
          }, 2000);
        }
      }
    });

    return (
      <div
        data-copilotkit
        data-testid="copilot-user-message"
        class={`copilotKitMessage copilotKitUserMessage ${props.class ?? ""}`}
        data-message-id={props.message.id}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          paddingTop: "16px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            maxWidth: "80%",
            borderRadius: "18px",
            padding: "6px 16px",
            background: "#f0f0f0",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {flatContent}
        </div>
        <div
          data-testid="copilot-user-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: "4px",
            opacity: "0",
            transition: "opacity 0.2s",
          }}
          onMouseEnter$={() => {
            // Toolbar visibility handled via CSS :hover
          }}
        >
          <button
            type="button"
            data-testid="copilot-user-copy-button"
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
      </div>
    );
  },
);
