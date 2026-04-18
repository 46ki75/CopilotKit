import { component$ } from "@builder.io/qwik";
import type { AssistantMessage, Message, ToolMessage } from "@ag-ui/core";
import { useRenderToolCall } from "../../hooks/use-render-tool-call";

export interface CopilotChatToolCallsViewProps {
  message: AssistantMessage;
  messages?: Message[];
}

export const CopilotChatToolCallsView = component$<CopilotChatToolCallsViewProps>(
  (props) => {
    const renderToolCall = useRenderToolCall();

    if (!props.message.toolCalls || props.message.toolCalls.length === 0) {
      return null;
    }

    return (
      <>
        {props.message.toolCalls.map((toolCall) => {
          const toolMessage = (props.messages ?? []).find(
            (m) => m.role === "tool" && (m as ToolMessage).toolCallId === toolCall.id,
          ) as ToolMessage | undefined;

          const rendered = renderToolCall({
            toolCall,
            toolMessage,
          });

          return <div key={toolCall.id}>{rendered}</div>;
        })}
      </>
    );
  },
);
