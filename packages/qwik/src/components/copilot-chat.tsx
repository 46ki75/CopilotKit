import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
  $,
  noSerialize,
} from "@builder.io/qwik";
import type { NoSerialize } from "@builder.io/qwik";
import type { AbstractAgent } from "@ag-ui/client";
import { randomUUID, DEFAULT_AGENT_ID } from "@copilotkit/shared";
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

/** Extract a plain-text string from an AG-UI message content field. */
function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p): p is { type: string; text: string } => p?.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
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
  const agentSig = useSignal<NoSerialize<AbstractAgent> | undefined>(undefined);
  // Set of agent message IDs already shown in the UI — initialized lazily on
  // the client inside useVisibleTask$ so Qwik's SSR serializer never touches it.
  const shownMessageIds = useSignal<NoSerialize<Set<string>> | undefined>(
    undefined,
  );
  const messages = useSignal<ChatMessage[]>(props.initialMessages ?? []);
  const input = useSignal("");
  const isLoading = useSignal(false);

  // Add system instructions to context whenever the prop changes.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => props.instructions);

    const core = ctx.coreRef.value;
    if (!core) return;

    if (props.instructions) {
      core.addContext({
        description: "System instructions",
        value: props.instructions,
      });
    }
  });

  // Resolve the agent, subscribe to its messages, and connect (replay history).
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value;
    if (!core) return;

    // Lazily create the Set on the client (so Qwik's SSR serializer never sees it).
    if (!shownMessageIds.value) {
      shownMessageIds.value = noSerialize(new Set<string>());
    }

    let detached = false;
    let agentSubscription: { unsubscribe: () => void } | undefined;

    const setupAgent = (agent: AbstractAgent) => {
      // Tear down any previous per-agent subscription first.
      agentSubscription?.unsubscribe();

      agentSig.value = noSerialize(agent);

      const shownIds = shownMessageIds.value!;

      // Sync any messages the agent already has (e.g. from a previous session).
      for (const msg of agent.messages) {
        if (msg.role === "user" || msg.role === "assistant") {
          if (!shownIds.has(msg.id)) {
            shownIds.add(msg.id);
            messages.value = [
              ...messages.value,
              {
                role: msg.role as "user" | "assistant",
                content: contentToText(msg.content),
              },
            ];
          }
        }
      }

      agentSubscription = core.subscribeToAgentWithOptions(agent, {
        onMessagesChanged: ({ messages: agentMessages }) => {
          // Append only new assistant messages that we haven't shown yet.
          const newEntries: ChatMessage[] = [];
          for (const msg of agentMessages) {
            if (
              (msg.role === "assistant" || msg.role === "user") &&
              !shownIds.has(msg.id)
            ) {
              shownIds.add(msg.id);
              newEntries.push({
                role: msg.role as "user" | "assistant",
                content: contentToText(msg.content),
              });
            }
          }
          if (newEntries.length > 0) {
            messages.value = [...messages.value, ...newEntries];
          }
        },
        onRunInitialized: () => {
          isLoading.value = true;
        },
        onRunFinalized: () => {
          isLoading.value = false;
        },
        onRunFailed: () => {
          isLoading.value = false;
        },
        onRunErrorEvent: () => {
          isLoading.value = false;
        },
      });

      const connectAgent = async () => {
        try {
          await core.connectAgent({ agent });
        } catch (error) {
          if (!detached) {
            console.error("CopilotChat: connectAgent failed", error);
          }
        }
      };
      connectAgent();
    };

    // Prefer the "default" agent; fall back to the first registered agent.
    // Object.values() order is defined for string keys in ES2015+ (insertion order),
    // which is the minimum target of this package.
    const initialAgent =
      core.getAgent(DEFAULT_AGENT_ID) ??
      (Object.values(core.agents)[0] as AbstractAgent | undefined);
    if (initialAgent) {
      setupAgent(initialAgent);
    }

    // Subscribe to agent-list changes so we set up the agent as soon as it
    // becomes available (e.g. after the /info handshake with the runtime).
    const coreSubscription = core.subscribe({
      onAgentsChanged: ({ agents }) => {
        const newAgent =
          agents[DEFAULT_AGENT_ID] ??
          (Object.values(agents)[0] as AbstractAgent | undefined);
        if (newAgent) {
          setupAgent(newAgent);
        }
      },
    });

    cleanup(() => {
      detached = true;
      agentSubscription?.unsubscribe();
      coreSubscription.unsubscribe();
      const currentAgent = agentSig.value;
      agentSig.value = undefined;
      if (currentAgent) {
        void (currentAgent as AbstractAgent).detachActiveRun().catch(() => {});
      }
    });
  });

  const handleSubmit = $(async () => {
    const userMessage = input.value.trim();
    if (!userMessage || isLoading.value) return;

    const core = ctx.coreRef.value;
    const agent = agentSig.value;
    if (!core || !agent) return;

    const messageId = randomUUID();

    // Add message to agent so the backend receives it.
    agent.addMessage({
      id: messageId,
      role: "user",
      content: userMessage,
    });

    // Eagerly show the user message in the UI (subscription may lag slightly).
    shownMessageIds.value?.add(messageId);
    messages.value = [
      ...messages.value,
      { role: "user" as const, content: userMessage },
    ];
    input.value = "";

    try {
      await core.runAgent({ agent });
    } catch (error) {
      console.error("CopilotChat: runAgent failed", error);
    }
  });

  return (
    <div
      data-copilotkit
      data-testid="copilot-chat"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          flex: "1",
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.value.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#999",
                textTransform: "capitalize",
              }}
            >
              {msg.role === "user" ? "You" : "Assistant"}
            </span>
            <p
              style={{
                margin: "0",
                padding: "8px 12px",
                borderRadius: "12px",
                maxWidth: "80%",
                background: msg.role === "user" ? "#333" : "#f0f0f0",
                color: msg.role === "user" ? "white" : "#333",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {msg.content}
            </p>
          </div>
        ))}
        {isLoading.value && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: "11px", color: "#999" }}>Assistant</span>
            <p
              style={{
                margin: "0",
                padding: "8px 12px",
                borderRadius: "12px",
                background: "#f0f0f0",
                color: "#999",
                fontSize: "14px",
                fontStyle: "italic",
              }}
            >
              Thinking...
            </p>
          </div>
        )}
      </div>
      <form
        preventdefault:submit
        onSubmit$={handleSubmit}
        style={{
          display: "flex",
          gap: "8px",
          padding: "8px 12px",
          borderTop: "1px solid #e0e0e0",
          background: "white",
        }}
      >
        <input
          type="text"
          placeholder={props.placeholder ?? "Type a message..."}
          value={input.value}
          onInput$={$((e) => {
            input.value = (e.target as HTMLInputElement).value;
          })}
          style={{
            flex: "1",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            padding: "8px 12px",
            fontSize: "14px",
            lineHeight: "1.5",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          disabled={isLoading.value || !input.value.trim()}
          style={{
            background:
              isLoading.value || !input.value.trim() ? "#ccc" : "#333",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor:
              isLoading.value || !input.value.trim()
                ? "not-allowed"
                : "pointer",
            flexShrink: "0",
          }}
        >
          {props.submitLabel ?? "↑"}
        </button>
      </form>
    </div>
  );
});
