import { useContext, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { JSXOutput } from "@builder.io/qwik";
import type { ToolCall, ToolMessage } from "@ag-ui/core";
import { ToolCallStatus } from "@copilotkit/core";
import { DEFAULT_AGENT_ID, partialJSONParse } from "@copilotkit/shared";
import { CopilotKitContextId } from "../context/copilot-context";
import { useCopilotChatConfiguration } from "../context/copilot-chat-configuration-context";
import type { CopilotKitCoreQwik } from "../lib/qwik-core";
import type { QwikToolCallRenderer } from "../types/qwik-tool-call-renderer";

export interface UseRenderToolCallProps {
  toolCall: ToolCall;
  toolMessage?: ToolMessage;
}

/**
 * Hook that returns a function to render tool calls based on the render
 * functions defined in CopilotKit's registry.
 *
 * This is the Qwik equivalent of `useRenderToolCall` from `@copilotkit/react-core`.
 */
export function useRenderToolCall(): (
  props: UseRenderToolCallProps,
) => JSXOutput | null {
  const ctx = useContext(CopilotKitContextId);
  const chatConfig = useCopilotChatConfiguration();
  const agentId = chatConfig?.agentId ?? DEFAULT_AGENT_ID;

  const renderToolCallsSig = useSignal<
    Readonly<QwikToolCallRenderer<any>[]>
  >([]);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value as CopilotKitCoreQwik | undefined;
    if (!core) return;

    renderToolCallsSig.value = core.renderToolCalls;

    const subscription = core.subscribe({
      onRenderToolCallsChanged: ({ renderToolCalls }) => {
        renderToolCallsSig.value = renderToolCalls;
      },
    });

    cleanup(() => {
      subscription.unsubscribe();
    });
  });

  return ({ toolCall, toolMessage }: UseRenderToolCallProps) => {
    const renderToolCalls = renderToolCallsSig.value;

    const exactMatches = renderToolCalls.filter(
      (rc) => rc.name === toolCall.function.name,
    );

    const renderConfig =
      exactMatches.find((rc) => rc.agentId === agentId) ||
      exactMatches.find((rc) => !rc.agentId) ||
      exactMatches[0] ||
      renderToolCalls.find((rc) => rc.name === "*");

    if (!renderConfig) {
      return null;
    }

    const RenderComponent = renderConfig.render;
    const args = partialJSONParse(toolCall.function.arguments);
    const toolName = toolCall.function.name;

    if (toolMessage) {
      return (
        <RenderComponent
          name={toolName}
          toolCallId={toolCall.id}
          args={args}
          status={ToolCallStatus.Complete}
          result={toolMessage.content}
        />
      );
    } else {
      return (
        <RenderComponent
          name={toolName}
          toolCallId={toolCall.id}
          args={args}
          status={ToolCallStatus.InProgress}
          result={undefined}
        />
      );
    }
  };
}
