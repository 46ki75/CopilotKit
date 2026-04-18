export { CopilotKit } from "./copilot-provider";
export type { CopilotChatProps } from "./copilot-chat";
export { CopilotChat } from "./copilot-chat";
export {
  CopilotChatConfigurationProvider,
  useCopilotChatConfiguration,
  type CopilotChatConfigurationProviderProps,
} from "./copilot-chat-configuration-provider";
export {
  LicenseWarningBanner,
  InlineFeatureWarning,
} from "./license-warning-banner";
export { CopilotKitInspector, type CopilotKitInspectorProps } from "./CopilotKitInspector";
export {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
export { Button, type ButtonVariant, type ButtonSize } from "./ui/button";
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";

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
