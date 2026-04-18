import type { FrontendTool } from "@copilotkit/core";
import type { QwikToolCallRenderer } from "./qwik-tool-call-renderer";

export type QwikFrontendTool<
  T extends Record<string, unknown> = Record<string, unknown>,
> = FrontendTool<T> & {
  render?: QwikToolCallRenderer<T>["render"];
};
