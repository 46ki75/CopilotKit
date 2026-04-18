export { CopilotKit } from "./copilot-provider";
export type { CopilotChatProps } from "./copilot-chat";
export { CopilotChat } from "./copilot-chat";
export {
  CopilotChatConfigurationProvider,
  useCopilotChatConfiguration,
  type CopilotChatConfigurationProviderProps,
} from "./copilot-chat-configuration-provider";

// v2 chat components
export * from "./chat";
export { WildcardToolCallRender } from "./wildcard-tool-call-render";

// Activity renderers
export {
  MCPAppsActivityRenderer,
  MCPAppsActivityType,
  MCPAppsActivityContentSchema,
  type MCPAppsActivityContent,
} from "./MCPAppsActivityRenderer";

export {
  OpenGenerativeUIActivityRenderer,
  OpenGenerativeUIToolRenderer,
  OpenGenerativeUIActivityType,
  OpenGenerativeUIContentSchema,
  GenerateSandboxedUiArgsSchema,
  type OpenGenerativeUIContent,
  type GenerateSandboxedUiArgs,
} from "./OpenGenerativeUIRenderer";
