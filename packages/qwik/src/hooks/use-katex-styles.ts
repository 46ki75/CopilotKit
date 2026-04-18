import { useVisibleTask$ } from "@builder.io/qwik";

const KATEX_CSS_ID = "copilotkit-katex-styles";
const KATEX_CDN_URL =
  "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

/**
 * Dynamically injects KaTeX CSS at runtime via a `<link>` element.
 * Uses an id-based singleton so the stylesheet is only injected once
 * regardless of how many components call this hook.
 */
export function useKatexStyles(): void {
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (
      typeof document === "undefined" ||
      document.getElementById(KATEX_CSS_ID)
    ) {
      return;
    }

    const link = document.createElement("link");
    link.id = KATEX_CSS_ID;
    link.rel = "stylesheet";
    link.href = KATEX_CDN_URL;
    document.head.appendChild(link);

    cleanup(() => {
      // No cleanup needed — katex stylesheet stays for the lifetime of the page
    });
  });
}
