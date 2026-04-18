/**
 * Represents an interrupt event emitted by an agent.
 */
export interface InterruptEvent<TValue = unknown> {
  name: string;
  value: TValue;
}

/**
 * Props passed to the interrupt handler function.
 */
export interface InterruptHandlerProps<TValue = unknown> {
  event: InterruptEvent<TValue>;
  resolve: (response: unknown) => void;
}

/**
 * Props passed to the interrupt render callback.
 */
export interface InterruptRenderProps<TValue = unknown, TResult = unknown> {
  event: InterruptEvent<TValue>;
  result: TResult;
  resolve: (response: unknown) => void;
}
