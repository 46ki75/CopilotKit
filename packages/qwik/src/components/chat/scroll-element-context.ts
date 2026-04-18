import { createContextId } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

/**
 * Provides the scroll container element to child components.
 * Set by CopilotChatView; consumed by CopilotChatMessageView for auto-scroll.
 */
export const ScrollElementContextId = createContextId<
  Signal<HTMLElement | undefined>
>("copilotkit.scroll-element");
