import { component$ } from '@builder.io/qwik';
import type { QRL } from '@builder.io/qwik';
import type { Attachment } from "@copilotkit/shared";

export interface CopilotChatAttachmentQueueProps {
  attachments: Attachment[];
  onRemoveAttachment$: QRL<(id: string) => void>;
  class?: string;
}

export const CopilotChatAttachmentQueue = component$<CopilotChatAttachmentQueueProps>(
  (props) => {
    if (props.attachments.length === 0) return null;

    return (
      <div
        class={props.class ?? ""}
        style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px" }}
      >
        {props.attachments.map((attachment) => {
          const isMedia = attachment.type === "image" || attachment.type === "video";
          return (
            <div
              key={attachment.id}
              style={{
                position: "relative",
                display: "inline-flex",
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #e0e0e0",
                ...(isMedia
                  ? { width: "72px", height: "72px" }
                  : { padding: "8px 32px 8px 12px", maxWidth: "240px" }),
              }}
            >
              {attachment.status === "uploading" && (
                <div
                  style={{
                    position: "absolute",
                    inset: "0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.4)",
                    zIndex: "10",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "cpk-spin 0.6s linear infinite",
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {attachment.filename ?? attachment.type}
                </span>
              </div>
              <button
                type="button"
                onClick$={async () => {
                  await props.onRemoveAttachment$(attachment.id);
                }}
                style={{
                  position: "absolute",
                  top: isMedia ? "4px" : "6px",
                  right: isMedia ? "4px" : "6px",
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "10px",
                  zIndex: "20",
                  padding: "0",
                }}
                aria-label="Remove attachment"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  },
);
