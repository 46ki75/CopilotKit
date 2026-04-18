/**
 * Utility function for merging class names.
 * Provides the same `cn()` API as the React package but without
 * external dependencies (clsx / tailwind-merge).
 *
 * All CopilotKit Tailwind utilities already carry the `cpk:` prefix so
 * there is no class-name conflict risk that `tailwind-merge` would resolve.
 */
export function cn(
  ...inputs: (string | undefined | null | false | 0)[]
): string {
  return inputs.filter(Boolean).join(" ");
}
