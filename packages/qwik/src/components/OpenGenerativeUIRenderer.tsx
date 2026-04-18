import {
  component$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { z } from "zod";
import { ToolCallStatus } from "@copilotkit/core";
import type Websandbox from "@jetbrains/websandbox";
import { useSandboxFunctions } from "../context/sandbox-functions-context";
import {
  processPartialHtml,
  extractCompleteStyles,
} from "../lib/processPartialHtml";

export const OpenGenerativeUIActivityType = "open-generative-ui";

export const OpenGenerativeUIContentSchema = z.object({
  initialHeight: z.number().optional(),
  generating: z.boolean().optional(),
  css: z.string().optional(),
  cssComplete: z.boolean().optional(),
  html: z.array(z.string()).optional(),
  htmlComplete: z.boolean().optional(),
  jsFunctions: z.string().optional(),
  jsFunctionsComplete: z.boolean().optional(),
  jsExpressions: z.array(z.string()).optional(),
  jsExpressionsComplete: z.boolean().optional(),
});

export type OpenGenerativeUIContent = z.infer<
  typeof OpenGenerativeUIContentSchema
>;

/**
 * Schema for the generateSandboxedUi tool call arguments.
 * Used by the frontend tool renderer to display placeholder messages.
 */
export const GenerateSandboxedUiArgsSchema = z.object({
  initialHeight: z.number().optional(),
  placeholderMessages: z.array(z.string()).optional(),
  css: z.string().optional(),
  html: z.string().optional(),
  jsFunctions: z.string().optional(),
  jsExpressions: z.array(z.string()).optional(),
});

export type GenerateSandboxedUiArgs = z.infer<
  typeof GenerateSandboxedUiArgsSchema
>;

interface OpenGenerativeUIActivityRendererProps {
  activityType: string;
  content: OpenGenerativeUIContent;
  message: unknown;
  agent: unknown;
}

const THROTTLE_MS = 1000;

function shouldFlushImmediately(
  prev: OpenGenerativeUIContent | null,
  next: OpenGenerativeUIContent,
): boolean {
  if (next.cssComplete && (!prev || !prev.cssComplete)) return true;
  if (next.htmlComplete) return true;
  if (next.generating === false) return true;
  if (next.jsFunctions && (!prev || !prev.jsFunctions)) return true;
  if ((next.jsExpressions?.length ?? 0) > (prev?.jsExpressions?.length ?? 0))
    return true;
  if (next.html?.length && (!prev || !prev.html?.length)) return true;
  return false;
}

/**
 * Outer wrapper — throttles content updates before passing to the inner component.
 */
export const OpenGenerativeUIActivityRenderer =
  component$<OpenGenerativeUIActivityRendererProps>(
    function OpenGenerativeUIActivityRenderer(props) {
      const displayedContent = useSignal<OpenGenerativeUIContent>(
        props.content,
      );
      const prevContent = useSignal<OpenGenerativeUIContent | null>(null);

      // eslint-disable-next-line qwik/no-use-visible-task
      useVisibleTask$(({ track, cleanup }) => {
        const content = track(() => props.content);

        let timer: ReturnType<typeof setTimeout> | null = null;

        const flush = () => {
          timer = null;
          displayedContent.value = props.content;
          prevContent.value = props.content;
        };

        if (shouldFlushImmediately(prevContent.value, content)) {
          displayedContent.value = content;
          prevContent.value = content;
        } else if (displayedContent.value !== content) {
          if (timer === null) {
            timer = setTimeout(flush, THROTTLE_MS);
          }
        }

        cleanup(() => {
          if (timer !== null) {
            clearTimeout(timer);
          }
        });
      });

      return (
        <OpenGenerativeUIActivityRendererInner
          content={displayedContent.value}
        />
      );
    },
  );

// ---------------------------------------------------------------------------
// Inner component — sandbox creation and management
// ---------------------------------------------------------------------------

interface InnerProps {
  content: OpenGenerativeUIContent;
}

function ensureHead(html: string): string {
  if (/<head[\s>]/i.test(html)) return html;
  return `<head></head>${html}`;
}

function injectCssIntoHtml(html: string, css: string): string {
  const headCloseIdx = html.indexOf("</head>");
  if (headCloseIdx !== -1) {
    return (
      html.slice(0, headCloseIdx) +
      `<style>${css}</style>` +
      html.slice(headCloseIdx)
    );
  }
  return `<head><style>${css}</style></head>${html}`;
}

const OpenGenerativeUIActivityRendererInner = component$<InnerProps>(
  function OpenGenerativeUIActivityRendererInner(props) {
    const autoHeight = useSignal<number | null>(null);
    const containerRef = useSignal<HTMLElement | undefined>(undefined);
    const sandboxFunctions = useSandboxFunctions();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      const container = containerRef.value;
      if (!container) return;

      // All sandbox state as plain (non-reactive) objects
      type SandboxInstance = ReturnType<typeof Websandbox.create>;
      let sandbox: SandboxInstance | null = null;
      let previewSandbox: SandboxInstance | null = null;
      let previewReady = false;
      let sandboxReady = false;
      let _executedIndex = 0;
      let pendingQueue: string[] = [];
      let jsFunctionsInjected = false;
      let cancelled = false;

      // Build localApi from sandbox functions at setup time
      const localApi: Record<string, Function> = {};
      for (const fn of sandboxFunctions) {
        localApi[fn.name] = fn.handler;
      }

      // State tracking for incremental content changes
      let prevFullHtml: string | undefined = undefined;
      let prevCss: string | undefined = undefined;
      let prevHasPreview = false;
      let prevJsFunctions: string | undefined = undefined;
      let prevJsExpressionsLength = 0;
      let prevGenerationDone = false;

      // Resize message handler
      const onResizeMessage = (e: MessageEvent) => {
        if (
          sandbox?.iframe &&
          e.source === sandbox.iframe.contentWindow &&
          e.data?.type === "__ck_resize"
        ) {
          autoHeight.value = e.data.height;
          window.removeEventListener("message", onResizeMessage);
        }
      };

      const handleContentUpdate = async (content: OpenGenerativeUIContent) => {
        if (cancelled) return;

        const fullHtml =
          content.htmlComplete && content.html?.length
            ? content.html.join("")
            : undefined;

        const css = content.cssComplete ? content.css : undefined;
        const cssReady = !!content.cssComplete;
        const partialHtml =
          !content.htmlComplete && content.html?.length
            ? content.html.join("")
            : undefined;
        const previewBody = partialHtml
          ? processPartialHtml(partialHtml)
          : undefined;
        const previewStyles = partialHtml
          ? extractCompleteStyles(partialHtml)
          : "";
        const hasPreview = cssReady && !!previewBody?.trim();
        const generationDone = content.generating === false;

        // Create preview sandbox when preview is ready and final sandbox not yet
        if (hasPreview && !fullHtml && !prevHasPreview && !previewSandbox) {
          prevHasPreview = true;
          try {
            const mod: any = await import("@jetbrains/websandbox");
            if (cancelled) return;
            const Websandbox = mod.default?.default ?? mod.default;
            const ps = Websandbox.create(
              {},
              {
                frameContainer: container,
                frameContent: "<head></head><body></body>",
                allowAdditionalAttributes: "",
              },
            );
            previewSandbox = ps;
            ps.iframe.style.width = "100%";
            ps.iframe.style.height = "100%";
            ps.iframe.style.border = "none";
            ps.iframe.style.backgroundColor = "transparent";

            ps.promise.then(() => {
              if (cancelled) return;
              previewReady = true;
              ps.run(
                `var s=document.createElement('style');s.textContent='html,body{overflow:hidden!important}';document.head.appendChild(s);`,
              );
              const headParts: string[] = [];
              if (css) headParts.push(`<style>${css}</style>`);
              if (previewStyles) headParts.push(previewStyles);
              if (headParts.length) {
                ps.run(
                  `document.head.innerHTML=${JSON.stringify(headParts.join(""))}`,
                );
              }
              if (previewBody) {
                ps.run(
                  `document.body.innerHTML=${JSON.stringify(previewBody)}`,
                );
              }
            });
          } catch (err) {
            console.error(
              "[OpenGenerativeUI] Failed to load sandbox module:",
              err,
            );
          }
        }

        // Update preview content when it changes
        if (
          previewSandbox &&
          previewReady &&
          (previewBody !== undefined || previewStyles !== undefined)
        ) {
          const headParts: string[] = [];
          if (css) headParts.push(`<style>${css}</style>`);
          if (previewStyles) headParts.push(previewStyles);
          if (headParts.length) {
            previewSandbox.run(
              `document.head.innerHTML=${JSON.stringify(headParts.join(""))}`,
            );
          }
          if (previewBody) {
            previewSandbox.run(
              `document.body.innerHTML=${JSON.stringify(previewBody)}`,
            );
          }
        }

        // Create final sandbox when fullHtml is ready
        if (fullHtml && fullHtml !== prevFullHtml) {
          prevFullHtml = fullHtml;

          // Destroy preview sandbox when transitioning to final
          if (previewSandbox) {
            previewSandbox.destroy();
            previewSandbox = null;
            previewReady = false;
          }

          // Reset state for new html
          _executedIndex = 0;
          jsFunctionsInjected = false;
          sandboxReady = false;
          pendingQueue = [];

          if (sandbox) {
            sandbox.destroy();
            sandbox = null;
          }
          autoHeight.value = null;

          try {
            const htmlContent =
              css && css !== prevCss
                ? injectCssIntoHtml(fullHtml, css)
                : css
                  ? injectCssIntoHtml(fullHtml, css)
                  : fullHtml;
            prevCss = css;

            const mod: any = await import("@jetbrains/websandbox");
            if (cancelled) return;
            const Websandbox = mod.default?.default ?? mod.default;
            const sb = Websandbox.create(localApi, {
              frameContainer: container,
              frameContent: ensureHead(htmlContent),
              allowAdditionalAttributes: "",
            });
            sandbox = sb;
            sb.iframe.style.width = "100%";
            sb.iframe.style.height = "100%";
            sb.iframe.style.border = "none";
            sb.iframe.style.backgroundColor = "transparent";

            sb.promise.then(() => {
              if (cancelled) return;
              sandboxReady = true;
              sb.run(
                `var s=document.createElement('style');s.textContent='html,body{overflow:hidden!important}';document.head.appendChild(s);`,
              );
              const queue = pendingQueue;
              pendingQueue = [];
              for (const code of queue) {
                sb.run(code);
              }
            });
          } catch (err) {
            console.error(
              "[OpenGenerativeUI] Failed to load sandbox module:",
              err,
            );
          }
        }

        // Inject jsFunctions when they appear
        if (
          content.jsFunctions &&
          content.jsFunctions !== prevJsFunctions &&
          !jsFunctionsInjected
        ) {
          prevJsFunctions = content.jsFunctions;
          jsFunctionsInjected = true;
          if (sandboxReady && sandbox) {
            sandbox.run(content.jsFunctions);
          } else {
            pendingQueue.push(content.jsFunctions);
          }
        }

        // Execute new jsExpressions
        const expressions = content.jsExpressions;
        if (expressions && expressions.length > prevJsExpressionsLength) {
          const newExprs = expressions.slice(prevJsExpressionsLength);
          prevJsExpressionsLength = expressions.length;
          _executedIndex = expressions.length;
          if (sandboxReady && sandbox) {
            (async () => {
              for (const expr of newExprs) {
                await sandbox.run(expr);
              }
            })();
          } else {
            pendingQueue.push(...newExprs);
          }
        }

        // One-shot height measurement when generation completes
        if (generationDone && !prevGenerationDone && sandbox) {
          prevGenerationDone = true;
          window.addEventListener("message", onResizeMessage);
          const measureOnce = `
            (function(){
              var s=document.createElement('style');
              s.textContent='body{height:auto!important;min-height:0!important}';
              document.head.appendChild(s);
              var h=document.body.scrollHeight;
              var cs=getComputedStyle(document.body);
              h+=parseFloat(cs.marginTop)||0;
              h+=parseFloat(cs.marginBottom)||0;
              s.remove();
              parent.postMessage({type:"__ck_resize",height:Math.ceil(h)},"*");
            })();
          `;
          if (sandboxReady) {
            sandbox.run(measureOnce);
          } else {
            pendingQueue.push(measureOnce);
          }
        }
      };

      // Initial content handling
      handleContentUpdate(props.content);

      // Poll for incremental content changes rather than using track().
      // Using track() would cause the entire useVisibleTask$ to re-run (cleanup +
      // re-execute) on every content update, which destroys and recreates the sandbox.
      // Polling allows the sandbox to persist while applying incremental changes
      // (jsFunctions, jsExpressions, preview updates) without teardown.
      let lastContent = props.content;
      const poll = setInterval(() => {
        if (cancelled) return;
        if (props.content !== lastContent) {
          lastContent = props.content;
          handleContentUpdate(props.content);
        }
      }, 100);

      cleanup(() => {
        cancelled = true;
        clearInterval(poll);
        window.removeEventListener("message", onResizeMessage);
        if (previewSandbox) {
          previewSandbox.destroy();
          previewSandbox = null;
        }
        if (sandbox) {
          sandbox.destroy();
          sandbox = null;
        }
      });
    });

    const content = props.content;
    const initialHeight = content.initialHeight ?? 200;
    const height = autoHeight.value ?? initialHeight;

    const fullHtml =
      content.htmlComplete && content.html?.length
        ? content.html.join("")
        : undefined;
    const cssReady = !!content.cssComplete;
    const partialHtml =
      !content.htmlComplete && content.html?.length
        ? content.html.join("")
        : undefined;
    const previewBody = partialHtml
      ? processPartialHtml(partialHtml)
      : undefined;
    const hasPreview = cssReady && !!previewBody?.trim();
    const hasVisibleSandbox = !!fullHtml || hasPreview;
    const isGenerating = content.generating !== false;

    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: `${height}px`,
          borderRadius: "8px",
          backgroundColor: hasVisibleSandbox ? "transparent" : "#f5f5f5",
          border: hasVisibleSandbox ? "none" : "1px solid #e0e0e0",
          display: hasVisibleSandbox ? "block" : "flex",
          alignItems: hasVisibleSandbox ? undefined : "center",
          justifyContent: hasVisibleSandbox ? undefined : "center",
          overflow: "hidden",
        }}
      >
        {isGenerating && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              pointerEvents: "all",
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              style={{ animation: "ck-spin 1s linear infinite" }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#e0e0e0"
                stroke-width="3"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="#999"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
            <style>{`@keyframes ck-spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
      </div>
    );
  },
);

/**
 * Frontend tool renderer for generateSandboxedUi.
 * Displays placeholder messages while the UI is being generated.
 */
export const OpenGenerativeUIToolRenderer = component$<
  | {
      name: string;
      args: Partial<GenerateSandboxedUiArgs>;
      status: ToolCallStatus.InProgress;
      result: undefined;
    }
  | {
      name: string;
      args: GenerateSandboxedUiArgs;
      status: ToolCallStatus.Executing;
      result: undefined;
    }
  | {
      name: string;
      args: GenerateSandboxedUiArgs;
      status: ToolCallStatus.Complete;
      result: string;
    }
>(function OpenGenerativeUIToolRenderer(props) {
  const visibleMessageIndex = useSignal(0);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    const messages = track(() => props.args.placeholderMessages);
    const status = track(() => props.status);

    if (!messages || messages.length === 0) return;

    // Jump to the latest message when a new one appears
    visibleMessageIndex.value = messages.length - 1;

    // Auto-cycle while still in progress
    if (status === ToolCallStatus.Complete) return;

    const timer = setInterval(() => {
      visibleMessageIndex.value =
        (visibleMessageIndex.value + 1) % messages.length;
    }, 5000);

    cleanup(() => clearInterval(timer));
  });

  if (props.status === ToolCallStatus.Complete) return null;

  const messages = props.args.placeholderMessages;
  if (!messages || messages.length === 0) return null;

  return (
    <div
      style={{
        padding: "8px 12px",
        color: "#999",
        fontSize: "14px",
      }}
    >
      {messages[visibleMessageIndex.value] ?? messages[0]}
    </div>
  );
});
