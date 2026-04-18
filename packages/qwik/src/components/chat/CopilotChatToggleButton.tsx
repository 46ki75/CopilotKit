import { component$, useContext, $ } from "@builder.io/qwik";
import {
  CopilotChatConfigurationContextId,
  CopilotChatDefaultLabels,
} from "../../context/copilot-chat-configuration-context";

export interface CopilotChatToggleButtonProps {
  class?: string;
}

export const CopilotChatToggleButton = component$<CopilotChatToggleButtonProps>(
  (props) => {
    const configuration = useContext(CopilotChatConfigurationContextId, null);
    const labels = configuration?.labels ?? CopilotChatDefaultLabels;

    const isOpen = configuration?.isModalOpen.value ?? false;

    const handleClick = $(() => {
      if (configuration) {
        configuration.isModalOpen.value = !configuration.isModalOpen.value;
      }
    });

    return (
      <button
        type="button"
        data-copilotkit
        data-testid="copilot-chat-toggle"
        data-slot="chat-toggle-button"
        data-state={isOpen ? "open" : "closed"}
        class={`copilotKitButton ${props.class ?? ""}`}
        aria-label={isOpen ? labels.chatToggleCloseLabel : labels.chatToggleOpenLabel}
        aria-pressed={isOpen}
        onClick$={handleClick}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: "1100",
          display: "flex",
          height: "56px",
          width: "56px",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "1px solid #333",
          background: "#333",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        {/* Open icon */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 120ms ease-out, transform 260ms cubic-bezier(0.22,1,0.36,1)",
            opacity: isOpen ? "0" : "1",
            transform: isOpen ? "scale(0.75) rotate(90deg)" : "scale(1) rotate(0deg)",
            pointerEvents: "none",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </span>
        {/* Close icon */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 120ms ease-out, transform 260ms cubic-bezier(0.22,1,0.36,1)",
            opacity: isOpen ? "1" : "0",
            transform: isOpen ? "scale(1) rotate(0deg)" : "scale(0.75) rotate(-90deg)",
            pointerEvents: "none",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </span>
      </button>
    );
  },
);
