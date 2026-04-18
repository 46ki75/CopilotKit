import { component$, useSignal, $ } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import type { Attachment } from "@copilotkit/shared";
import { CopilotChatDefaultLabels } from "../../context/copilot-chat-configuration-context";
import { useCopilotChatConfiguration } from "../copilot-chat-configuration-provider";

export interface CopilotChatInputProps {
  onSubmitMessage$?: QRL<(value: string) => void>;
  onStop$?: QRL<() => void>;
  isRunning?: boolean;
  placeholder?: string;
  inputValue?: string;
  onInputChange$?: QRL<(value: string) => void>;
  attachments?: Attachment[];
  onRemoveAttachment$?: QRL<(id: string) => void>;
  onAddFile$?: QRL<() => void>;
  class?: string;
}

export const CopilotChatInput = component$<CopilotChatInputProps>((props) => {
  const localInput = useSignal(props.inputValue ?? "");
  const chatConfig = useCopilotChatConfiguration();
  const labels = chatConfig?.labels ?? CopilotChatDefaultLabels;

  const inputValue =
    props.inputValue !== undefined ? props.inputValue : localInput.value;

  return (
    <div
      data-copilotkit
      data-testid="copilot-chat-input"
      class={`copilotKitInput ${props.class ?? ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid #e0e0e0",
        padding: "8px 12px",
        background: "white",
      }}
    >
      <form
        preventdefault:submit
        onSubmit$={$(async () => {
          const value = localInput.value.trim();
          if (!value) return;
          await props.onSubmitMessage$?.(value);
          localInput.value = "";
        })}
        style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}
      >
        <div style={{ flex: "1", display: "flex", flexDirection: "column" }}>
          <textarea
            data-testid="copilot-chat-textarea"
            placeholder={props.placeholder ?? labels.chatInputPlaceholder}
            value={inputValue}
            onInput$={$((e) => {
              const target = e.target as HTMLTextAreaElement;
              localInput.value = target.value;
              props.onInputChange$?.(target.value);
            })}
            onKeyDown$={$((e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const value = localInput.value.trim();
                if (value) {
                  props.onSubmitMessage$?.(value);
                  localInput.value = "";
                }
              }
            })}
            rows={1}
            style={{
              resize: "none",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "8px 12px",
              fontSize: "14px",
              lineHeight: "1.5",
              outline: "none",
              fontFamily: "inherit",
              minHeight: "40px",
              maxHeight: "120px",
              overflow: "auto",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {props.onAddFile$ && (
            <button
              type="button"
              onClick$={props.onAddFile$}
              title={labels.chatInputToolbarAddButtonLabel}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          )}
          {props.isRunning && props.onStop$ ? (
            <button
              type="button"
              data-testid="copilot-stop-button"
              onClick$={props.onStop$}
              style={{
                background: "#333",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              data-testid="copilot-send-button"
              disabled={!inputValue.trim()}
              style={{
                background: inputValue.trim() ? "#333" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: inputValue.trim() ? "pointer" : "not-allowed",
                transition: "background 0.15s",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          )}
        </div>
      </form>
      <div
        style={{
          textAlign: "center",
          padding: "4px 0",
          fontSize: "11px",
          color: "#999",
        }}
      >
        {labels.chatDisclaimerText}
      </div>
    </div>
  );
});
