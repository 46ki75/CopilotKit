import { useContext, useVisibleTask$ } from "@builder.io/qwik";
import type { StandardSchemaV1, InferSchemaOutput } from "@copilotkit/shared";
import type { JSXOutput } from "@builder.io/qwik";
import type { ToolCallStatus } from "@copilotkit/core";
import { CopilotKitContextId } from "../context/copilot-context";
import { defineToolCallRenderer } from "../types/define-tool-call-renderer";
import type { CopilotKitCoreQwik } from "../lib/qwik-core";

export interface RenderToolInProgressProps<S extends StandardSchemaV1> {
  name: string;
  toolCallId: string;
  parameters: Partial<InferSchemaOutput<S>>;
  status: "inProgress";
  result: undefined;
}

export interface RenderToolExecutingProps<S extends StandardSchemaV1> {
  name: string;
  toolCallId: string;
  parameters: InferSchemaOutput<S>;
  status: "executing";
  result: undefined;
}

export interface RenderToolCompleteProps<S extends StandardSchemaV1> {
  name: string;
  toolCallId: string;
  parameters: InferSchemaOutput<S>;
  status: "complete";
  result: string;
}

export type RenderToolProps<S extends StandardSchemaV1> =
  | RenderToolInProgressProps<S>
  | RenderToolExecutingProps<S>
  | RenderToolCompleteProps<S>;

type RenderToolConfig<S extends StandardSchemaV1> = {
  name: string;
  parameters?: S;
  render: (props: RenderToolProps<S>) => JSXOutput;
  agentId?: string;
};

/**
 * Registers a wildcard (`"*"`) renderer for tool calls.
 */
export function useRenderTool(config: {
  name: "*";
  render: (props: any) => JSXOutput;
  agentId?: string;
}): void;

/**
 * Registers a name-scoped renderer for tool calls.
 */
export function useRenderTool<S extends StandardSchemaV1>(config: {
  name: string;
  parameters: S;
  render: (props: RenderToolProps<S>) => JSXOutput;
  agentId?: string;
}): void;

/**
 * Registers a renderer entry in CopilotKit's `renderToolCalls` registry.
 *
 * This is the Qwik equivalent of `useRenderTool` from `@copilotkit/react-core`.
 */
export function useRenderTool<S extends StandardSchemaV1>(
  config: RenderToolConfig<S>,
): void {
  const ctx = useContext(CopilotKitContextId);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => ctx.coreRef.value);
    track(() => config.name);

    const core = ctx.coreRef.value as CopilotKitCoreQwik | undefined;
    if (!core) return;

    const renderer =
      config.name === "*" && !config.parameters
        ? defineToolCallRenderer({
            name: "*",
            render: (props: {
              name: string;
              toolCallId: string;
              args: any;
              status: ToolCallStatus;
              result: any;
            }) => config.render({ ...props, parameters: props.args } as any),
            ...(config.agentId ? { agentId: config.agentId } : {}),
          })
        : defineToolCallRenderer({
            name: config.name,
            args: config.parameters!,
            render: (props: {
              name: string;
              toolCallId: string;
              args: any;
              status: ToolCallStatus;
              result: any;
            }) => config.render({ ...props, parameters: props.args } as any),
            ...(config.agentId ? { agentId: config.agentId } : {}),
          });

    core.addHookRenderToolCall(renderer);
    // No cleanup removal — keeps renderer for chat history
  });
}
