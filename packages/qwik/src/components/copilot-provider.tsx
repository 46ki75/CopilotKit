import {
  component$,
  Slot,
  useContextProvider,
  useSignal,
} from "@builder.io/qwik";
import { CopilotKitCore } from "@copilotkit/core";
import {
  CopilotKitContextId,
  type CopilotKitConfig,
} from "../context/copilot-context";

/**
 * The `CopilotKit` component provides the CopilotKit context to its children.
 * It wraps your application (or a sub-tree) and makes the CopilotKit core
 * instance available to all nested hooks and components.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit } from "@copilotkit/qwik";
 *
 * export default component$(() => {
 *   return (
 *     <CopilotKit runtimeUrl="https://your-runtime-url.com/copilotkit">
 *       <Slot />
 *     </CopilotKit>
 *   );
 * });
 * ```
 */
export const CopilotKit = component$<CopilotKitConfig>((props) => {
  const isLoading = useSignal(false);

  const core = new CopilotKitCore({
    runtimeUrl: props.runtimeUrl,
    headers: props.headers ?? {},
    credentials: props.credentials,
    properties: props.properties ?? {},
  });

  useContextProvider(CopilotKitContextId, {
    core,
    isLoading,
  });

  return <Slot />;
});
