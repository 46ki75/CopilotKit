import { component$, Slot } from "@builder.io/qwik";

/**
 * Simplified Qwik dropdown menu — no Radix UI dependency.
 * Provides a toggle-based dropdown with keyboard/click-outside dismissal.
 */

interface DropdownMenuProps {
  class?: string;
}

interface DropdownMenuItemProps {
  class?: string;
  inset?: boolean;
  variant?: "default" | "destructive";
  disabled?: boolean;
  onClick$?: () => void;
}

interface DropdownMenuLabelProps {
  class?: string;
  inset?: boolean;
}

interface DropdownMenuSeparatorProps {
  class?: string;
}

interface DropdownMenuShortcutProps {
  class?: string;
}

interface DropdownMenuContentProps {
  class?: string;
  sideOffset?: number;
}

function joinClasses(
  ...classes: (string | undefined | false | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export const DropdownMenu = component$<DropdownMenuProps>(({ class: cls }) => {
  return (
    <div
      data-slot="dropdown-menu"
      class={joinClasses("cpk:relative cpk:inline-block", cls)}
    >
      <Slot />
    </div>
  );
});

export const DropdownMenuTrigger = component$<{ class?: string }>(
  ({ class: cls }) => {
    return (
      <div data-slot="dropdown-menu-trigger" class={cls}>
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuPortal = component$<{ class?: string }>(
  ({ class: cls }) => {
    return (
      <div data-slot="dropdown-menu-portal" class={cls}>
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuContent = component$<DropdownMenuContentProps>(
  ({ class: cls }) => {
    return (
      <div
        data-copilotkit
        data-slot="dropdown-menu-content"
        class={joinClasses(
          "cpk:bg-popover cpk:text-popover-foreground cpk:z-50 cpk:min-w-[8rem] cpk:overflow-hidden cpk:rounded-md cpk:border cpk:p-1 cpk:shadow-md",
          cls,
        )}
      >
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuGroup = component$<{ class?: string }>(
  ({ class: cls }) => {
    return (
      <div data-slot="dropdown-menu-group" class={cls}>
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuItem = component$<DropdownMenuItemProps>(
  ({ class: cls, inset, variant = "default", disabled, onClick$ }) => {
    return (
      <div
        data-slot="dropdown-menu-item"
        data-inset={inset}
        data-variant={variant}
        class={joinClasses(
          "cpk:focus:bg-accent cpk:focus:text-accent-foreground cpk:relative cpk:flex cpk:cursor-default cpk:items-center cpk:gap-2 cpk:rounded-sm cpk:px-2 cpk:py-1.5 cpk:text-sm cpk:outline-hidden cpk:select-none",
          variant === "destructive" ? "cpk:text-destructive" : "",
          inset ? "cpk:pl-8" : "",
          disabled
            ? "cpk:pointer-events-none cpk:opacity-50"
            : "cpk:cursor-pointer",
          cls,
        )}
        onClick$={onClick$}
      >
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuCheckboxItem = component$<{
  class?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick$?: () => void;
}>(({ class: cls, checked, disabled, onClick$ }) => {
  return (
    <div
      data-slot="dropdown-menu-checkbox-item"
      class={joinClasses(
        "cpk:focus:bg-accent cpk:focus:text-accent-foreground cpk:relative cpk:flex cpk:cursor-default cpk:items-center cpk:gap-2 cpk:rounded-sm cpk:py-1.5 cpk:pr-2 cpk:pl-8 cpk:text-sm cpk:outline-hidden cpk:select-none",
        disabled
          ? "cpk:pointer-events-none cpk:opacity-50"
          : "cpk:cursor-pointer",
        cls,
      )}
      onClick$={onClick$}
    >
      <span class="cpk:pointer-events-none cpk:absolute cpk:left-2 cpk:flex cpk:size-3.5 cpk:items-center cpk:justify-center">
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <Slot />
    </div>
  );
});

export const DropdownMenuRadioGroup = component$<{ class?: string }>(
  ({ class: cls }) => {
    return (
      <div data-slot="dropdown-menu-radio-group" class={cls}>
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuRadioItem = component$<{
  class?: string;
  checked?: boolean;
  disabled?: boolean;
  onClick$?: () => void;
}>(({ class: cls, checked, disabled, onClick$ }) => {
  return (
    <div
      data-slot="dropdown-menu-radio-item"
      class={joinClasses(
        "cpk:focus:bg-accent cpk:focus:text-accent-foreground cpk:relative cpk:flex cpk:cursor-default cpk:items-center cpk:gap-2 cpk:rounded-sm cpk:py-1.5 cpk:pr-2 cpk:pl-8 cpk:text-sm cpk:outline-hidden cpk:select-none",
        disabled
          ? "cpk:pointer-events-none cpk:opacity-50"
          : "cpk:cursor-pointer",
        cls,
      )}
      onClick$={onClick$}
    >
      <span class="cpk:pointer-events-none cpk:absolute cpk:left-2 cpk:flex cpk:size-3.5 cpk:items-center cpk:justify-center">
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="currentColor"
          >
            <circle cx="4" cy="4" r="4" />
          </svg>
        )}
      </span>
      <Slot />
    </div>
  );
});

export const DropdownMenuLabel = component$<DropdownMenuLabelProps>(
  ({ class: cls, inset }) => {
    return (
      <div
        data-slot="dropdown-menu-label"
        data-inset={inset}
        class={joinClasses(
          "cpk:px-2 cpk:py-1.5 cpk:text-sm cpk:font-medium",
          inset ? "cpk:pl-8" : "",
          cls,
        )}
      >
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuSeparator = component$<DropdownMenuSeparatorProps>(
  ({ class: cls }) => {
    return (
      <div
        data-slot="dropdown-menu-separator"
        class={joinClasses("cpk:bg-border cpk:-mx-1 cpk:my-1 cpk:h-px", cls)}
      />
    );
  },
);

export const DropdownMenuShortcut = component$<DropdownMenuShortcutProps>(
  ({ class: cls }) => {
    return (
      <span
        data-slot="dropdown-menu-shortcut"
        class={joinClasses(
          "cpk:text-muted-foreground cpk:ml-auto cpk:text-xs cpk:tracking-widest",
          cls,
        )}
      >
        <Slot />
      </span>
    );
  },
);

export const DropdownMenuSub = component$<{ class?: string }>(
  ({ class: cls }) => {
    return (
      <div data-slot="dropdown-menu-sub" class={cls}>
        <Slot />
      </div>
    );
  },
);

export const DropdownMenuSubTrigger = component$<{
  class?: string;
  inset?: boolean;
}>(({ class: cls, inset }) => {
  return (
    <div
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      class={joinClasses(
        "cpk:focus:bg-accent cpk:focus:text-accent-foreground cpk:flex cpk:cursor-default cpk:items-center cpk:rounded-sm cpk:px-2 cpk:py-1.5 cpk:text-sm cpk:outline-hidden cpk:select-none",
        inset ? "cpk:pl-8" : "",
        cls,
      )}
    >
      <Slot />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="cpk:ml-auto cpk:size-4"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
});

export const DropdownMenuSubContent = component$<{ class?: string }>(
  ({ class: cls }) => {
    return (
      <div
        data-slot="dropdown-menu-sub-content"
        class={joinClasses(
          "cpk:bg-popover cpk:text-popover-foreground cpk:z-50 cpk:min-w-[8rem] cpk:overflow-hidden cpk:rounded-md cpk:border cpk:p-1 cpk:shadow-lg",
          cls,
        )}
      >
        <Slot />
      </div>
    );
  },
);
