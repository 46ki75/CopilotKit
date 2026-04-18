import { useSignal, type Signal } from "@builder.io/qwik";

/**
 * Shallow equality comparison for plain objects.
 */
export function shallowEqual<T extends Record<string, unknown>>(
  obj1: T,
  obj2: T,
): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }

  return true;
}

/**
 * Returns true only for plain JS objects (`{}`), excluding arrays, Dates,
 * class instances, and other exotic objects.
 */
function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.prototype.toString.call(obj) === "[object Object]"
  );
}

/**
 * Returns the same value reference as long as the value is shallowly
 * equal to the previous render's value. Qwik equivalent of React's
 * `useShallowStableRef` from the React package.
 *
 * - Identical references bail out immediately (O(1)).
 * - Plain objects are shallow-compared key-by-key.
 * - Arrays, Dates, class instances, functions, and primitives are compared by
 *   reference only.
 *
 * @param value The current value to stabilize.
 * @returns The stabilized value (same type as input, not a Signal).
 */
export function useShallowStable<T>(value: T): T {
  const stableRef = useSignal<T>(value);

  // Identical reference — bail early.
  if (stableRef.value === value) return stableRef.value;

  // Both are plain objects — shallow-compare to detect structural equality.
  if (isPlainObject(stableRef.value) && isPlainObject(value)) {
    if (
      shallowEqual(
        stableRef.value as Record<string, unknown>,
        value as Record<string, unknown>,
      )
    ) {
      return stableRef.value;
    }
  }

  // Different values — update the stored reference.
  stableRef.value = value;
  return stableRef.value;
}
