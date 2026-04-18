export { useCopilotContext, requireCore } from "./use-copilot-context";
export {
  useCopilotReadable,
  type UseCopilotReadableOptions,
} from "./use-copilot-readable";
export {
  useCopilotAction,
  type UseCopilotActionOptions,
} from "./use-copilot-action";
export {
  useCopilotChat,
  type UseCopilotChatOptions,
  type UseCopilotChatReturn,
} from "./use-copilot-chat";
// v2 API
export {
  useAgent,
  type UseAgentOptions,
  type UseAgentReturn,
} from "./use-agent";
export {
  useAgentContext,
  type AgentContextInput,
  type JsonSerializable,
} from "./use-agent-context";
export { useFrontendTool, type FrontendToolConfig } from "./use-frontend-tool";
export { useCapabilities } from "./use-capabilities";
export {
  useSuggestions,
  type UseSuggestionsOptions,
  type UseSuggestionsReturn,
} from "./use-suggestions";
export {
  useConfigureSuggestions,
  type SuggestionsConfigInput,
} from "./use-configure-suggestions";
export {
  useThreads,
  type Thread,
  type UseThreadsInput,
  type UseThreadsReturn,
} from "./use-threads";
export {
  useInterrupt,
  type UseInterruptConfig,
  type UseInterruptReturn,
  type InterruptEvent,
  type InterruptRenderProps,
  type InterruptHandlerProps,
} from "./use-interrupt";
export {
  useHumanInTheLoop,
  type HumanInTheLoopConfig,
  type UseHumanInTheLoopReturn,
} from "./use-human-in-the-loop";
export {
  useAttachments,
  type UseAttachmentsProps,
  type UseAttachmentsReturn,
} from "./use-attachments";
