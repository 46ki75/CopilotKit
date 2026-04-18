import type { QwikToolCallRenderer } from "../types/qwik-tool-call-renderer";
import type { QwikActivityMessageRenderer } from "../types/qwik-activity-message-renderer";
import type { QwikCustomMessageRenderer } from "../types/qwik-custom-message-renderer";
import { CopilotKitCore } from "@copilotkit/core";
import type {
  CopilotKitCoreConfig,
  CopilotKitCoreSubscriber,
  CopilotKitCoreSubscription,
} from "@copilotkit/core";

export interface CopilotKitCoreQwikConfig extends CopilotKitCoreConfig {
  renderToolCalls?: QwikToolCallRenderer<any>[];
  renderActivityMessages?: QwikActivityMessageRenderer<any>[];
  renderCustomMessages?: QwikCustomMessageRenderer[];
}

export interface CopilotKitCoreQwikSubscriber extends CopilotKitCoreSubscriber {
  onRenderToolCallsChanged?: (event: {
    copilotkit: CopilotKitCore;
    renderToolCalls: QwikToolCallRenderer<any>[];
  }) => void | Promise<void>;
}

export class CopilotKitCoreQwik extends CopilotKitCore {
  private _renderToolCalls: QwikToolCallRenderer<any>[] = [];
  private _hookRenderToolCalls: Map<string, QwikToolCallRenderer<any>> =
    new Map();
  private _cachedMergedRenderToolCalls: QwikToolCallRenderer<any>[] | null =
    null;
  private _renderCustomMessages: QwikCustomMessageRenderer[] = [];
  private _renderActivityMessages: QwikActivityMessageRenderer<any>[] = [];

  constructor(config: CopilotKitCoreQwikConfig) {
    super(config);
    this._renderToolCalls = config.renderToolCalls ?? [];
    this._renderCustomMessages = config.renderCustomMessages ?? [];
    this._renderActivityMessages = config.renderActivityMessages ?? [];
  }

  get renderCustomMessages(): Readonly<QwikCustomMessageRenderer[]> {
    return this._renderCustomMessages;
  }

  get renderActivityMessages(): Readonly<QwikActivityMessageRenderer<any>[]> {
    return this._renderActivityMessages;
  }

  get renderToolCalls(): Readonly<QwikToolCallRenderer<any>[]> {
    if (this._hookRenderToolCalls.size === 0) {
      return this._renderToolCalls;
    }
    if (this._cachedMergedRenderToolCalls) {
      return this._cachedMergedRenderToolCalls;
    }
    const merged = new Map<string, QwikToolCallRenderer<any>>();
    for (const rc of this._renderToolCalls) {
      merged.set(`${rc.agentId ?? ""}:${rc.name}`, rc);
    }
    for (const [key, rc] of this._hookRenderToolCalls) {
      merged.set(key, rc);
    }
    this._cachedMergedRenderToolCalls = Array.from(merged.values());
    return this._cachedMergedRenderToolCalls;
  }

  setRenderActivityMessages(
    renderers: QwikActivityMessageRenderer<any>[],
  ): void {
    this._renderActivityMessages = renderers;
  }

  setRenderCustomMessages(renderers: QwikCustomMessageRenderer[]): void {
    this._renderCustomMessages = renderers;
  }

  setRenderToolCalls(renderToolCalls: QwikToolCallRenderer<any>[]): void {
    this._renderToolCalls = renderToolCalls;
    this._cachedMergedRenderToolCalls = null;
    this._notifyRenderToolCallsChanged();
  }

  addHookRenderToolCall(entry: QwikToolCallRenderer<any>): void {
    const key = `${entry.agentId ?? ""}:${entry.name}`;
    this._hookRenderToolCalls.set(key, entry);
    this._cachedMergedRenderToolCalls = null;
    this._notifyRenderToolCallsChanged();
  }

  removeHookRenderToolCall(name: string, agentId?: string): void {
    const key = `${agentId ?? ""}:${name}`;
    if (this._hookRenderToolCalls.delete(key)) {
      this._cachedMergedRenderToolCalls = null;
      this._notifyRenderToolCallsChanged();
    }
  }

  private _notifyRenderToolCallsChanged(): void {
    void this.notifySubscribers((subscriber) => {
      const qwikSubscriber = subscriber as CopilotKitCoreQwikSubscriber;
      if (qwikSubscriber.onRenderToolCallsChanged) {
        qwikSubscriber.onRenderToolCallsChanged({
          copilotkit: this,
          renderToolCalls: this.renderToolCalls as QwikToolCallRenderer<any>[],
        });
      }
    }, "Subscriber onRenderToolCallsChanged error:");
  }

  subscribe(
    subscriber: CopilotKitCoreQwikSubscriber,
  ): CopilotKitCoreSubscription {
    return super.subscribe(subscriber);
  }

  async waitForPendingFrameworkUpdates(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}
