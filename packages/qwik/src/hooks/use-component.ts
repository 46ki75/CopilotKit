import type { StandardSchemaV1, InferSchemaOutput } from "@copilotkit/shared";
import type { Component } from "@builder.io/qwik";
import { useFrontendTool } from "./use-frontend-tool";

type InferRenderProps<T> = T extends StandardSchemaV1
  ? InferSchemaOutput<T>
  : any;

/**
 * Registers a Qwik component as a frontend tool renderer in chat.
 *
 * This is the Qwik equivalent of `useComponent` from `@copilotkit/react-core`.
 *
 * This hook is a convenience wrapper around `useFrontendTool` that:
 * - builds a model-facing tool description,
 * - forwards optional schema parameters (any Standard Schema V1 compatible library),
 * - renders your component with tool call parameters.
 *
 * @typeParam TSchema - Schema describing tool parameters, or `undefined` when no schema is given.
 * @param config - Tool registration config.
 */
export function useComponent<
  TSchema extends StandardSchemaV1 | undefined = undefined,
>(config: {
  name: string;
  description?: string;
  parameters?: TSchema;
  render: Component<NoInfer<InferRenderProps<TSchema>>>;
  agentId?: string;
}): void {
  const prefix = `Use this tool to display the "${config.name}" component in the chat. This tool renders a visual UI component for the user.`;
  const fullDescription = config.description
    ? `${prefix}\n\n${config.description}`
    : prefix;

  useFrontendTool({
    name: config.name,
    description: fullDescription,
    agentId: config.agentId,
  });
}
