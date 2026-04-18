import { FrontendTool, ToolCallStatus } from "@copilotkit/core";
import type { Component } from "@builder.io/qwik";

export type QwikHumanInTheLoop<
  T extends Record<string, unknown> = Record<string, unknown>,
> = Omit<FrontendTool<T>, "handler"> & {
  render: Component<
    | {
        name: string;
        description: string;
        args: Partial<T>;
        status: ToolCallStatus.InProgress;
        result: undefined;
        respond: undefined;
      }
    | {
        name: string;
        description: string;
        args: T;
        status: ToolCallStatus.Executing;
        result: undefined;
        respond: (result: unknown) => Promise<void>;
      }
    | {
        name: string;
        description: string;
        args: T;
        status: ToolCallStatus.Complete;
        result: string;
        respond: undefined;
      }
  >;
};
