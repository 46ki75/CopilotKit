import {
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  noSerialize,
} from "@builder.io/qwik";
import type { NoSerialize } from "@builder.io/qwik";
import { CopilotKitCoreQwik } from "../lib/qwik-core";
import { CopilotKitContextId } from "../context/copilot-context";
import type { CopilotKitConfig } from "../context/copilot-context";

const COPILOT_CLOUD_CHAT_URL = "https://api.cloud.copilotkit.ai/copilotkit/v1";
const HEADER_PUBLIC_API_KEY = "X-CopilotCloud-Public-Api-Key";

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
 *
 * ## Development mode (no runtime)
 *
 * ```tsx
 * import { HttpAgent } from "@ag-ui/client";
 *
 * export default component$(() => {
 *   return (
 *     <CopilotKit
 *       agents__unsafe_dev_only={{ myAgent: new HttpAgent({ url: "..." }) }}
 *     >
 *       <Slot />
 *     </CopilotKit>
 *   );
 * });
 * ```
 */
export const CopilotKit = component$<CopilotKitConfig>((props) => {
  const isLoading = useSignal(false);
  const coreRef = useSignal<NoSerialize<CopilotKitCoreQwik>>(undefined);

  // CopilotKitCore is a non-serializable class instance. We use
  // useVisibleTask$ to create it once on the client and noSerialize to
  // prevent Qwik from trying to serialize it.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    // Resolve runtime URL: publicApiKey points to CopilotCloud.
    const runtimeUrl =
      props.runtimeUrl ??
      (props.publicApiKey ? COPILOT_CLOUD_CHAT_URL : undefined);

    // Merge public API key header with any user-supplied headers.
    const headers: Record<string, string> = { ...props.headers };
    if (props.publicApiKey) {
      headers[HEADER_PUBLIC_API_KEY] = props.publicApiKey;
    }

    const core = new CopilotKitCoreQwik({
      runtimeUrl,
      runtimeTransport: props.runtimeTransport ?? "auto",
      headers,
      credentials: props.credentials,
      properties: props.properties ?? {},
      agents__unsafe_dev_only: props.agents__unsafe_dev_only ?? {},
    });

    // Wire up error handler if provided.
    if (props.onError) {
      const handler = props.onError;
      core.subscribe({
        onError: ({ error, code, context }) =>
          handler({ error, code, context }),
      });
    }

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
