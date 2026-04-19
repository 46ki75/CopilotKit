import {
  useContext,
  useSignal,
  useVisibleTask$,
  noSerialize,
} from "@builder.io/qwik";
import type { NoSerialize, Signal } from "@builder.io/qwik";
import type { AbstractAgent, Message, State } from "@ag-ui/client";
import { CopilotKitContextId } from "../context/copilot-context";
import {
  getOrCreateThreadClone,
  getThreadClone,
  globalThreadCloneMap,
} from "../lib/thread-clone";

/**
 * Controls which agent state changes cause the hook to re-render.
 * This is the Qwik equivalent of the React `UseAgentUpdate` enum.
 */
export enum UseAgentUpdate {
  OnMessagesChanged = "OnMessagesChanged",
  OnStateChanged = "OnStateChanged",
  OnRunStatusChanged = "OnRunStatusChanged",
}

// Re-export for consumers who import from this module directly.
export { getThreadClone, globalThreadCloneMap } from "../lib/thread-clone";

const ALL_UPDATES: UseAgentUpdate[] = [
  UseAgentUpdate.OnMessagesChanged,
  UseAgentUpdate.OnStateChanged,
  UseAgentUpdate.OnRunStatusChanged,
];

/**
 * Options for the useAgent hook.
 */
export interface UseAgentOptions {
  /**
   * The ID of the agent to subscribe to. Defaults to "default".
   */
  agentId?: string;

  /**
   * When provided, the hook subscribes to a per-thread clone of the registry
   * agent rather than the shared registry agent. All components using the same
   * (agentId, threadId) pair receive the same clone instance.
   */
  threadId?: string;

  /**
   * Subset of agent state changes that should trigger signal updates.
   * Defaults to all updates. Pass an empty array to suppress all updates.
   */
  updates?: UseAgentUpdate[];

  /**
   * Throttle interval (ms) for `onMessagesChanged` / `onStateChanged`
   * callbacks. Falls back to the core-level default when omitted.
   */
  throttleMs?: number;
}

/**
 * Return value from the useAgent hook.
 * Each field is a Qwik Signal — read `.value` to access the current value.
 */
export interface UseAgentReturn {
  /**
   * The agent instance wrapped in a Signal. Wrapped in NoSerialize because
   * AbstractAgent is not serializable by Qwik's resumability system.
   */
  agent: Signal<NoSerialize<AbstractAgent> | undefined>;

  /**
   * Reactive signal containing the current list of messages.
   */
  messages: Signal<readonly Message[]>;

  /**
   * Reactive signal containing the current agent state.
   */
  state: Signal<Readonly<State>>;

  /**
   * Reactive signal indicating whether the agent is currently running.
   */
  isRunning: Signal<boolean>;
}

/**
 * Subscribes to a CopilotKit agent and exposes its messages, state and
 * running status as reactive Qwik signals. This is the Qwik equivalent of
 * the React `useAgent` hook from `@copilotkit/react-core`.
 *
 * The hook automatically re-renders when the agent emits new messages or
 * state changes.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, useAgent } from "@copilotkit/qwik";
 *
 * export const Chat = component$(() => {
 *   const { messages, isRunning } = useAgent();
 *
 *   return (
 *     <div>
 *       {messages.value.map((m, i) => (
 *         <p key={i}>{m.content}</p>
 *       ))}
 *       {isRunning.value && <p>Thinking…</p>}
 *     </div>
 *   );
 * });
 * ```
 */
export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const ctx = useContext(CopilotKitContextId);
  const agentSig = useSignal<NoSerialize<AbstractAgent> | undefined>(undefined);
  const messagesSig = useSignal<readonly Message[]>([]);
  const stateSig = useSignal<Readonly<State>>({});
  const isRunningSig = useSignal(false);
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);
    track(() => options.agentId);
    track(() => options.threadId);

    const core = ctx.coreRef.value;
    if (!core) return;

    const agentId = options.agentId ?? "default";
    const { threadId, throttleMs } = options;
    const updateFlags = options.updates ?? ALL_UPDATES;

    // Track the per-agent subscription separately so it can be replaced
    // when the agent becomes available after the initial runtime connection.
    let agentSubscription: { unsubscribe: () => void } | undefined;

    const setupAgent = (registryAgent: AbstractAgent) => {
      // Tear down any previous per-agent subscription first.
      agentSubscription?.unsubscribe();

      // Use per-thread clone when threadId is provided.
      const agent = threadId
        ? getOrCreateThreadClone(registryAgent, threadId, core.headers)
        : registryAgent;

      agentSig.value = noSerialize(agent);
      messagesSig.value = agent.messages ?? [];
      stateSig.value = agent.state ?? {};

      if (updateFlags.length === 0) return;

      const handlers: Parameters<typeof core.subscribeToAgentWithOptions>[1] =
        {};
      if (updateFlags.includes(UseAgentUpdate.OnMessagesChanged)) {
        handlers.onMessagesChanged = ({ messages }) => {
          messagesSig.value = [...messages];
        };
      }
      if (updateFlags.includes(UseAgentUpdate.OnStateChanged)) {
        handlers.onStateChanged = ({ state }) => {
          stateSig.value = { ...state };
        };
      }
      if (updateFlags.includes(UseAgentUpdate.OnRunStatusChanged)) {
        handlers.onRunInitialized = () => {
          isRunningSig.value = true;
        };
        handlers.onRunFinalized = () => {
          isRunningSig.value = false;
        };
        handlers.onRunFailed = () => {
          isRunningSig.value = false;
        };
        handlers.onRunErrorEvent = () => {
          isRunningSig.value = false;
        };
      }

      agentSubscription = core.subscribeToAgentWithOptions(agent, handlers, {
        throttleMs,
      });
    };

    // Try to get the agent right away (may be undefined while the runtime
    // connection is still being established).
    const existing = core.getAgent(agentId);
    if (existing) {
      setupAgent(existing);
    }

    // Subscribe to agent-list changes so that we set up the agent as soon as
    // it becomes available (e.g. after the /info handshake with the runtime).
    const coreSubscription = core.subscribe({
      onAgentsChanged: ({ agents }) => {
        const newAgent = agents[agentId];
        if (newAgent) {
          setupAgent(newAgent);
        }
      },
    });

    cleanup(() => {
      agentSubscription?.unsubscribe();
      coreSubscription.unsubscribe();
      agentSig.value = undefined;
    });
  });

  return {
    agent: agentSig,
    messages: messagesSig,
    state: stateSig,
    isRunning: isRunningSig,
  };
}
