import { component$, Slot } from "@builder.io/qwik";
import { CopilotChat } from "./CopilotChat";
import type { CopilotChatProps } from "./CopilotChat";

export type CopilotSidebarProps = CopilotChatProps & {
  headerTitle?: string;
  width?: number | string;
  defaultOpen?: boolean;
};

export const CopilotSidebar = component$<CopilotSidebarProps>((props) => {
  return (
    <CopilotChat
      agentId={props.agentId}
      threadId={props.threadId}
      labels={props.labels}
      isModalDefaultOpen={props.defaultOpen}
      attachments={props.attachments}
      onError={props.onError}
      class={props.class}
    >
      <Slot />
    </CopilotChat>
  );
});
