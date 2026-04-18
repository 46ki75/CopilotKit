import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";

/**
 * Props for the CopilotChat component.
 */
export interface CopilotChatProps {
  /**
   * Instructions for the Copilot to follow.
   */
  instructions?: string;

  /**
   * Placeholder text for the chat input.
   */
  placeholder?: string;

  /**
   * Label text for the submit button.
   */
  submitLabel?: string;

  /**
   * Initial messages to display in the chat.
   */
  initialMessages?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * A basic chat UI component for interacting with the CopilotKit AI. This is
 * the Qwik equivalent of the React `CopilotChat` component.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, CopilotChat } from "@copilotkit/qwik";
 *
 * export default component$(() => {
 *   return (
 *     <CopilotKit runtimeUrl="/api/copilotkit">
 *       <CopilotChat
 *         instructions="You are a helpful assistant."
 *         placeholder="Type a message..."
 *       />
 *     </CopilotKit>
 *   );
 * });
 * ```
 */
export const CopilotChat = component$<CopilotChatProps>((props) => {
  const ctx = useContext(CopilotKitContextId);
  const messages = useSignal<ChatMessage[]>(props.initialMessages ?? []);
  const input = useSignal("");
  const isLoading = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.instructions);

    if (props.instructions) {
      ctx.core.addContext({
        description: "System instructions",
        value: props.instructions,
      });
    }
  });

  const handleSubmit = $(async () => {
    const userMessage = input.value.trim();
    if (!userMessage || isLoading.value) return;

    messages.value = [
      ...messages.value,
      { role: "user" as const, content: userMessage },
    ];
    input.value = "";
    isLoading.value = true;

    try {
      // Use the core agent system to process the message
      const agents = ctx.core.agents;
      const agentIds = Object.keys(agents);
      const firstAgentId = agentIds[0];

      if (firstAgentId !== undefined) {
        const agent = agents[firstAgentId];
        if (agent) {
          await ctx.core.runAgent({ agent });
        }
      }
    } finally {
      isLoading.value = false;
    }
  });

  return (
    <div class="copilotkit-chat-container">
      <div class="copilotkit-chat-messages">
        {messages.value.map((msg, i) => (
          <div
            key={i}
            class={`copilotkit-chat-message copilotkit-chat-message-${msg.role}`}
          >
            <span class="copilotkit-chat-role">
              {msg.role === "user" ? "You" : "Assistant"}
            </span>
            <p class="copilotkit-chat-content">{msg.content}</p>
          </div>
        ))}
        {isLoading.value && (
          <div class="copilotkit-chat-message copilotkit-chat-message-assistant">
            <span class="copilotkit-chat-role">Assistant</span>
            <p class="copilotkit-chat-content copilotkit-chat-loading">
              Thinking...
            </p>
          </div>
        )}
      </div>
      <form
        class="copilotkit-chat-input-container"
        preventdefault:submit
        onSubmit$={handleSubmit}
      >
        <input
          type="text"
          class="copilotkit-chat-input"
          placeholder={props.placeholder ?? "Type a message..."}
          bind:value={input}
        />
        <button
          type="submit"
          class="copilotkit-chat-submit"
          disabled={isLoading.value}
        >
          {props.submitLabel ?? "Send"}
        </button>
      </form>
    </div>
  );
});
