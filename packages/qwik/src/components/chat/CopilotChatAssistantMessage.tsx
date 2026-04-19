import { component$, useSignal, $ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import type { AssistantMessage, Message } from "@ag-ui/core";
import { copyToClipboard } from "@copilotkit/shared";
import { CopilotChatToolCallsView } from "./CopilotChatToolCallsView";
import { useCopilotChatConfiguration } from "../../context/copilot-chat-configuration-context";

export interface CopilotChatAssistantMessageProps {
  message: AssistantMessage;
  messages?: Message[];
  isRunning?: boolean;
  class?: string;
  /** Called when the user clicks the thumbs-up button. */
  onThumbsUp$?: QRL<(message: AssistantMessage) => void>;
  /** Called when the user clicks the thumbs-down button. */
  onThumbsDown$?: QRL<(message: AssistantMessage) => void>;
  /** Called when the user clicks the regenerate button. */
  onRegenerate$?: QRL<(message: AssistantMessage) => void>;
}

export const CopilotChatAssistantMessage =
  component$<CopilotChatAssistantMessageProps>((props) => {
    const copied = useSignal(false);
    const thumbsUpActive = useSignal(false);
    const thumbsDownActive = useSignal(false);
    const config = useCopilotChatConfiguration();

    const copyLabel =
      config?.labels.assistantMessageToolbarCopyMessageLabel ?? "Copy";
    const copiedLabel =
      config?.labels.assistantMessageToolbarCopyCodeCopiedLabel ?? "Copied";
    const thumbsUpLabel =
      config?.labels.assistantMessageToolbarThumbsUpLabel ?? "Good response";
    const thumbsDownLabel =
      config?.labels.assistantMessageToolbarThumbsDownLabel ?? "Bad response";
    const regenerateLabel =
      config?.labels.assistantMessageToolbarRegenerateLabel ?? "Regenerate";

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

    const handleThumbsUp = $(async () => {
      thumbsUpActive.value = !thumbsUpActive.value;
      if (thumbsUpActive.value) {
        thumbsDownActive.value = false;
      }
      await props.onThumbsUp$?.(props.message);
    });

    const handleThumbsDown = $(async () => {
      thumbsDownActive.value = !thumbsDownActive.value;
      if (thumbsDownActive.value) {
        thumbsUpActive.value = false;
      }
      await props.onThumbsDown$?.(props.message);
    });

    const handleRegenerate = $(async () => {
      await props.onRegenerate$?.(props.message);
    });

    const hasContent = !!(
      props.message.content && props.message.content.trim().length > 0
    );
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
            {/* Copy button */}
            <button
              type="button"
              data-testid="copilot-copy-button"
              title={copied.value ? copiedLabel : copyLabel}
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>

            {/* Thumbs up */}
            <button
              type="button"
              data-testid="copilot-thumbs-up-button"
              title={thumbsUpLabel}
              onClick$={handleThumbsUp}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: thumbsUpActive.value ? "#10b981" : "#666",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={thumbsUpActive.value ? "currentColor" : "none"}
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            </button>

            {/* Thumbs down */}
            <button
              type="button"
              data-testid="copilot-thumbs-down-button"
              title={thumbsDownLabel}
              onClick$={handleThumbsDown}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: thumbsDownActive.value ? "#ef4444" : "#666",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={thumbsDownActive.value ? "currentColor" : "none"}
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
            </button>

            {/* Regenerate */}
            {props.onRegenerate$ && (
              <button
                type="button"
                data-testid="copilot-regenerate-button"
                title={regenerateLabel}
                onClick$={handleRegenerate}
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
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    );
  });
