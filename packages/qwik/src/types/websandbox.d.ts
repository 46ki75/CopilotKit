/**
 * Type stub for @jetbrains/websandbox — loaded via dynamic import at runtime only.
 * Provides minimal typings for the API surface used by OpenGenerativeUIRenderer.
 */
declare module "@jetbrains/websandbox" {
  interface SandboxInstance {
    iframe: HTMLIFrameElement;
    promise: Promise<void>;
    run(code: string | Function): Promise<unknown>;
    destroy(): void;
  }

  interface WebsandboxStatic {
    create(
      api: Record<string, Function>,
      options: {
        frameContainer: HTMLElement;
        frameContent: string;
        allowAdditionalAttributes?: string;
      },
    ): SandboxInstance;
  }

  const Websandbox: WebsandboxStatic;
  export default Websandbox;
}
