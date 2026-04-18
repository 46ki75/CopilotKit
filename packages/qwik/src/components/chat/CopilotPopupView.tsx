import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
  Slot,
} from "@builder.io/qwik";
import {
  CopilotChatConfigurationContextId,
  CopilotChatDefaultLabels,
} from "../../context/copilot-chat-configuration-context";
import { CopilotChatConfigurationProvider } from "../copilot-chat-configuration-provider";
import { CopilotChatToggleButton } from "./CopilotChatToggleButton";
import { CopilotModalHeader } from "./CopilotModalHeader";
import type { CopilotChatViewProps } from "./CopilotChatView";
import { CopilotChatView } from "./CopilotChatView";

const DEFAULT_POPUP_WIDTH = 420;
const DEFAULT_POPUP_HEIGHT = 560;

export type CopilotPopupViewProps = CopilotChatViewProps & {
  headerTitle?: string;
  width?: number | string;
  height?: number | string;
  clickOutsideToClose?: boolean;
  defaultOpen?: boolean;
};

function dimensionToCss(
  value: number | string | undefined,
  fallback: number,
): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}px`;
  if (typeof value === "string" && value.trim().length > 0) return value;
  return `${fallback}px`;
}

export const CopilotPopupView = component$<CopilotPopupViewProps>((props) => {
  return (
    <CopilotChatConfigurationProvider isModalDefaultOpen={props.defaultOpen ?? true}>
      <CopilotPopupViewInternal
        headerTitle={props.headerTitle}
        width={props.width}
        height={props.height}
        clickOutsideToClose={props.clickOutsideToClose}
        messages={props.messages}
        isRunning={props.isRunning}
        suggestions={props.suggestions}
        onSelectSuggestion$={props.onSelectSuggestion$}
        onSubmitMessage$={props.onSubmitMessage$}
        onStop$={props.onStop$}
        inputValue={props.inputValue}
        onInputChange$={props.onInputChange$}
        attachments={props.attachments}
        onRemoveAttachment$={props.onRemoveAttachment$}
        onAddFile$={props.onAddFile$}
        dragOver={props.dragOver}
        onDragOver$={props.onDragOver$}
        onDragLeave$={props.onDragLeave$}
        onDrop$={props.onDrop$}
        class={props.class}
      />
    </CopilotChatConfigurationProvider>
  );
});

const CopilotPopupViewInternal = component$<Omit<CopilotPopupViewProps, "defaultOpen">>(
  (props) => {
    const configuration = useContext(CopilotChatConfigurationContextId, null);
    const isPopupOpen = configuration?.isModalOpen.value ?? false;
    const labels = configuration?.labels ?? CopilotChatDefaultLabels;
    const isRendered = useSignal(isPopupOpen);
    const isAnimatingOut = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => configuration?.isModalOpen.value);

      const open = configuration?.isModalOpen.value ?? false;
      if (open) {
        isRendered.value = true;
        isAnimatingOut.value = false;
      } else if (isRendered.value) {
        isAnimatingOut.value = true;
        setTimeout(() => {
          isRendered.value = false;
          isAnimatingOut.value = false;
        }, 200);
      }
    });

    // Escape key handler
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => configuration?.isModalOpen.value);

      const open = configuration?.isModalOpen.value ?? false;
      if (!open) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (configuration) {
            configuration.isModalOpen.value = false;
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      cleanup(() => window.removeEventListener("keydown", handleKeyDown));
    });

    // Click outside
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => configuration?.isModalOpen.value);

      const open = configuration?.isModalOpen.value ?? false;
      if (!open || !props.clickOutsideToClose) return;

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node | null;
        if (!target) return;

        const popup = document.querySelector("[data-copilot-popup]");
        if (popup?.contains(target)) return;

        const toggleButton = document.querySelector("[data-slot='chat-toggle-button']");
        if (toggleButton?.contains(target)) return;

        if (configuration) {
          configuration.isModalOpen.value = false;
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);
      cleanup(() => document.removeEventListener("pointerdown", handlePointerDown));
    });

    const resolvedWidth = dimensionToCss(props.width, DEFAULT_POPUP_WIDTH);
    const resolvedHeight = dimensionToCss(props.height, DEFAULT_POPUP_HEIGHT);

    const popupVisible = isPopupOpen && !isAnimatingOut.value;

    return (
      <>
        <CopilotChatToggleButton />
        {isRendered.value && (
          <div
            data-copilotkit
            style={{
              position: "fixed",
              bottom: "96px",
              right: "24px",
              zIndex: "1200",
            }}
          >
            <div
              data-copilot-popup
              data-testid="copilot-popup"
              role="dialog"
              aria-label={labels.modalHeaderTitle}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e0e0e0",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                width: resolvedWidth,
                height: resolvedHeight,
                maxWidth: "calc(100vw - 3rem)",
                maxHeight: "calc(100dvh - 7.5rem)",
                transformOrigin: "bottom right",
                transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
                opacity: popupVisible ? "1" : "0",
                transform: popupVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
                pointerEvents: popupVisible ? "auto" : "none",
              }}
            >
              <CopilotModalHeader title={props.headerTitle} />
              <div style={{ flex: "1", overflow: "hidden" }}>
                <CopilotChatView
                  messages={props.messages}
                  isRunning={props.isRunning}
                  suggestions={props.suggestions}
                  onSelectSuggestion$={props.onSelectSuggestion$}
                  onSubmitMessage$={props.onSubmitMessage$}
                  onStop$={props.onStop$}
                  inputValue={props.inputValue}
                  onInputChange$={props.onInputChange$}
                  attachments={props.attachments}
                  onRemoveAttachment$={props.onRemoveAttachment$}
                  onAddFile$={props.onAddFile$}
                  dragOver={props.dragOver}
                  onDragOver$={props.onDragOver$}
                  onDragLeave$={props.onDragLeave$}
                  onDrop$={props.onDrop$}
                  class="cpk-popup-chat"
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);
