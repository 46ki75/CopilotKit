import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { ReasoningMessage, Message } from "@ag-ui/core";

function formatDuration(seconds: number): string {
  if (seconds < 1) return "a few seconds";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (secs === 0) return `${mins} minute${mins > 1 ? "s" : ""}`;
  return `${mins}m ${secs}s`;
}

export interface CopilotChatReasoningMessageProps {
  message: ReasoningMessage;
  messages?: Message[];
  isRunning?: boolean;
  class?: string;
}

export const CopilotChatReasoningMessage =
  component$<CopilotChatReasoningMessageProps>((props) => {
    const isOpen = useSignal(false);
    const elapsed = useSignal(0);
    const startTime = useSignal<number | null>(null);

    const isLatest =
      props.messages && props.messages.length > 0
        ? props.messages[props.messages.length - 1]?.id === props.message.id
        : false;
    const isStreaming = !!(props.isRunning && isLatest);
    const hasContent = !!(
      props.message.content && props.message.content.length > 0
    );

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => isStreaming);

      if (isStreaming && startTime.value === null) {
        startTime.value = Date.now();
        isOpen.value = true;
      }

      if (!isStreaming && startTime.value !== null) {
        elapsed.value = (Date.now() - startTime.value) / 1000;
        isOpen.value = false;
        return;
      }

      if (!isStreaming) return;

      const timer = setInterval(() => {
        if (startTime.value !== null) {
          elapsed.value = (Date.now() - startTime.value) / 1000;
        }
      }, 1000);

      cleanup(() => clearInterval(timer));
    });

    const handleToggle = $(() => {
      if (hasContent) {
        isOpen.value = !isOpen.value;
      }
    });

    const label = isStreaming
      ? "Thinking…"
      : `Thought for ${formatDuration(elapsed.value)}`;

    return (
      <div
        class={props.class ?? ""}
        data-message-id={props.message.id}
        style={{ margin: "4px 0" }}
      >
        {/* Header */}
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 0",
            fontSize: "14px",
            color: "#666",
            background: "none",
            border: "none",
            cursor: hasContent ? "pointer" : "default",
            userSelect: "none",
          }}
          onClick$={handleToggle}
        >
          <span style={{ fontWeight: "500" }}>{label}</span>
          {isStreaming && !hasContent && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "4px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#999",
                  animation: "cpk-pulse 1.5s ease-in-out infinite",
                }}
              />
            </span>
          )}
          {hasContent && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style={{
                transition: "transform 0.2s",
                transform: isOpen.value ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </button>

        {/* Collapsible content */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: isOpen.value ? "1fr" : "0fr",
            transition: "grid-template-rows 0.2s ease-in-out",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            {(hasContent || isStreaming) && (
              <div
                style={{
                  padding: "4px 0 8px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                {props.message.content ?? ""}
                {isStreaming && hasContent && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      marginLeft: "4px",
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#999",
                        animation: "cpk-pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });
