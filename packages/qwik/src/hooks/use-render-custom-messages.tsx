import { useContext } from "@builder.io/qwik";
import type { JSXOutput } from "@builder.io/qwik";
import type { Message } from "@ag-ui/core";
import { CopilotKitContextId } from "../context/copilot-context";
import { useCopilotChatConfiguration } from "../context/copilot-chat-configuration-context";
import type { CopilotKitCoreQwik } from "../lib/qwik-core";
import type { QwikCustomMessageRendererPosition } from "../types/qwik-custom-message-renderer";

interface UseRenderCustomMessagesParams {
  message: Message;
  position: QwikCustomMessageRendererPosition;
}

/**
 * Hook that returns a function to render custom messages.
 *
 * This is the Qwik equivalent of `useRenderCustomMessages` from `@copilotkit/react-core`.
 */
export function useRenderCustomMessages():
  | ((params: UseRenderCustomMessagesParams) => JSXOutput | null)
  | null {
  const ctx = useContext(CopilotKitContextId);
  const config = useCopilotChatConfiguration();

  if (!config) {
    return null;
  }

  const { agentId, threadId } = config;

  return (params: UseRenderCustomMessagesParams): JSXOutput | null => {
    const core = ctx.coreRef.value as CopilotKitCoreQwik | undefined;
    if (!core) return null;

    const customMessageRenderers = [...core.renderCustomMessages]
      .filter(
        (renderer) =>
          renderer.agentId === undefined || renderer.agentId === agentId,
      )
      .sort((a, b) => {
        const aHasAgent = a.agentId !== undefined;
        const bHasAgent = b.agentId !== undefined;
        if (aHasAgent === bHasAgent) return 0;
        return aHasAgent ? -1 : 1;
      });

    if (!customMessageRenderers.length) {
      return null;
    }

    const { message, position } = params;
    const resolvedRunId =
      core.getRunIdForMessage(agentId, threadId, message.id) ??
      core.getRunIdsForThread(agentId, threadId).slice(-1)[0];
    const runId = resolvedRunId ?? `missing-run-id:${message.id}`;
    const agent = core.getAgent(agentId);
    if (!agent) {
      return null;
    }

    const messagesIdsInRun = resolvedRunId
      ? agent.messages
          .filter(
            (msg) =>
              core.getRunIdForMessage(agentId, threadId, msg.id) ===
              resolvedRunId,
          )
          .map((msg) => msg.id)
      : [message.id];

    const rawMessageIndex = agent.messages.findIndex(
      (msg) => msg.id === message.id,
    );
    const messageIndex = rawMessageIndex >= 0 ? rawMessageIndex : 0;
    const messageIndexInRun = resolvedRunId
      ? Math.max(messagesIdsInRun.indexOf(message.id), 0)
      : 0;
    const numberOfMessagesInRun = resolvedRunId ? messagesIdsInRun.length : 1;
    const stateSnapshot = resolvedRunId
      ? core.getStateByRun(agentId, threadId, resolvedRunId)
      : undefined;

    let result: JSXOutput | null = null;
    for (const renderer of customMessageRenderers) {
      if (!renderer.render) {
        continue;
      }
      const RenderComponent = renderer.render;
      result = (
        <RenderComponent
          message={message}
          position={position}
          runId={runId}
          messageIndex={messageIndex}
          messageIndexInRun={messageIndexInRun}
          numberOfMessagesInRun={numberOfMessagesInRun}
          agentId={agentId}
          stateSnapshot={stateSnapshot}
        />
      );
      if (result) {
        break;
      }
    }
    return result;
  };
}
