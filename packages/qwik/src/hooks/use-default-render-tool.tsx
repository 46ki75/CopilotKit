import type { JSXOutput } from "@builder.io/qwik";
import { useRenderTool } from "./use-render-tool";

type DefaultRenderProps = {
  /** The name of the tool being called. */
  name: string;
  /** The parsed parameters passed to the tool call. */
  parameters: unknown;
  /** Current execution status of the tool call. */
  status: "inProgress" | "executing" | "complete";
  /** The tool call result string, available only when `status` is `"complete"`. */
  result: string | undefined;
};

/**
 * Registers a wildcard (`"*"`) tool-call renderer via `useRenderTool`.
 *
 * This is the Qwik equivalent of `useDefaultRenderTool` from `@copilotkit/react-core`.
 *
 * - Call with no config to use a built-in default tool-call card with a
 *   native `<details>` expand/collapse for arguments and result panels.
 * - Pass `config.render` to replace the default UI with your own fallback renderer.
 */
export function useDefaultRenderTool(config?: {
  render?: (props: DefaultRenderProps) => JSXOutput;
}): void {
  useRenderTool({
    name: "*",
    render: config?.render ?? defaultToolCallRenderer,
  });
}

function defaultToolCallRenderer({
  name,
  parameters,
  status,
  result,
}: DefaultRenderProps): JSXOutput {
  const statusString = String(status) as
    | "inProgress"
    | "executing"
    | "complete";
  const isActive =
    statusString === "inProgress" || statusString === "executing";
  const isComplete = statusString === "complete";
  const statusLabel = isActive ? "Running" : isComplete ? "Done" : status;

  return (
    <div style={{ marginTop: "8px", paddingBottom: "8px" }}>
      <details
        style={{
          borderRadius: "12px",
          border: "1px solid #e4e4e7",
          backgroundColor: "#fafafa",
          padding: "14px 16px",
        }}
      >
        <summary
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            cursor: "pointer",
            listStyle: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                height: "8px",
                width: "8px",
                borderRadius: "50%",
                backgroundColor: isActive
                  ? "#f59e0b"
                  : isComplete
                    ? "#10b981"
                    : "#a1a1aa",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#18181b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: "9999px",
              padding: "2px 8px",
              fontSize: "11px",
              fontWeight: 500,
              backgroundColor: isActive
                ? "#fef3c7"
                : isComplete
                  ? "#d1fae5"
                  : "#f4f4f5",
              color: isActive ? "#92400e" : isComplete ? "#065f46" : "#3f3f46",
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </span>
        </summary>
        <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
          <div>
            <div
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#71717a",
              }}
            >
              Arguments
            </div>
            <pre
              style={{
                marginTop: "6px",
                maxHeight: "200px",
                overflow: "auto",
                borderRadius: "6px",
                backgroundColor: "#f4f4f5",
                padding: "10px",
                fontSize: "11px",
                lineHeight: 1.6,
                color: "#27272a",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(parameters ?? {}, null, 2)}
            </pre>
          </div>
          {result !== undefined && (
            <div>
              <div
                style={{
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#71717a",
                }}
              >
                Result
              </div>
              <pre
                style={{
                  marginTop: "6px",
                  maxHeight: "200px",
                  overflow: "auto",
                  borderRadius: "6px",
                  backgroundColor: "#f4f4f5",
                  padding: "10px",
                  fontSize: "11px",
                  lineHeight: 1.6,
                  color: "#27272a",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
