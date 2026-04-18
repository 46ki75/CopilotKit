import { useContext } from "@builder.io/qwik";
import type { JSXOutput } from "@builder.io/qwik";
import type { ActivityMessage } from "@ag-ui/core";
import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
import { CopilotKitContextId } from "../context/copilot-context";
import { useCopilotChatConfiguration } from "../context/copilot-chat-configuration-context";
import type { CopilotKitCoreQwik } from "../lib/qwik-core";
import type { QwikActivityMessageRenderer } from "../types/qwik-activity-message-renderer";

export interface UseRenderActivityMessageReturn {
  findRenderer: (
    activityType: string,
  ) => QwikActivityMessageRenderer<unknown> | null;
  renderActivityMessage: (message: ActivityMessage) => JSXOutput | null;
}

/**
 * Hook that returns functions to find and render activity messages.
 *
 * This is the Qwik equivalent of `useRenderActivityMessage` from `@copilotkit/react-core`.
 */
export function useRenderActivityMessage(): UseRenderActivityMessageReturn {
  const ctx = useContext(CopilotKitContextId);
  const chatConfig = useCopilotChatConfiguration();
  const agentId = chatConfig?.agentId ?? DEFAULT_AGENT_ID;

  const findRenderer = (
    activityType: string,
  ): QwikActivityMessageRenderer<unknown> | null => {
    const core = ctx.coreRef.value as CopilotKitCoreQwik | undefined;
    if (!core) return null;

    const renderers = core.renderActivityMessages;
    if (!renderers.length) {
      return null;
    }

    const matches = renderers.filter(
      (renderer) => renderer.activityType === activityType,
    );

    return (
      matches.find((candidate) => candidate.agentId === agentId) ??
      matches.find((candidate) => candidate.agentId === undefined) ??
      renderers.find((candidate) => candidate.activityType === "*") ??
      null
    );
  };

  const renderActivityMessage = (
    message: ActivityMessage,
  ): JSXOutput | null => {
    const renderer = findRenderer(message.activityType);
    if (!renderer) {
      return null;
    }

    const parseResult = (renderer.content as any).safeParse?.(message.content);
    if (parseResult && !parseResult.success) {
      console.warn(
        `Failed to parse content for activity message '${message.activityType}':`,
        parseResult.error,
      );
      return null;
    }

    const parsedContent = parseResult ? parseResult.data : message.content;
    const RenderComponent = renderer.render;

    const core = ctx.coreRef.value as CopilotKitCoreQwik | undefined;
    const agent = core?.getAgent(agentId);

    return (
      <RenderComponent
        activityType={message.activityType}
        content={parsedContent}
        message={message}
        agent={agent}
      />
    );
  };

  return { findRenderer, renderActivityMessage };
}
