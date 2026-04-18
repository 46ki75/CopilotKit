import { useVisibleTask$ } from "@builder.io/qwik";

let injected = false;

/**
 * Dynamically injects KaTeX CSS at runtime.
 * Uses a singleton flag so the stylesheet is only injected once.
 */
export function useKatexStyles(): void {
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (injected || typeof document === "undefined") return;
    injected = true;

    void import("katex/dist/katex.min.css" as any).catch(() => {
      console.warn(
        "[CopilotKit] Failed to load katex styles — math content may render without formatting",
      );
    });

    cleanup(() => {
      // No cleanup needed — katex stylesheet stays for the lifetime of the page
    });
  });
}
