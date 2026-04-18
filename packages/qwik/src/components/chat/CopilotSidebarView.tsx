import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import {
  CopilotChatConfigurationContextId,
} from "../../context/copilot-chat-configuration-context";
import { CopilotChatConfigurationProvider } from "../copilot-chat-configuration-provider";
import { CopilotChatToggleButton } from "./CopilotChatToggleButton";
import { CopilotModalHeader } from "./CopilotModalHeader";
import type { CopilotChatViewProps } from "./CopilotChatView";
import { CopilotChatView } from "./CopilotChatView";

const DEFAULT_SIDEBAR_WIDTH = 480;

export type CopilotSidebarViewProps = CopilotChatViewProps & {
  headerTitle?: string;
  width?: number | string;
  defaultOpen?: boolean;
};

export const CopilotSidebarView = component$<CopilotSidebarViewProps>((props) => {
  return (
    <CopilotChatConfigurationProvider isModalDefaultOpen={props.defaultOpen ?? true}>
      <CopilotSidebarViewInternal
        headerTitle={props.headerTitle}
        width={props.width}
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

const CopilotSidebarViewInternal = component$<Omit<CopilotSidebarViewProps, "defaultOpen">>(
  (props) => {
    const configuration = useContext(CopilotChatConfigurationContextId, null);
    const isSidebarOpen = configuration?.isModalOpen.value ?? false;

    const sidebarWidth =
      typeof props.width === "number"
        ? `${props.width}px`
        : typeof props.width === "string"
          ? props.width
          : `${DEFAULT_SIDEBAR_WIDTH}px`;

    // Manage body margin for sidebar docking
    const hasMounted = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track, cleanup }) => {
      track(() => configuration?.isModalOpen.value);

      if (typeof window === "undefined") return;

      const open = configuration?.isModalOpen.value ?? false;

      const isDesktop =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(min-width: 768px)").matches;

      if (!isDesktop) return;

      if (open) {
        if (hasMounted.value) {
          document.body.style.transition = "margin-inline-end 260ms ease";
        }
        document.body.style.marginInlineEnd = sidebarWidth;
      } else if (hasMounted.value) {
        document.body.style.transition = "margin-inline-end 260ms ease";
        document.body.style.marginInlineEnd = "";
      }

      hasMounted.value = true;

      cleanup(() => {
        document.body.style.marginInlineEnd = "";
        document.body.style.transition = "";
      });
    });

    return (
      <>
        <CopilotChatToggleButton />
        <aside
          data-copilotkit
          data-testid="copilot-sidebar"
          data-copilot-sidebar
          role="complementary"
          aria-label="Copilot chat sidebar"
          aria-hidden={!isSidebarOpen}
          style={{
            position: "fixed",
            right: "0",
            top: "0",
            zIndex: "1200",
            display: "flex",
            height: "100dvh",
            maxHeight: "100vh",
            width: sidebarWidth,
            borderLeft: "1px solid #e0e0e0",
            background: "white",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            transition: "transform 0.3s ease-out",
            transform: isSidebarOpen ? "translateX(0)" : "translateX(100%)",
            pointerEvents: isSidebarOpen ? "auto" : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "100%",
              width: "100%",
              flexDirection: "column",
              overflow: "hidden",
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
                class={props.class}
              />
            </div>
          </div>
        </aside>
      </>
    );
  },
);
