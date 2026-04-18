import { component$ } from "@builder.io/qwik";
import type {
  Message,
  AssistantMessage,
  UserMessage,
  ReasoningMessage as ReasoningMessageType,
  ActivityMessage,
} from "@ag-ui/core";
import { CopilotChatAssistantMessage } from "./CopilotChatAssistantMessage";
import { CopilotChatUserMessage } from "./CopilotChatUserMessage";
import { CopilotChatReasoningMessage } from "./CopilotChatReasoningMessage";

export interface CopilotChatMessageViewProps {
  messages: readonly Message[];
  isRunning?: boolean;
  class?: string;
}

export const CopilotChatMessageView = component$<CopilotChatMessageViewProps>(
  (props) => {
    const messages = props.messages;

    if (messages.length === 0) {
      return null;
    }

    return (
      <div
        data-copilotkit
        data-testid="copilot-message-view"
        class={`copilotKitMessages ${props.class ?? ""}`}
        style={{ padding: "16px" }}
      >
        {messages.map((message) => {
          switch (message.role) {
            case "assistant":
              return (
                <CopilotChatAssistantMessage
                  key={message.id}
                  message={message as AssistantMessage}
                  messages={messages as Message[]}
                  isRunning={props.isRunning}
                />
              );
            case "user":
              return (
                <CopilotChatUserMessage
                  key={message.id}
                  message={message as UserMessage}
                />
              );
            case "reasoning":
              return (
                <CopilotChatReasoningMessage
                  key={message.id}
                  message={message as ReasoningMessageType}
                  messages={messages as Message[]}
                  isRunning={props.isRunning}
                />
              );
            case "activity":
              return (
                <div
                  key={message.id}
                  data-testid="copilot-activity-message"
                  style={{
                    fontSize: "13px",
                    color: "#999",
                    padding: "4px 0",
                    fontStyle: "italic",
                  }}
                >
                  {typeof (message as ActivityMessage).content === "string"
                    ? ((message as ActivityMessage)
                        .content as unknown as string)
                    : JSON.stringify((message as ActivityMessage).content)}
                </div>
              );
            case "tool":
              // Tool messages rendered by assistant messages
              return null;
            default:
              return null;
          }
        })}
      </div>
    );
  },
);
