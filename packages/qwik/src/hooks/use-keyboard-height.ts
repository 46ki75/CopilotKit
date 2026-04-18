import { useSignal, useVisibleTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";

export interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  availableHeight: number;
  viewportHeight: number;
}

/**
 * Hook to detect mobile keyboard appearance and calculate available viewport height.
 * Uses the Visual Viewport API to track keyboard state on mobile devices.
 *
 * This is the Qwik equivalent of `useKeyboardHeight` from `@copilotkit/react-core`.
 *
 * @returns A Signal containing the current KeyboardState.
 */
export function useKeyboardHeight(): Signal<KeyboardState> {
  const keyboardState = useSignal<KeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    availableHeight: 0,
    viewportHeight: 0,
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const layoutHeight = window.innerHeight;
    keyboardState.value = {
      isKeyboardOpen: false,
      keyboardHeight: 0,
      availableHeight: layoutHeight,
      viewportHeight: layoutHeight,
    };

    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      return;
    }

    const updateKeyboardState = () => {
      const currentLayoutHeight = window.innerHeight;
      const visualHeight = visualViewport.height;
      const kbHeight = Math.max(0, currentLayoutHeight - visualHeight);
      const isOpen = kbHeight > 150;

      keyboardState.value = {
        isKeyboardOpen: isOpen,
        keyboardHeight: kbHeight,
        availableHeight: visualHeight,
        viewportHeight: currentLayoutHeight,
      };
    };

    updateKeyboardState();

    visualViewport.addEventListener("resize", updateKeyboardState);
    visualViewport.addEventListener("scroll", updateKeyboardState);

    cleanup(() => {
      visualViewport.removeEventListener("resize", updateKeyboardState);
      visualViewport.removeEventListener("scroll", updateKeyboardState);
    });
  });

  return keyboardState;
}
