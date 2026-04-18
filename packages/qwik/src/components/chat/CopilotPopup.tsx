import { component$, Slot } from "@builder.io/qwik";
import { CopilotChat } from './CopilotChat';
import type { CopilotChatProps } from './CopilotChat';

export type CopilotPopupProps = CopilotChatProps & {
  headerTitle?: string;
  width?: number | string;
  height?: number | string;
  defaultOpen?: boolean;
  clickOutsideToClose?: boolean;
};

export const CopilotPopup = component$<CopilotPopupProps>((props) => {
  // CopilotPopup uses the same CopilotChat but renders inside
  // a CopilotPopupView. For the Qwik port, we keep this simple
  // and just wrap CopilotChat. The popup layout is handled by
  // wrapping with CopilotPopupView separately.
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
