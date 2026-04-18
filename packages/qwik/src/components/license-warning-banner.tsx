import { component$ } from "@builder.io/qwik";

interface LicenseWarningBannerProps {
  type:
    | "no_license"
    | "expired"
    | "expiring"
    | "invalid"
    | "feature_unlicensed";
  featureName?: string;
  expiryDate?: string;
  graceRemaining?: number;
  onDismiss$?: () => void;
}

const BASE_STYLE = {
  position: "fixed" as const,
  bottom: "8px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 99999,
  display: "inline-flex",
  alignItems: "center",
  gap: "12px",
  whiteSpace: "nowrap" as const,
  padding: "8px 16px",
  fontSize: "13px",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  borderRadius: "6px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
};

const SEVERITY_STYLES = {
  info: {
    backgroundColor: "#eff6ff",
    border: "1px solid #93c5fd",
    color: "#1e40af",
  },
  warning: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fbbf24",
    color: "#92400e",
  },
  critical: {
    backgroundColor: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
  },
};

function getSeverityStyle(
  severity: "info" | "warning" | "critical",
): Record<string, string> {
  return SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;
}

interface BannerShellProps {
  severity: "info" | "warning" | "critical";
  message: string;
  actionLabel: string;
  actionUrl: string;
  onDismiss$?: () => void;
}

const BannerShell = component$<BannerShellProps>(
  ({ severity, message, actionLabel, actionUrl, onDismiss$ }) => {
    return (
      <div style={{ ...BASE_STYLE, ...getSeverityStyle(severity) }}>
        <span>{message}</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href={actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: "600",
              textDecoration: "underline",
              color: "inherit",
            }}
          >
            {actionLabel}
          </a>
          {onDismiss$ && (
            <button
              onClick$={onDismiss$}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  },
);

export const LicenseWarningBanner = component$<LicenseWarningBannerProps>(
  ({ type, featureName, expiryDate, graceRemaining, onDismiss$ }) => {
    switch (type) {
      case "no_license":
        return (
          <BannerShell
            severity="info"
            message="Powered by CopilotKit"
            actionLabel="Get a license"
            actionUrl="https://copilotkit.ai/pricing"
            onDismiss$={onDismiss$}
          />
        );
      case "feature_unlicensed":
        return (
          <BannerShell
            severity="warning"
            message={`⚠ The "${featureName}" feature requires a CopilotKit license.`}
            actionLabel="Get a license"
            actionUrl="https://copilotkit.ai/pricing"
            onDismiss$={onDismiss$}
          />
        );
      case "expiring":
        return (
          <BannerShell
            severity="warning"
            message={`Your CopilotKit license expires in ${graceRemaining} day${graceRemaining !== 1 ? "s" : ""}. Please renew.`}
            actionLabel="Renew"
            actionUrl="https://cloud.copilotkit.ai"
            onDismiss$={onDismiss$}
          />
        );
      case "expired":
        return (
          <BannerShell
            severity="critical"
            message={`Your CopilotKit license expired${expiryDate ? ` on ${expiryDate}` : ""}. Please renew at copilotkit.ai/pricing`}
            actionLabel="Renew now"
            actionUrl="https://copilotkit.ai/pricing"
            onDismiss$={onDismiss$}
          />
        );
      case "invalid":
        return (
          <BannerShell
            severity="critical"
            message="Invalid CopilotKit license token. Please check your configuration."
            actionLabel="Get a license"
            actionUrl="https://copilotkit.ai/pricing"
            onDismiss$={onDismiss$}
          />
        );
      default:
        return null;
    }
  },
);

export const InlineFeatureWarning = component$<{ featureName: string }>(
  ({ featureName }) => {
    return (
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "#fffbeb",
          border: "1px solid #fbbf24",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#92400e",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        }}
      >
        ⚠ The "{featureName}" feature requires a CopilotKit license.{" "}
        <a
          href="https://copilotkit.ai/pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#b45309", textDecoration: "underline" }}
        >
          Get one at copilotkit.ai/pricing
        </a>
      </div>
    );
  },
);
