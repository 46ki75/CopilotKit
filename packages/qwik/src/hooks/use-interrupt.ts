import { useContext, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import { CopilotKitContextId } from "../context/copilot-context";
import { useAgent } from "./use-agent";
import type {
  InterruptEvent,
  InterruptRenderProps,
  InterruptHandlerProps,
} from "../types/interrupt";

export type { InterruptEvent, InterruptRenderProps, InterruptHandlerProps };

const INTERRUPT_EVENT_NAME = "on_interrupt";

type InterruptHandlerFn<TValue, TResult> = (
  props: InterruptHandlerProps<TValue>,
) => TResult | PromiseLike<TResult>;

type InterruptResultFromHandler<THandler> = THandler extends (
  ...args: never[]
) => infer TResult
  ? TResult extends PromiseLike<infer TResolved>
    ? TResolved | null
    : TResult | null
  : null;

type InterruptResult<TValue, TResult> = InterruptResultFromHandler<
  InterruptHandlerFn<TValue, TResult>
>;

function isPromiseLike<TValue>(
  value: TValue | PromiseLike<TValue>,
): value is PromiseLike<TValue> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof Reflect.get(value, "then") === "function"
  );
}

/**
 * Configuration options for `useInterrupt`.
 */
export interface UseInterruptConfig<TValue = unknown, TResult = never> {
  /**
   * Callback invoked when an interrupt is finalized and accepted.
   * Use `resolve` to resume the agent run with user input.
   * Returns the interrupt props so the consumer can render UI outside
   * of the chat (since Qwik does not have a built-in chat renderer).
   */
  handler?: InterruptHandlerFn<TValue, TResult>;

  /**
   * Optional predicate to filter which interrupts should be handled
   * by this hook. Return `false` to ignore an interrupt.
   */
  enabled?: (event: InterruptEvent<TValue>) => boolean;

  /**
   * Optional agent ID. Defaults to the current configured chat agent.
   */
  agentId?: string;
}

/**
 * Return value from the useInterrupt hook.
 */
export interface UseInterruptReturn<TValue = unknown, TResult = never> {
  /**
   * Reactive signal containing the current pending interrupt event,
   * or `null` when no interrupt is pending.
   */
  pendingEvent: Signal<InterruptEvent<TValue> | null>;

  /**
   * Reactive signal containing the handler result once resolved,
   * or `null` when no handler was provided / not yet resolved.
   */
  handlerResult: Signal<InterruptResult<TValue, TResult>>;

  /**
   * Call this function to resume the agent with the given response.
   */
  resolve: (response: unknown) => void;
}

/**
 * Handles agent interrupts (`on_interrupt`) with optional filtering and
 * preprocessing. This is the Qwik equivalent of the React `useInterrupt`
 * hook from `@copilotkit/react-core`.
 *
 * The hook listens to custom events on the active agent, stores interrupt
 * payloads per run, and exposes them via signals. Call `resolve` to resume
 * the agent with user-provided data.
 *
 * Unlike the React version, the Qwik hook does not manage rendering — it
 * returns reactive signals and a `resolve` callback so you can build your
 * interrupt UI declaratively in your Qwik component.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { CopilotKit, useInterrupt } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const InterruptUI = component$(() => {
 *   const { pendingEvent, resolve } = useInterrupt();
 *
 *   return (
 *     <div>
 *       {pendingEvent.value && (
 *         <div>
 *           <p>{JSON.stringify(pendingEvent.value.value)}</p>
 *           <button onClick$={() => resolve({ approved: true })}>
 *             Approve
 *           </button>
 *           <button onClick$={() => resolve({ approved: false })}>
 *             Reject
 *           </button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * });
 * ```
 */
export function useInterrupt<TValue = unknown, TResult = never>(
  config: UseInterruptConfig<TValue, TResult> = {},
): UseInterruptReturn<TValue, TResult> {
  const ctx = useContext(CopilotKitContextId);
  const { agent } = useAgent({ agentId: config.agentId });

  const pendingEventSig = useSignal<InterruptEvent<TValue> | null>(null);
  const handlerResultSig = useSignal<InterruptResult<TValue, TResult>>(
    null as InterruptResult<TValue, TResult>,
  );

  const resolve = (response: unknown) => {
    const event = pendingEventSig.value;
    pendingEventSig.value = null;
    handlerResultSig.value = null as InterruptResult<TValue, TResult>;

    const core = ctx.coreRef.value;
    const a = agent.value;
    if (!core || !a) return;

    core.runAgent({
      agent: a,
      forwardedProps: {
        command: {
          resume: response,
          interruptEvent: event?.value,
        },
      },
    });
  };

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => agent.value);

    const a = agent.value;
    if (!a) return;

    let localInterrupt: InterruptEvent<TValue> | null = null;

    const subscription = a.subscribe({
      onCustomEvent: ({ event }) => {
        if (event.name === INTERRUPT_EVENT_NAME) {
          localInterrupt = {
            name: event.name,
            value: event.value as TValue,
          };
        }
      },
      onRunStartedEvent: () => {
        localInterrupt = null;
        pendingEventSig.value = null;
        handlerResultSig.value = null as InterruptResult<TValue, TResult>;
      },
      onRunFinalized: () => {
        if (localInterrupt) {
          // Apply filter
          if (config.enabled && !config.enabled(localInterrupt)) {
            localInterrupt = null;
            return;
          }
          pendingEventSig.value = localInterrupt;

          // Run handler if provided
          const handler = config.handler;
          if (handler) {
            const maybePromise = handler({
              event: localInterrupt,
              resolve,
            });
            if (isPromiseLike(maybePromise)) {
              Promise.resolve(maybePromise)
                .then((resolved) => {
                  handlerResultSig.value = resolved as InterruptResult<
                    TValue,
                    TResult
                  >;
                })
                .catch(() => {
                  handlerResultSig.value = null as InterruptResult<
                    TValue,
                    TResult
                  >;
                });
            } else {
              handlerResultSig.value = maybePromise as InterruptResult<
                TValue,
                TResult
              >;
            }
          }

          localInterrupt = null;
        }
      },
      onRunFailed: () => {
        localInterrupt = null;
      },
    });

    cleanup(() => {
      subscription.unsubscribe();
    });
  });

  return {
    pendingEvent: pendingEventSig,
    handlerResult: handlerResultSig,
    resolve,
  };
}
