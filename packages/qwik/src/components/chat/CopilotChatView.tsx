import {
  component$,
  Slot,
  useSignal,
  useContextProvider,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";
import type { Message } from "@ag-ui/core";
import type { Suggestion } from "@copilotkit/core";
import type { Attachment } from "@copilotkit/shared";
import { ScrollElementContextId } from "./scroll-element-context";
import { CopilotChatMessageView } from "./CopilotChatMessageView";
import { CopilotChatInput } from "./CopilotChatInput";
import { CopilotChatSuggestionView } from "./CopilotChatSuggestionView";
import { CopilotChatAttachmentQueue } from "./CopilotChatAttachmentQueue";

export interface CopilotChatViewProps {
  messages?: readonly Message[];
  isRunning?: boolean;
  suggestions?: Suggestion[];
  onSelectSuggestion$?: QRL<(suggestion: Suggestion, index: number) => void>;
  onSubmitMessage$?: QRL<(value: string) => void>;
  onStop$?: QRL<() => void>;
  inputValue?: string;
  onInputChange$?: QRL<(value: string) => void>;
  // Attachment props
  attachments?: Attachment[];
  onRemoveAttachment$?: QRL<(id: string) => void>;
  onAddFile$?: QRL<() => void>;
  dragOver?: boolean;
  onDragOver$?: QRL<(e: DragEvent) => void>;
  onDragLeave$?: QRL<(e: DragEvent) => void>;
  onDrop$?: QRL<(e: DragEvent) => void>;
  class?: string;
}

export const CopilotChatView = component$<CopilotChatViewProps>((props) => {
  const scrollContainerRef = useSignal<HTMLElement | undefined>(undefined);

  useContextProvider(ScrollElementContextId, scrollContainerRef);

  // Auto-scroll to bottom on new messages
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.messages);
    track(() => props.isRunning);

    const el = scrollContainerRef.value;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  });

  const messages = props.messages ?? [];
  const suggestions = props.suggestions ?? [];
  const hasMessages = messages.length > 0;

  return (
    <div
      data-copilotkit
      data-testid="copilot-chat-view"
      class={`copilotKitChatView ${props.class ?? ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
      onDragOver$={props.onDragOver$}
      onDragLeave$={props.onDragLeave$}
      onDrop$={props.onDrop$}
    >
      {/* Drag overlay */}
      {props.dragOver && (
        <div
          style={{
            position: "absolute",
            inset: "0",
            zIndex: "50",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.05)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              color: "#666",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              Drop files here
            </span>
          </div>
        </div>
      )}

      {/* Messages scroll area */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: "1",
          overflowY: "auto",
          minHeight: "0",
        }}
      >
        {hasMessages ? (
          <CopilotChatMessageView
            messages={messages}
            isRunning={props.isRunning}
          />
        ) : (
          <Slot name="welcome" />
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ padding: "8px 0" }}>
          <CopilotChatSuggestionView
            suggestions={suggestions}
            onSelectSuggestion$={props.onSelectSuggestion$}
          />
        </div>
      )}

      {/* Attachment queue */}
      {props.attachments &&
        props.attachments.length > 0 &&
        props.onRemoveAttachment$ && (
          <CopilotChatAttachmentQueue
            attachments={props.attachments}
            onRemoveAttachment$={props.onRemoveAttachment$}
          />
        )}

      {/* Input */}
      <CopilotChatInput
        onSubmitMessage$={props.onSubmitMessage$}
        onStop$={props.onStop$}
        isRunning={props.isRunning}
        inputValue={props.inputValue}
        onInputChange$={props.onInputChange$}
        onAddFile$={props.onAddFile$}
      />
    </div>
  );
});
