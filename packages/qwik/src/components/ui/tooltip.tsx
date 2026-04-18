import { component$, Slot, useSignal, $ } from "@builder.io/qwik";

/**
 * Simple CSS-based tooltip provider (no-op wrapper for API parity with shadcn tooltip).
 */
export const TooltipProvider = component$(() => {
  return <Slot />;
});

/**
 * Tooltip root — wraps a trigger and its content.
 */
export const Tooltip = component$(() => {
  return (
    <TooltipProvider>
      <Slot />
    </TooltipProvider>
  );
});

/**
 * The element that triggers the tooltip on hover/focus.
 */
export const TooltipTrigger = component$(() => {
  return <Slot />;
});

interface TooltipContentProps {
  sideOffset?: number;
  class?: string;
}

/**
 * The tooltip content bubble. Uses CSS to show/hide on parent hover.
 * This is a simplified implementation without Radix UI portal/positioning.
 */
export const TooltipContent = component$<TooltipContentProps>(({ class: cls }) => {
  const visible = useSignal(false);

  const show = $(() => {
    visible.value = true;
  });
  const hide = $(() => {
    visible.value = false;
  });

  return (
    <span
      onMouseEnter$={show}
      onMouseLeave$={hide}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <Slot />
      {visible.value && (
        <span
          class={cls}
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--cpk-primary, #09090b)",
            color: "var(--cpk-primary-foreground, #fafafa)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          <Slot name="content" />
        </span>
      )}
    </span>
  );
});

export { Tooltip as TooltipRoot };
