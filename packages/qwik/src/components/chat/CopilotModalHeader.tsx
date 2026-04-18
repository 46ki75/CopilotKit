import { component$, useContext, $ } from "@builder.io/qwik";
import {
  CopilotChatConfigurationContextId,
  CopilotChatDefaultLabels,
} from "../../context/copilot-chat-configuration-context";

export interface CopilotModalHeaderProps {
  title?: string;
  class?: string;
}

export const CopilotModalHeader = component$<CopilotModalHeaderProps>((props) => {
  const configuration = useContext(CopilotChatConfigurationContextId, null);
  const labels = configuration?.labels ?? CopilotChatDefaultLabels;
  const resolvedTitle = props.title ?? labels.modalHeaderTitle;

  const handleClose = $(() => {
    if (configuration) {
      configuration.isModalOpen.value = false;
    }
  });

  return (
    <header
      data-testid="copilot-modal-header"
      class={`copilotKitHeader ${props.class ?? ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e0e0e0",
        padding: "16px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "8px" }}>
        <div style={{ flex: "1" }} aria-hidden="true" />
        <div
          style={{
            flex: "1",
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            data-testid="copilot-header-title"
            style={{
              fontSize: "16px",
              fontWeight: "500",
              lineHeight: "1",
              letterSpacing: "-0.01em",
            }}
          >
            {resolvedTitle}
          </div>
        </div>
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            data-testid="copilot-close-button"
            onClick$={handleClose}
            aria-label="Close"
            style={{
              display: "inline-flex",
              width: "32px",
              height: "32px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              color: "#666",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
});
