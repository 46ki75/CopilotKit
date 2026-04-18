import { Message } from "@ag-ui/core";
import type { Component } from "@builder.io/qwik";

export type QwikCustomMessageRendererPosition = "before" | "after";

export interface QwikCustomMessageRenderer {
  agentId?: string;
  render: Component<{
    message: Message;
    position: QwikCustomMessageRendererPosition;
    runId: string;
    messageIndex: number;
    messageIndexInRun: number;
    numberOfMessagesInRun: number;
    agentId: string;
    stateSnapshot: any;
  }> | null;
}
