import {
  component$,
  Slot,
  useContextProvider,
  useContext,
  useSignal,
} from "@builder.io/qwik";
import { DEFAULT_AGENT_ID, randomUUID } from "@copilotkit/shared";
import {
  CopilotChatConfigurationContextId,
  CopilotChatDefaultLabels,
  type CopilotChatLabels,
  type CopilotChatConfigurationValue,
} from "../context/copilot-chat-configuration-context";

// Re-export for convenience
export { useCopilotChatConfiguration } from "../context/copilot-chat-configuration-context";

export interface CopilotChatConfigurationProviderProps {
  labels?: Partial<CopilotChatLabels>;
  agentId?: string;
  threadId?: string;
  isModalDefaultOpen?: boolean;
}

export const CopilotChatConfigurationProvider =
  component$<CopilotChatConfigurationProviderProps>((props) => {
    const parentConfig = useContext(CopilotChatConfigurationContextId, null);

    const mergedLabels: CopilotChatLabels = {
      ...CopilotChatDefaultLabels,
      ...(parentConfig?.labels ?? {}),
      ...(props.labels ?? {}),
    };

    const resolvedAgentId =
      props.agentId ?? parentConfig?.agentId ?? DEFAULT_AGENT_ID;
    const resolvedThreadId =
      props.threadId ?? parentConfig?.threadId ?? randomUUID();

    const resolvedDefaultOpen = props.isModalDefaultOpen ?? true;
    const isModalOpen = useSignal(resolvedDefaultOpen);

    const configValue: CopilotChatConfigurationValue = {
      labels: mergedLabels,
      agentId: resolvedAgentId,
      threadId: resolvedThreadId,
      isModalOpen,
    };

    useContextProvider(CopilotChatConfigurationContextId, configValue);

    return <Slot />;
  });
