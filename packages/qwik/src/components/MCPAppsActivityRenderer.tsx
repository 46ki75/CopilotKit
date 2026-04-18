import { component$, useContext, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { z } from "zod";
import type { AbstractAgent, RunAgentResult } from "@ag-ui/client";
import { CopilotKitContextId } from "../context/copilot-context";
import type { CopilotKitCoreQwik } from "../lib/qwik-core";

// Protocol version supported
const PROTOCOL_VERSION = "2025-06-18";

// Build sandbox proxy HTML with optional extra CSP domains from resource metadata
function buildSandboxHTML(extraCspDomains?: string[]): string {
  const baseScriptSrc =
    "'self' 'wasm-unsafe-eval' 'unsafe-inline' 'unsafe-eval' blob: data: http://localhost:* https://localhost:*";
  const baseFrameSrc = "* blob: data: http://localhost:* https://localhost:*";
  const extra = extraCspDomains?.length ? " " + extraCspDomains.join(" ") : "";
  const scriptSrc = baseScriptSrc + extra;
  const frameSrc = baseFrameSrc + extra;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src * data: blob: 'unsafe-inline'; media-src * blob: data:; font-src * blob: data:; script-src ${scriptSrc}; style-src * blob: data: 'unsafe-inline'; connect-src *; frame-src ${frameSrc}; base-uri 'self';" />
<style>html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden}*{box-sizing:border-box}iframe{background-color:transparent;border:none;padding:0;overflow:hidden;width:100%;height:100%}</style>
</head>
<body>
<script>
if(window.self===window.top){throw new Error("This file must be used in an iframe.")}
const inner=document.createElement("iframe");
inner.style="width:100%;height:100%;border:none;";
inner.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms");
document.body.appendChild(inner);
window.addEventListener("message",async(event)=>{
if(event.source===window.parent){
if(event.data&&event.data.method==="ui/notifications/sandbox-resource-ready"){
const{html,sandbox}=event.data.params;
if(typeof sandbox==="string")inner.setAttribute("sandbox",sandbox);
if(typeof html==="string")inner.srcdoc=html;
}else if(inner&&inner.contentWindow){
inner.contentWindow.postMessage(event.data,"*");
}
}else if(event.source===inner.contentWindow){
window.parent.postMessage(event.data,"*");
}
});
window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/sandbox-proxy-ready",params:{}},"*");
</script>
</body>
</html>`;
}

/**
 * Queue for serializing MCP app requests to an agent.
 * Ensures requests wait for the agent to stop running and are processed one at a time.
 */
class MCPAppsRequestQueue {
  private queues = new Map<
    string,
    Array<{
      execute: () => Promise<RunAgentResult>;
      resolve: (result: RunAgentResult) => void;
      reject: (error: Error) => void;
    }>
  >();
  private processing = new Map<string, boolean>();

  async enqueue(
    agent: AbstractAgent,
    request: () => Promise<RunAgentResult>,
  ): Promise<RunAgentResult> {
    const threadId = agent.threadId || "default";

    return new Promise((resolve, reject) => {
      let queue = this.queues.get(threadId);
      if (!queue) {
        queue = [];
        this.queues.set(threadId, queue);
      }

      queue.push({ execute: request, resolve, reject });

      this.processQueue(threadId, agent);
    });
  }

  private async processQueue(
    threadId: string,
    agent: AbstractAgent,
  ): Promise<void> {
    if (this.processing.get(threadId)) {
      return;
    }

    this.processing.set(threadId, true);

    try {
      const queue = this.queues.get(threadId);
      if (!queue) return;

      while (queue.length > 0) {
        const item = queue[0]!;

        try {
          await this.waitForAgentIdle(agent);
          const result = await item.execute();
          item.resolve(result);
        } catch (error) {
          item.reject(
            error instanceof Error ? error : new Error(String(error)),
          );
        }

        queue.shift();
      }
    } finally {
      this.processing.set(threadId, false);
    }
  }

  private waitForAgentIdle(agent: AbstractAgent): Promise<void> {
    return new Promise((resolve) => {
      if (!agent.isRunning) {
        resolve();
        return;
      }

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(checkInterval);
        sub.unsubscribe();
        resolve();
      };

      const sub = agent.subscribe({
        onRunFinalized: finish,
        onRunFailed: finish,
      });

      const checkInterval = setInterval(() => {
        if (!agent.isRunning) finish();
      }, 500);
    });
  }
}

// Global queue instance for all MCP app requests
const mcpAppsRequestQueue = new MCPAppsRequestQueue();

/**
 * Activity type for MCP Apps events - must match the middleware's MCPAppsActivityType
 */
export const MCPAppsActivityType = "mcp-apps";

// Zod schema for activity content validation (middleware 0.0.2 format)
export const MCPAppsActivityContentSchema = z.object({
  result: z.object({
    content: z.array(z.any()).optional(),
    structuredContent: z.any().optional(),
    isError: z.boolean().optional(),
  }),
  resourceUri: z.string(),
  serverHash: z.string(),
  serverId: z.string().optional(),
  toolInput: z.record(z.unknown()).optional(),
});

export type MCPAppsActivityContent = z.infer<
  typeof MCPAppsActivityContentSchema
>;

interface FetchedResource {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
  _meta?: {
    ui?: {
      prefersBorder?: boolean;
      csp?: {
        connectDomains?: string[];
        resourceDomains?: string[];
      };
    };
  };
}

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface JSONRPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

function isRequest(msg: JSONRPCMessage): msg is JSONRPCRequest {
  return "id" in msg && "method" in msg;
}

function isNotification(msg: JSONRPCMessage): msg is JSONRPCNotification {
  return !("id" in msg) && "method" in msg;
}

interface MCPAppsActivityRendererProps {
  activityType: string;
  content: MCPAppsActivityContent;
  message: unknown;
  agent: AbstractAgent | undefined;
}

/**
 * MCP Apps Extension Activity Renderer (Qwik port)
 *
 * Renders MCP Apps UI in a sandboxed iframe with full protocol support.
 * Fetches resource content on-demand via proxied MCP requests.
 */
export const MCPAppsActivityRenderer = component$<MCPAppsActivityRendererProps>(
  (props) => {
    const ctx = useContext(CopilotKitContextId);
    const containerRef = useSignal<HTMLElement | undefined>(undefined);
    const iframeReady = useSignal(false);
    const error = useSignal<Error | null>(null);
    const isLoading = useSignal(true);
    const iframeSize = useSignal<{ width?: number; height?: number }>({});
    const fetchedResource = useSignal<FetchedResource | null>(null);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      let mounted = true;
      let iframeEl: HTMLIFrameElement | null = null;
      let messageHandler: ((event: MessageEvent) => void) | null = null;
      let initialListener: ((event: MessageEvent) => void) | null = null;
      let createdIframe: HTMLIFrameElement | null = null;

      // Register cleanup immediately before any async work
      cleanup(() => {
        mounted = false;
        if (initialListener) {
          window.removeEventListener("message", initialListener);
          initialListener = null;
        }
        if (messageHandler) {
          window.removeEventListener("message", messageHandler);
        }
        if (createdIframe) {
          createdIframe.remove();
          createdIframe = null;
        }
        iframeEl = null;
      });

      // Helper functions — defined as plain closures capturing local iframeEl
      const sendToIframe = (msg: JSONRPCMessage) => {
        if (iframeEl?.contentWindow) {
          console.log("[MCPAppsRenderer] Sending to iframe:", msg);
          iframeEl.contentWindow.postMessage(msg, "*");
        }
      };

      const sendResponse = (id: string | number, result: unknown) => {
        sendToIframe({ jsonrpc: "2.0", id, result });
      };

      const sendErrorResponse = (
        id: string | number,
        code: number,
        message: string,
      ) => {
        sendToIframe({ jsonrpc: "2.0", id, error: { code, message } });
      };

      const sendNotification = (
        method: string,
        params?: Record<string, unknown>,
      ) => {
        sendToIframe({ jsonrpc: "2.0", method, params: params || {} });
      };

      (async () => {
        const agent = props.agent;
        const container = containerRef.value;
        const { content } = props;
        const copilotkit = ctx.coreRef.value as CopilotKitCoreQwik | undefined;

        if (!agent) {
          if (mounted) {
            error.value = new Error("No agent available to fetch resource");
            isLoading.value = false;
          }
          return;
        }

        if (!container) {
          if (mounted) {
            error.value = new Error("Container not available");
            isLoading.value = false;
          }
          return;
        }

        // Effect 0: Fetch the resource content
        const { resourceUri, serverHash, serverId } = content;

        let resource: FetchedResource | null = null;
        try {
          const runResult = await mcpAppsRequestQueue.enqueue(agent, () =>
            agent.runAgent({
              forwardedProps: {
                __proxiedMCPRequest: {
                  serverHash,
                  serverId,
                  method: "resources/read",
                  params: { uri: resourceUri },
                },
              },
            }),
          );

          const resultData = runResult.result as
            | { contents?: FetchedResource[] }
            | undefined;
          resource = resultData?.contents?.[0] ?? null;

          if (!resource) {
            throw new Error("No resource content in response");
          }
        } catch (err) {
          console.error("[MCPAppsRenderer] Failed to fetch resource:", err);
          if (mounted) {
            error.value = err instanceof Error ? err : new Error(String(err));
            isLoading.value = false;
          }
          return;
        }

        if (!mounted) return;

        fetchedResource.value = resource;
        isLoading.value = false;

        // Effect 1: Setup sandbox proxy iframe and communication
        try {
          const iframe = document.createElement("iframe");
          createdIframe = iframe;
          iframe.style.width = "100%";
          iframe.style.height = "100px";
          iframe.style.border = "none";
          iframe.style.backgroundColor = "transparent";
          iframe.style.display = "block";
          iframe.setAttribute(
            "sandbox",
            "allow-scripts allow-same-origin allow-forms",
          );

          // Wait for sandbox proxy to be ready
          const sandboxReady = new Promise<void>((resolve) => {
            initialListener = (event: MessageEvent) => {
              if (event.source === iframe.contentWindow) {
                if (
                  event.data?.method === "ui/notifications/sandbox-proxy-ready"
                ) {
                  if (initialListener) {
                    window.removeEventListener("message", initialListener);
                    initialListener = null;
                  }
                  resolve();
                }
              }
            };
            window.addEventListener("message", initialListener);
          });

          if (!mounted) {
            if (initialListener) {
              window.removeEventListener("message", initialListener);
              initialListener = null;
            }
            return;
          }

          const cspDomains = resource._meta?.ui?.csp?.resourceDomains;
          iframe.srcdoc = buildSandboxHTML(cspDomains);
          iframeEl = iframe;
          container.appendChild(iframe);

          await sandboxReady;
          if (!mounted) return;

          console.log("[MCPAppsRenderer] Sandbox proxy ready");

          // Setup message handler for JSON-RPC messages from the inner iframe
          messageHandler = async (event: MessageEvent) => {
            if (event.source !== iframe.contentWindow) return;

            const msg = event.data as JSONRPCMessage;
            if (!msg || typeof msg !== "object" || msg.jsonrpc !== "2.0")
              return;

            console.log("[MCPAppsRenderer] Received from iframe:", msg);

            if (isRequest(msg)) {
              switch (msg.method) {
                case "ui/initialize": {
                  sendResponse(msg.id, {
                    protocolVersion: PROTOCOL_VERSION,
                    hostInfo: {
                      name: "CopilotKit MCP Apps Host",
                      version: "1.0.0",
                    },
                    hostCapabilities: {
                      openLinks: {},
                      logging: {},
                    },
                    hostContext: {
                      theme: "light",
                      platform: "web",
                    },
                  });
                  break;
                }

                case "ui/message": {
                  const currentAgent = props.agent;

                  if (!currentAgent) {
                    console.warn(
                      "[MCPAppsRenderer] ui/message: No agent available",
                    );
                    sendResponse(msg.id, { isError: false });
                    break;
                  }

                  try {
                    const params = msg.params as {
                      role?: string;
                      content?: Array<{ type: string; text?: string }>;
                      followUp?: boolean;
                    };

                    const role =
                      (params.role as "user" | "assistant") || "user";

                    const textContent =
                      params.content
                        ?.filter((c) => c.type === "text" && c.text)
                        .map((c) => c.text)
                        .join("\n") || "";

                    if (textContent) {
                      currentAgent.addMessage({
                        id: crypto.randomUUID(),
                        role,
                        content: textContent,
                      });
                    }

                    sendResponse(msg.id, { isError: false });

                    const shouldFollowUp = params.followUp ?? role === "user";

                    if (shouldFollowUp && textContent && copilotkit) {
                      mcpAppsRequestQueue
                        .enqueue(currentAgent, () =>
                          copilotkit.runAgent({ agent: currentAgent }),
                        )
                        .catch((err) =>
                          console.error(
                            "[MCPAppsRenderer] ui/message agent run failed:",
                            err,
                          ),
                        );
                    }
                  } catch (err) {
                    console.error("[MCPAppsRenderer] ui/message error:", err);
                    sendResponse(msg.id, { isError: true });
                  }
                  break;
                }

                case "ui/open-link": {
                  const url = msg.params?.url as string | undefined;
                  if (url) {
                    window.open(url, "_blank", "noopener,noreferrer");
                    sendResponse(msg.id, { isError: false });
                  } else {
                    sendErrorResponse(msg.id, -32602, "Missing url parameter");
                  }
                  break;
                }

                case "tools/call": {
                  const { serverHash: sh, serverId: sid } = props.content;
                  const currentAgent = props.agent;

                  if (!sh) {
                    sendErrorResponse(
                      msg.id,
                      -32603,
                      "No server hash available for proxying",
                    );
                    break;
                  }

                  if (!currentAgent) {
                    sendErrorResponse(
                      msg.id,
                      -32603,
                      "No agent available for proxying",
                    );
                    break;
                  }

                  try {
                    const runResult = await mcpAppsRequestQueue.enqueue(
                      currentAgent,
                      () =>
                        currentAgent.runAgent({
                          forwardedProps: {
                            __proxiedMCPRequest: {
                              serverHash: sh,
                              serverId: sid,
                              method: "tools/call",
                              params: msg.params,
                            },
                          },
                        }),
                    );

                    sendResponse(msg.id, runResult.result || {});
                  } catch (err) {
                    console.error("[MCPAppsRenderer] tools/call error:", err);
                    sendErrorResponse(msg.id, -32603, String(err));
                  }
                  break;
                }

                default:
                  sendErrorResponse(
                    msg.id,
                    -32601,
                    `Method not found: ${msg.method}`,
                  );
              }
            }

            if (isNotification(msg)) {
              switch (msg.method) {
                case "ui/notifications/initialized": {
                  console.log("[MCPAppsRenderer] Inner iframe initialized");
                  if (mounted) {
                    iframeReady.value = true;
                    // Send tool input and result now that iframe is ready
                    if (props.content.toolInput) {
                      sendNotification("ui/notifications/tool-input", {
                        arguments: props.content.toolInput,
                      });
                    }
                    if (props.content.result) {
                      sendNotification(
                        "ui/notifications/tool-result",
                        props.content.result as Record<string, unknown>,
                      );
                    }
                  }
                  break;
                }

                case "ui/notifications/size-changed": {
                  const { width, height } = msg.params || {};
                  console.log("[MCPAppsRenderer] Size change:", {
                    width,
                    height,
                  });
                  if (mounted) {
                    const newSize: { width?: number; height?: number } = {};
                    if (typeof width === "number") {
                      newSize.width = width;
                      if (iframeEl) {
                        iframeEl.style.minWidth = `min(${width}px, 100%)`;
                        iframeEl.style.width = "100%";
                      }
                    }
                    if (typeof height === "number") {
                      newSize.height = height;
                      if (iframeEl) {
                        iframeEl.style.height = `${height}px`;
                      }
                    }
                    iframeSize.value = newSize;
                  }
                  break;
                }

                case "notifications/message": {
                  console.log("[MCPAppsRenderer] App log:", msg.params);
                  break;
                }
              }
            }
          };

          window.addEventListener("message", messageHandler);

          // Extract HTML content from fetched resource and send to sandbox
          let html: string;
          if (resource.text) {
            html = resource.text;
          } else if (resource.blob) {
            html = atob(resource.blob);
          } else {
            throw new Error("Resource has no text or blob content");
          }

          sendNotification("ui/notifications/sandbox-resource-ready", { html });
        } catch (err) {
          console.error("[MCPAppsRenderer] Setup error:", err);
          if (mounted) {
            error.value = err instanceof Error ? err : new Error(String(err));
          }
        }
      })();
    });

    const prefersBorder = fetchedResource.value?._meta?.ui?.prefersBorder;
    const borderStyle =
      prefersBorder === true
        ? {
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            border: "1px solid #e0e0e0",
          }
        : {};

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: iframeSize.value.height
            ? `${iframeSize.value.height}px`
            : "auto",
          minHeight: "100px",
          overflow: "hidden",
          position: "relative",
          ...borderStyle,
        }}
      >
        {isLoading.value && (
          <div style={{ padding: "1rem", color: "#666" }}>Loading...</div>
        )}
        {error.value && (
          <div style={{ color: "red", padding: "1rem" }}>
            Error: {error.value.message}
          </div>
        )}
      </div>
    );
  },
);
