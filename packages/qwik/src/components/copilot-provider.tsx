import {
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type NoSerialize,
  noSerialize,
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
  const coreRef = useSignal<NoSerialize<CopilotKitCore>>(undefined);

  // CopilotKitCore is a non-serializable class instance. We use
  // useVisibleTask$ to create it once on the client and noSerialize to
  // prevent Qwik from trying to serialize it.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const core = new CopilotKitCore({
      runtimeUrl: props.runtimeUrl,
      headers: props.headers ?? {},
      credentials: props.credentials,
      properties: props.properties ?? {},
    });
    coreRef.value = noSerialize(core);

    cleanup(() => {
      coreRef.value = undefined;
    });
  });

  useContextProvider(CopilotKitContextId, {
    coreRef,
    isLoading,
  });

  return <Slot />;
});
