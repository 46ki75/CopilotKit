import { ActivityMessage } from "@ag-ui/core";
import type { AbstractAgent } from "@ag-ui/client";
import type { StandardSchemaV1 } from "@copilotkit/shared";
import type { Component } from "@builder.io/qwik";

export interface QwikActivityMessageRenderer<TActivityContent> {
  activityType: string;
  agentId?: string;
  content: StandardSchemaV1<any, TActivityContent>;
  render: Component<{
    activityType: string;
    content: TActivityContent;
    message: ActivityMessage;
    agent: AbstractAgent | undefined;
  }>;
}
