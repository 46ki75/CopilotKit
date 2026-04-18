import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { CopilotKitCore } from "@copilotkit/core";

type Anchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface CopilotKitInspectorProps {
  core?: CopilotKitCore | null;
  defaultAnchor?: Anchor;
  [key: string]: unknown;
}

/**
 * CopilotKitInspector renders the CopilotKit web inspector component.
 * The inspector is loaded lazily on the client to avoid SSR issues.
 */
export const CopilotKitInspector = component$<CopilotKitInspectorProps>(
  (props) => {
    const containerRef = useSignal<HTMLElement | undefined>(undefined);
    const mounted = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(async ({ cleanup }) => {
      let isMounted = true;

      try {
        const mod = await import("@copilotkit/web-inspector" as any);
        mod.defineWebInspector?.();

        if (!isMounted || !containerRef.value) return;

        const tagName = mod.WEB_INSPECTOR_TAG as string;
        const el = document.createElement(tagName);

        if (props.core) {
          (el as any).core = props.core;
        }
        if (props.defaultAnchor) {
          el.setAttribute("default-anchor", props.defaultAnchor);
        }

        containerRef.value.appendChild(el);
        mounted.value = true;

        cleanup(() => {
          isMounted = false;
          el.remove();
          mounted.value = false;
        });
      } catch {
        // @copilotkit/web-inspector is optional — silently ignore if not installed.
      }
    });

    return <div ref={containerRef} />;
  },
);
