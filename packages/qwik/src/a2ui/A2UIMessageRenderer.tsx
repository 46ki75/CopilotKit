import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { JSXOutput } from "@builder.io/qwik";
import { z } from "zod";
import type { QwikActivityMessageRenderer } from "../types/qwik-activity-message-renderer";
import { useContext } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * The container key used to wrap A2UI operations.
 * Must match A2UI_OPERATIONS_KEY in @ag-ui/a2ui-middleware.
 */
const A2UI_OPERATIONS_KEY = "a2ui_operations";

/**
 * User action as dispatched by A2UI components.
 */
export type A2UIUserAction = {
  name: string;
  sourceComponentId: string;
  surfaceId: string;
  timestamp: string;
  context?: Record<string, unknown>;
  dataContextPath?: string;
};

export type A2UIMessageRendererOptions = {
  theme?: Record<string, unknown>;
  catalog?: unknown;
  loadingComponent?: () => JSXOutput;
};

/**
 * Default loading spinner shown while an A2UI surface is generating.
 */
const DefaultA2UILoading = component$(() => {
  return (
    <div
      class="cpk:flex cpk:flex-col cpk:gap-3 cpk:rounded-xl cpk:border cpk:border-gray-100 cpk:bg-gray-50/50 cpk:p-5"
      style={{ minHeight: "120px" }}
    >
      <div class="cpk:flex cpk:items-center cpk:gap-2">
        <div
          class="cpk:h-3 cpk:w-3 cpk:rounded-full cpk:bg-gray-200"
          style={{ animation: "cpk-a2ui-pulse 1.5s ease-in-out infinite" }}
        />
        <span class="cpk:text-xs cpk:font-medium cpk:text-gray-400">
          Generating UI...
        </span>
      </div>
      <div class="cpk:flex cpk:flex-col cpk:gap-2">
        {[0.8, 0.6, 0.4].map((width, i) => (
          <div
            key={i}
            class="cpk:h-3 cpk:rounded cpk:bg-gray-200/70"
            style={{
              width: `${width * 100}%`,
              animation: `cpk-a2ui-pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes cpk-a2ui-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
});

interface A2UISurfaceProps {
  surfaceId: string;
  operations: unknown[];
  agentId?: string;
}

/**
 * Renders a single A2UI surface.
 *
 * Attempts to use `@copilotkit/a2ui-renderer` if available (optional peer
 * dependency), otherwise renders a fallback notice.
 */
const A2UISurface = component$<A2UISurfaceProps>(
  ({ surfaceId, operations, agentId }) => {
    const ctx = useContext(CopilotKitContextId);
    const rendererReady = useSignal(false);
    const containerRef = useSignal<HTMLDivElement | undefined>(undefined);

    useTask$(async ({ track, cleanup }) => {
      track(() => containerRef.value);
      track(() => operations.length);
      track(() => ctx.coreRef.value);

      const container = containerRef.value;
      if (!container) return;

      // Attempt to use @copilotkit/a2ui-renderer's web component approach
      // This is a best-effort dynamic import — the package is an optional peer dep.
      try {
        // Import just the catalog utilities (pure TS, no React dependency)
        await import("@copilotkit/a2ui-renderer" as string);
        rendererReady.value = true;
      } catch {
        // a2ui-renderer not installed; the fallback notice is shown instead.
      }

      cleanup(() => {
        // Clean up any mounted elements
        if (container) container.innerHTML = "";
      });
    });

    if (!rendererReady.value) {
      return (
        <div class="cpk:rounded-lg cpk:border cpk:border-blue-200 cpk:bg-blue-50 cpk:p-3 cpk:text-sm cpk:text-blue-700">
          A2UI surface ({surfaceId}): install `@copilotkit/a2ui-renderer` to
          enable rendering.
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        class="cpk:flex cpk:w-full cpk:flex-1 cpk:flex-col cpk:gap-4"
        data-a2ui-surface={surfaceId}
        data-a2ui-agent={agentId}
      />
    );
  },
);

function getOperationSurfaceId(operation: unknown): string | null {
  if (!operation || typeof operation !== "object") {
    return null;
  }

  const op = operation as Record<string, unknown>;

  if (typeof op.surfaceId === "string") {
    return op.surfaceId;
  }

  // v0.9 message keys
  return (
    (op.createSurface as { surfaceId?: string } | undefined)?.surfaceId ??
    (op.updateComponents as { surfaceId?: string } | undefined)?.surfaceId ??
    (op.updateDataModel as { surfaceId?: string } | undefined)?.surfaceId ??
    (op.deleteSurface as { surfaceId?: string } | undefined)?.surfaceId ??
    null
  );
}

/**
 * Qwik equivalent of `createA2UIMessageRenderer` from `@copilotkit/react-core`.
 *
 * Creates an activity message renderer that displays A2UI surfaces.
 * For full rendering capabilities, `@copilotkit/a2ui-renderer` must be
 * installed (optional peer dependency).
 *
 * @example
 * ```tsx
 * const renderer = createA2UIMessageRenderer({ theme: myTheme });
 * // Pass to CopilotKitProvider via renderActivityMessages prop
 * ```
 */
export function createA2UIMessageRenderer(
  options: A2UIMessageRendererOptions = {},
): QwikActivityMessageRenderer<unknown> {
  return {
    activityType: "a2ui-surface",
    content: z.any(),
    render: component$<{ content: unknown; agent?: unknown }>(
      ({ content, agent }) => {
        const operations = useSignal<unknown[]>([]);

        useTask$(({ track }) => {
          track(() => content);

          const incoming = (content as Record<string, unknown> | null)?.[
            A2UI_OPERATIONS_KEY
          ];
          if (!content || !Array.isArray(incoming)) {
            operations.value = [];
            return;
          }
          operations.value = incoming;
        });

        if (!operations.value.length) {
          const LoadingComponent = options.loadingComponent
            ? component$(() => options.loadingComponent!())
            : DefaultA2UILoading;
          return <LoadingComponent />;
        }

        // Group operations by surface ID
        const groups = new Map<string, unknown[]>();
        for (const op of operations.value) {
          const surfaceId = getOperationSurfaceId(op) ?? "default";
          if (!groups.has(surfaceId)) groups.set(surfaceId, []);
          groups.get(surfaceId)!.push(op);
        }

        return (
          <div class="cpk:flex cpk:min-h-0 cpk:flex-1 cpk:flex-col cpk:gap-6 cpk:overflow-auto cpk:py-6">
            {Array.from(groups.entries()).map(([surfaceId, ops]) => (
              <A2UISurface
                key={surfaceId}
                surfaceId={surfaceId}
                operations={ops}
                agentId={typeof agent === "string" ? agent : undefined}
              />
            ))}
          </div>
        );
      },
    ),
  };
}
