import { component$, useTask$ } from "@builder.io/qwik";
import { useAgentContext } from "../hooks/use-agent-context";
import { useContext } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Context description used to identify the A2UI component schema.
 * Must match the constant in @ag-ui/a2ui-middleware so the middleware can
 * overwrite a frontend-provided schema with a server-side one.
 */
export const A2UI_SCHEMA_CONTEXT_DESCRIPTION =
  "A2UI Component Schema — available components for generating UI surfaces. Use these component names and properties when creating A2UI operations.";

/**
 * Default generation guidelines injected when A2UI is enabled.
 */
const A2UI_DEFAULT_GENERATION_GUIDELINES =
  "A2UI generation guidelines — protocol rules, tool arguments, path rules, data model format, and form/two-way-binding instructions.";

/**
 * Default design guidelines injected when A2UI is enabled.
 */
const A2UI_DEFAULT_DESIGN_GUIDELINES =
  "A2UI design guidelines — visual design rules, component hierarchy tips, and action handler patterns.";

/**
 * A minimal catalog representation for the context description.
 * For full schema support, install `@copilotkit/a2ui-renderer` and pass
 * the catalog object produced by its `createCatalog` API.
 */
export interface A2UICatalogContextProps {
  /**
   * The A2UI catalog object produced by `createCatalog()` from
   * `@copilotkit/a2ui-renderer`. When omitted the basic catalog is assumed.
   */
  catalog?: {
    id?: string;
    components?: Map<string, { schema?: unknown }>;
  };

  /**
   * When true, the full component schemas are sent as context so the
   * middleware can optionally overwrite them with a server-side schema.
   * Defaults to true.
   */
  includeSchema?: boolean;
}

/**
 * Build a brief context string describing the available A2UI catalog.
 * This is a simplified, framework-agnostic version of the utility from
 * `@copilotkit/a2ui-renderer`.
 */
function buildCatalogDescription(
  catalog?: A2UICatalogContextProps["catalog"],
): string {
  const lines: string[] = ["Available A2UI catalog:"];

  if (!catalog || !catalog.id) {
    lines.push(
      "- https://a2ui.org/specification/v0_9/basic_catalog.json (basic catalog)",
    );
    return lines.join("\n");
  }

  lines.push(`- ${catalog.id}`);

  if (catalog.components && catalog.components.size > 0) {
    lines.push("  Custom components:");
    for (const [name] of catalog.components) {
      lines.push(`  - ${name}`);
    }
  }

  return lines.join("\n");
}

/**
 * Renders agent context describing the available A2UI catalog and custom components.
 * Only mount this component when A2UI is enabled.
 *
 * This is the Qwik equivalent of `A2UICatalogContext` from
 * `@copilotkit/react-core`.
 *
 * When `includeSchema` is true, the full component schemas (JSON Schema) are also
 * sent as context using the same description key as the A2UI middleware, so the
 * middleware can optionally overwrite it with a server-side schema.
 *
 * For full schema support, install `@copilotkit/a2ui-renderer` and pass the
 * catalog produced by its `createCatalog()` API.
 */
export const A2UICatalogContext = component$<A2UICatalogContextProps>(
  ({ catalog, includeSchema = true }) => {
    const ctx = useContext(CopilotKitContextId);

    // Register catalog capabilities context
    useAgentContext({
      description:
        "A2UI catalog capabilities: available catalog IDs and custom component definitions the client can render.",
      value: buildCatalogDescription(catalog),
    });

    // Register generation and design guidelines + schema via the core context API
    useTask$(({ track, cleanup }) => {
      track(() => ctx.coreRef.value);
      track(() => catalog?.id);
      track(() => catalog?.components?.size);
      track(() => includeSchema);

      const core = ctx.coreRef.value;
      if (!core) return;

      const ids: string[] = [];

      if (includeSchema) {
        // Schema context — send a minimal representation; full schema requires
        // @copilotkit/a2ui-renderer's extractCatalogComponentSchemas.
        const schemaValue = catalog?.components
          ? JSON.stringify({ catalogId: catalog.id ?? "", components: {} })
          : null;

        if (schemaValue) {
          ids.push(
            core.addContext({
              description: A2UI_SCHEMA_CONTEXT_DESCRIPTION,
              value: schemaValue,
            }),
          );
        }
      }

      ids.push(
        core.addContext({
          description: A2UI_DEFAULT_GENERATION_GUIDELINES,
          value:
            "Follow A2UI protocol: use createSurface, updateComponents, updateDataModel, deleteSurface operations. Paths use dot-notation. Components must specify 'component' field.",
        }),
        core.addContext({
          description: A2UI_DEFAULT_DESIGN_GUIDELINES,
          value:
            "Design guidelines: prefer Column/Row for layout, use Label/Text for display, Button for actions, Input/Select for forms. Keep hierarchy shallow.",
        }),
      );

      cleanup(() => {
        for (const id of ids) {
          core.removeContext(id);
        }
      });
    });

    return <></>;
  },
);
