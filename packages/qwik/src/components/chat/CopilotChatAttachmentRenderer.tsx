import { component$, useSignal } from "@builder.io/qwik";
import type { InputContentSource } from "@copilotkit/shared";
import { getSourceUrl, getDocumentIcon } from "@copilotkit/shared";

export interface CopilotChatAttachmentRendererProps {
  type: "image" | "audio" | "video" | "document";
  source: InputContentSource;
  filename?: string;
  class?: string;
}

export const CopilotChatAttachmentRenderer = component$<CopilotChatAttachmentRendererProps>(
  (props) => {
    const src = getSourceUrl(props.source);
    const imageError = useSignal(false);

    switch (props.type) {
      case "image":
        if (imageError.value) {
          return (
            <div
              class={props.class ?? ""}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                background: "#f5f5f5",
                padding: "16px",
                fontSize: "14px",
                color: "#999",
              }}
            >
              <span>Failed to load image</span>
            </div>
          );
        }
        return (
          <img
            src={src}
            alt="Image attachment"
            class={props.class ?? ""}
            style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
            onError$={() => {
              imageError.value = true;
            }}
          />
        );

      case "audio":
        return (
          <div class={props.class ?? ""} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <audio src={src} controls preload="metadata" style={{ maxWidth: "300px", width: "100%", height: "40px" }} />
            {props.filename && (
              <span style={{ fontSize: "12px", color: "#999", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "300px" }}>
                {props.filename}
              </span>
            )}
          </div>
        );

      case "video":
        return (
          <video
            src={src}
            controls
            preload="metadata"
            class={props.class ?? ""}
            style={{ maxWidth: "400px", width: "100%", borderRadius: "8px" }}
          />
        );

      case "document":
        return (
          <div
            class={props.class ?? ""}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              background: "#f5f5f5",
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
              {getDocumentIcon(props.source.mimeType ?? "")}
            </span>
            <span style={{ fontSize: "14px", color: "#999", overflow: "hidden", textOverflow: "ellipsis" }}>
              {props.filename || props.source.mimeType || "Unknown type"}
            </span>
          </div>
        );
    }
  },
);
