import { component$, useContext, useTask$, useSignal, Slot } from "@builder.io/qwik";
import { z } from "zod";
import { CopilotKitContextId } from "../context/copilot-context";
import { defineToolCallRenderer } from "../types/define-tool-call-renderer";
import type { CopilotKitCoreQwik } from "../lib/qwik-core";

/**
 * Tool name used by the dynamic A2UI generation secondary LLM.
 * This renderer is auto-registered when A2UI is enabled.
 */
export const RENDER_A2UI_TOOL_NAME = "render_a2ui";

interface A2UIProgressProps {
  parameters: unknown;
}

/**
 * Built-in progress indicator for dynamic A2UI generation.
 * Shows a skeleton wireframe that progressively reveals as tokens stream in.
 */
const A2UIProgressIndicator = component$<A2UIProgressProps>(({ parameters }) => {
  const tokensRef = useSignal(0);

  useTask$(({ track }) => {
    track(() => parameters);

    const chars = JSON.stringify(parameters ?? {}).length;
    tokensRef.value = Math.round(chars / 4);
  });

  const tokens = tokensRef.value;
  const phase = tokens < 50 ? 0 : tokens < 200 ? 1 : tokens < 400 ? 2 : 3;

  return (
    <div style={{ margin: "12px 0", maxWidth: "320px" }}>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          border: "1px solid rgba(228,228,231,0.8)",
          backgroundColor: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          padding: "16px 18px 14px",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "4px" }}>
            <Dot />
            <Dot />
            <Dot />
          </div>
          <Bar
            w={64}
            h={6}
            bg="#e4e4e7"
            opacity={phase >= 1 ? 1 : 0.4}
          />
        </div>

        {/* Skeleton lines */}
        <div style={{ display: "grid", gap: "7px" }}>
          <SkeletonRow show={phase >= 0}>
            <Bar w={36} h={7} bg="rgba(147,197,253,0.7)" anim={0} />
            <Bar w={80} h={7} bg="rgba(219,234,254,0.8)" anim={0.2} />
          </SkeletonRow>
          <SkeletonRow show={phase >= 0} delay={0.1}>
            <Spacer />
            <Dot />
            <Bar w={100} h={7} bg="rgba(24,24,27,0.2)" anim={0.3} />
          </SkeletonRow>
          <SkeletonRow show={phase >= 1} delay={0.15}>
            <Spacer />
            <Bar w={48} h={7} bg="rgba(24,24,27,0.15)" anim={0.1} />
            <Bar w={40} h={7} bg="rgba(153,246,228,0.6)" anim={0.5} />
            <Bar w={56} h={7} bg="rgba(147,197,253,0.6)" anim={0.3} />
          </SkeletonRow>
          <SkeletonRow show={phase >= 1} delay={0.2}>
            <Spacer />
            <Dot />
            <Bar w={60} h={7} bg="rgba(24,24,27,0.15)" anim={0.4} />
          </SkeletonRow>
          <SkeletonRow show={phase >= 2} delay={0.25}>
            <Bar w={40} h={7} bg="rgba(153,246,228,0.5)" anim={0.2} />
            <Dot />
            <Bar w={48} h={7} bg="rgba(24,24,27,0.15)" anim={0.6} />
            <Bar w={64} h={7} bg="rgba(147,197,253,0.5)" anim={0.1} />
          </SkeletonRow>
          <SkeletonRow show={phase >= 2} delay={0.3}>
            <Bar w={36} h={7} bg="rgba(147,197,253,0.6)" anim={0.5} />
            <Bar w={36} h={7} bg="rgba(24,24,27,0.12)" anim={0.7} />
          </SkeletonRow>
          <SkeletonRow show={phase >= 3} delay={0.35}>
            <Dot />
            <Bar w={44} h={7} bg="rgba(24,24,27,0.18)" anim={0.3} />
            <Dot />
            <Bar w={56} h={7} bg="rgba(153,246,228,0.5)" anim={0.8} />
            <Bar w={48} h={7} bg="rgba(147,197,253,0.5)" anim={0.4} />
          </SkeletonRow>
        </div>

        {/* Shimmer */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, transparent 0%, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%, transparent 100%)",
            backgroundSize: "250% 100%",
            animation: "cpk-a2ui-sweep 3s ease-in-out infinite",
          }}
        />
      </div>

      {/* Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: "8px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "#a1a1aa",
            letterSpacing: "0.025em",
          }}
        >
          Building interface
        </span>
        {tokens > 0 && (
          <span
            style={{
              fontSize: "11px",
              color: "#d4d4d8",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ~{tokens.toLocaleString()} tokens
          </span>
        )}
      </div>

      <style>{`
        @keyframes cpk-a2ui-fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes cpk-a2ui-sweep {
          0% { background-position: 250% 0; }
          100% { background-position: -250% 0; }
        }
      `}</style>
    </div>
  );
});

// --- Primitive components ---

const Dot = component$(() => (
  <div
    style={{
      width: "7px",
      height: "7px",
      borderRadius: "50%",
      backgroundColor: "#d4d4d8",
      flexShrink: 0,
    }}
  />
));

const Spacer = component$(() => (
  <div style={{ width: "12px" }} />
));

interface BarProps {
  w: number;
  h: number;
  bg: string;
  anim?: number;
  opacity?: number;
}

const Bar = component$<BarProps>(({ w, h, bg, anim, opacity }) => (
  <div
    style={{
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: "9999px",
      backgroundColor: bg,
      ...(anim !== undefined
        ? { animation: `cpk-a2ui-fade 2.4s ease-in-out ${anim}s infinite` }
        : {}),
      ...(opacity !== undefined ? { opacity } : {}),
    }}
  />
));

interface SkeletonRowProps {
  show: boolean;
  delay?: number;
}

const SkeletonRow = component$<SkeletonRowProps>(({ show, delay = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      opacity: show ? 1 : 0,
      transition: `opacity 0.4s ${delay}s`,
    }}
  >
    <Slot />
  </div>
));

/**
 * Registers the built-in `render_a2ui` tool call renderer.
 *
 * This ensures user-registered `useRenderTool({ name: "render_a2ui", ... })`
 * hooks automatically override the built-in, since the merge logic in
 * qwik-core.ts gives hook-based entries priority over prop-based entries.
 *
 * This is the Qwik equivalent of `A2UIBuiltInToolCallRenderer` from
 * `@copilotkit/react-core`.
 */
export const A2UIBuiltInToolCallRenderer = component$(() => {
  const ctx = useContext(CopilotKitContextId);

  useTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value as CopilotKitCoreQwik | undefined;
    if (!core) return;

    const renderer = defineToolCallRenderer({
      name: RENDER_A2UI_TOOL_NAME,
      args: z.any(),
      render: ({ status, args: parameters }) => {
        if (status === "complete") return <></>;

        const params = parameters as Record<string, unknown> | undefined;

        // Hide skeleton once the A2UI surface has enough data to render
        const items = params?.items;
        if (Array.isArray(items) && items.length > 0) return <></>;
        const components = params?.components;
        if (Array.isArray(components) && components.length > 2) return <></>;

        return <A2UIProgressIndicator parameters={parameters} />;
      },
    });

    // Register via props-based mechanism so useRenderTool hooks take priority
    const existing = [...core.renderToolCalls];
    core.setRenderToolCalls([
      ...existing.filter((rc: any) => rc.name !== RENDER_A2UI_TOOL_NAME),
      renderer,
    ]);

    cleanup(() => {
      const current = [...core.renderToolCalls];
      core.setRenderToolCalls(
        current.filter((rc: any) => rc.name !== RENDER_A2UI_TOOL_NAME),
      );
    });
  });

  return null;
});
