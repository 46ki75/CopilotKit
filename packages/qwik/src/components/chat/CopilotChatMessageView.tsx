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
import { useRenderCustomMessages } from "../../hooks/use-render-custom-messages";
import { useRenderActivityMessage } from "../../hooks/use-render-activity-message";

export interface CopilotChatMessageViewProps {
  messages: readonly Message[];
  isRunning?: boolean;
  class?: string;
}

export const CopilotChatMessageView = component$<CopilotChatMessageViewProps>(
  (props) => {
    const renderCustomMessages = useRenderCustomMessages();
    const { renderActivityMessage } = useRenderActivityMessage();

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
          const beforeCustom =
            renderCustomMessages?.({ message, position: "before" }) ?? null;
          const afterCustom =
            renderCustomMessages?.({ message, position: "after" }) ?? null;

          switch (message.role) {
            case "assistant":
              return (
                <div key={message.id}>
                  {beforeCustom}
                  <CopilotChatAssistantMessage
                    message={message as AssistantMessage}
                    messages={messages as Message[]}
                    isRunning={props.isRunning}
                  />
                  {afterCustom}
                </div>
              );
            case "user":
              return (
                <div key={message.id}>
                  {beforeCustom}
                  <CopilotChatUserMessage
                    message={message as UserMessage}
                  />
                  {afterCustom}
                </div>
              );
            case "reasoning":
              return (
                <div key={message.id}>
                  {beforeCustom}
                  <CopilotChatReasoningMessage
                    message={message as ReasoningMessageType}
                    messages={messages as Message[]}
                    isRunning={props.isRunning}
                  />
                  {afterCustom}
                </div>
              );
            case "activity": {
              const activityMessage = message as ActivityMessage;
              const customRendered =
                renderActivityMessage(activityMessage);
              return (
                <div key={message.id}>
                  {beforeCustom}
                  {customRendered ?? (
                    <div
                      data-testid="copilot-activity-message"
                      style={{
                        fontSize: "13px",
                        color: "#999",
                        padding: "4px 0",
                        fontStyle: "italic",
                      }}
                    >
                      {typeof activityMessage.content === "string"
                        ? (activityMessage.content as unknown as string)
                        : JSON.stringify(activityMessage.content)}
                    </div>
                  )}
                  {afterCustom}
                </div>
              );
            }
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
