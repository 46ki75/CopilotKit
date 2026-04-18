import type { StandardSchemaV1 } from "@copilotkit/shared";
import { ToolCallStatus } from "@copilotkit/core";
import type { Component } from "@builder.io/qwik";

export interface QwikToolCallRenderer<T = unknown> {
  name: string;
  args: StandardSchemaV1<any, T>;
  agentId?: string;
  render: Component<
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
      }
  >;
}
