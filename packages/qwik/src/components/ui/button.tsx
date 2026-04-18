import { component$, Slot } from "@builder.io/qwik";
import type { QRL } from "@builder.io/qwik";

/**
 * Button variant values (mirrors the shadcn/CVA buttonVariants).
 */
export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "assistantMessageToolbarButton"
  | "chatInputToolbarPrimary"
  | "chatInputToolbarSecondary";

export type ButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "icon"
  | "chatInputToolbarIcon"
  | "chatInputToolbarIconLabel";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  disabled?: boolean;
  class?: string;
  type?: "button" | "submit" | "reset";
  onClick$?: QRL<() => void>;
  "data-slot"?: string;
  [key: string]: unknown;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default:
    "cpk:bg-primary cpk:text-primary-foreground cpk:shadow-xs cpk:hover:bg-primary/90",
  destructive:
    "cpk:bg-destructive cpk:text-white cpk:shadow-xs cpk:hover:bg-destructive/90 cpk:focus-visible:ring-destructive/20 cpk:dark:focus-visible:ring-destructive/40 cpk:dark:bg-destructive/60",
  outline:
    "cpk:border cpk:bg-background cpk:shadow-xs cpk:hover:bg-accent cpk:hover:text-accent-foreground cpk:dark:bg-input/30 cpk:dark:border-input cpk:dark:hover:bg-input/50",
  secondary:
    "cpk:bg-secondary cpk:text-secondary-foreground cpk:shadow-xs cpk:hover:bg-secondary/80",
  ghost:
    "cpk:hover:bg-accent cpk:hover:text-accent-foreground cpk:dark:hover:bg-accent/50 cpk:cursor-pointer",
  link: "cpk:text-primary cpk:underline-offset-4 cpk:hover:underline",
  assistantMessageToolbarButton:
    "cpk:cursor-pointer cpk:p-0 cpk:text-[rgb(93,93,93)] cpk:hover:bg-[#E8E8E8] cpk:dark:text-[rgb(243,243,243)] cpk:dark:hover:bg-[#303030] cpk:h-8 cpk:w-8 cpk:transition-colors cpk:hover:text-[rgb(93,93,93)] cpk:dark:hover:text-[rgb(243,243,243)]",
  chatInputToolbarPrimary:
    "cpk:cursor-pointer cpk:bg-black cpk:text-white cpk:dark:bg-white cpk:dark:text-black cpk:dark:focus-visible:outline-white cpk:rounded-full cpk:transition-colors cpk:focus:outline-none cpk:hover:opacity-70 cpk:disabled:hover:opacity-100 cpk:disabled:cursor-not-allowed cpk:disabled:bg-[#00000014] cpk:disabled:text-[rgb(13,13,13)] cpk:dark:disabled:bg-[#454545] cpk:dark:disabled:text-white",
  chatInputToolbarSecondary:
    "cpk:cursor-pointer cpk:bg-transparent cpk:text-[#444444] cpk:dark:text-white cpk:dark:border-[#404040] cpk:rounded-full cpk:transition-colors cpk:focus:outline-none cpk:hover:bg-[#f8f8f8] cpk:hover:text-[#333333] cpk:dark:hover:bg-[#404040] cpk:dark:hover:text-[#FFFFFF] cpk:disabled:cursor-not-allowed cpk:disabled:opacity-50 cpk:disabled:hover:bg-transparent cpk:disabled:hover:text-[#444444] cpk:dark:disabled:hover:bg-transparent cpk:dark:disabled:hover:text-[#CCCCCC]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: "cpk:h-9 cpk:px-4 cpk:py-2",
  sm: "cpk:h-8 cpk:rounded-md cpk:gap-1.5 cpk:px-3",
  lg: "cpk:h-10 cpk:rounded-md cpk:px-6",
  icon: "cpk:size-9",
  chatInputToolbarIcon: "cpk:h-9 cpk:w-9 cpk:rounded-full",
  chatInputToolbarIconLabel:
    "cpk:h-9 cpk:px-3 cpk:rounded-full cpk:gap-2 cpk:font-normal",
};

const BASE_CLASSES =
  "cpk:inline-flex cpk:items-center cpk:justify-center cpk:gap-2 cpk:whitespace-nowrap cpk:rounded-md cpk:text-sm cpk:font-medium cpk:transition-all cpk:disabled:pointer-events-none cpk:disabled:opacity-50 cpk:outline-none";

export const Button = component$<ButtonProps>(
  ({
    variant = "default",
    size = "default",
    class: cls,
    disabled,
    type = "button",
    onClick$,
    ...rest
  }) => {
    const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.default;
    const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.default;
    const classes = [BASE_CLASSES, variantClass, sizeClass, cls]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        data-slot="button"
        class={classes}
        disabled={disabled}
        type={type}
        onClick$={onClick$}
        {...(rest as any)}
      >
        <Slot />
      </button>
    );
  },
);
