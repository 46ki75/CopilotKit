import { defineToolCallRenderer } from "../types/define-tool-call-renderer";

export const WildcardToolCallRender = defineToolCallRenderer({
  name: "*",
  render: ({ args, result, name, status }) => {
    const statusString = String(status) as
      | "inProgress"
      | "executing"
      | "complete";
    const isActive =
      statusString === "inProgress" || statusString === "executing";
    const isComplete = statusString === "complete";

    return (
      <div style={{ marginTop: "8px", paddingBottom: "8px" }}>
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(0,0,0,0.1)",
            background: "rgba(255,255,255,0.7)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                minWidth: "0",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  height: "8px",
                  width: "8px",
                  borderRadius: "50%",
                  background: "#3b82f6",
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "14px",
                  fontWeight: "500",
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
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: "500",
                background: isActive
                  ? "#fef3c7"
                  : isComplete
                    ? "#d1fae5"
                    : "#f3f4f6",
                color: isActive
                  ? "#92400e"
                  : isComplete
                    ? "#065f46"
                    : "#374151",
              }}
            >
              {String(status)}
            </span>
          </div>

          <div
            style={{
              marginTop: "12px",
              display: "grid",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6b7280",
                }}
              >
                Arguments
              </div>
              <pre
                style={{
                  marginTop: "8px",
                  maxHeight: "256px",
                  overflow: "auto",
                  borderRadius: "6px",
                  background: "#f9fafb",
                  padding: "12px",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(args ?? {}, null, 2)}
              </pre>
            </div>

            {result !== undefined && (
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#6b7280",
                  }}
                >
                  Result
                </div>
                <pre
                  style={{
                    marginTop: "8px",
                    maxHeight: "256px",
                    overflow: "auto",
                    borderRadius: "6px",
                    background: "#f9fafb",
                    padding: "12px",
                    fontSize: "12px",
                    lineHeight: "1.6",
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
        </div>
      </div>
    );
  },
});
