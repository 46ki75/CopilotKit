import { z } from "zod";
import type { StandardSchemaV1, InferSchemaOutput } from "@copilotkit/shared";
import { QwikToolCallRenderer } from "./qwik-tool-call-renderer";
import { ToolCallStatus } from "@copilotkit/core";
import type { JSXOutput } from "@builder.io/qwik";

type RenderProps<T> =
  | {
      name: string;
      toolCallId: string;
      args: Partial<T>;
      status: ToolCallStatus.InProgress;
      result: undefined;
    }
  | {
      name: string;
      toolCallId: string;
      args: T;
      status: ToolCallStatus.Executing;
      result: undefined;
    }
  | {
      name: string;
      toolCallId: string;
      args: T;
      status: ToolCallStatus.Complete;
      result: string;
    };

export function defineToolCallRenderer(def: {
  name: "*";
  render: (props: RenderProps<any>) => JSXOutput;
  agentId?: string;
}): QwikToolCallRenderer<any>;

export function defineToolCallRenderer<S extends StandardSchemaV1>(def: {
  name: string;
  args: S;
  render: (props: RenderProps<InferSchemaOutput<S>>) => JSXOutput;
  agentId?: string;
}): QwikToolCallRenderer<InferSchemaOutput<S>>;

export function defineToolCallRenderer<S extends StandardSchemaV1>(def: {
  name: string;
  args?: S;
  render: (props: any) => JSXOutput;
  agentId?: string;
}): QwikToolCallRenderer<any> {
  const argsSchema = def.args ?? z.any();

  return {
    name: def.name,
    args: argsSchema,
    render: def.render as any,
    ...(def.agentId ? { agentId: def.agentId } : {}),
  };
}
