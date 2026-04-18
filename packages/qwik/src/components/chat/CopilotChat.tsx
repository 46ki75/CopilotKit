import {
  component$,
  useContext,
  useSignal,
  useVisibleTask$,
  $,
  type QRL,
} from "@builder.io/qwik";
import { HttpAgent } from "@ag-ui/client";
import type { AbstractAgent } from "@ag-ui/client";
import { DEFAULT_AGENT_ID, randomUUID } from "@copilotkit/shared";
import type { AttachmentsConfig, InputContent, Attachment } from "@copilotkit/shared";
import type { Suggestion, CopilotKitCoreErrorCode } from "@copilotkit/core";
import { CopilotKitContextId } from "../../context/copilot-context";
import { useAgent } from "../../hooks/use-agent";
import { useSuggestions } from "../../hooks/use-suggestions";
import { useAttachments } from "../../hooks/use-attachments";
import { CopilotChatConfigurationProvider, useCopilotChatConfiguration } from "../copilot-chat-configuration-provider";
import { CopilotChatView, type CopilotChatViewProps } from "./CopilotChatView";
import type { CopilotChatLabels } from "../../context/copilot-chat-configuration-context";

export interface CopilotChatProps {
  agentId?: string;
  threadId?: string;
  labels?: Partial<CopilotChatLabels>;
  isModalDefaultOpen?: boolean;
  attachments?: AttachmentsConfig;
  onError?: (event: {
    error: Error;
    code: CopilotKitCoreErrorCode;
    context: Record<string, unknown>;
  }) => void | Promise<void>;
  class?: string;
}

export const CopilotChat = component$<CopilotChatProps>((props) => {
  const ctx = useContext(CopilotKitContextId);
  const existingConfig = useCopilotChatConfiguration();

  const resolvedAgentId = props.agentId ?? existingConfig?.agentId ?? DEFAULT_AGENT_ID;
  const resolvedThreadId = props.threadId ?? existingConfig?.threadId ?? randomUUID();

  const { agent, messages, isRunning } = useAgent({ agentId: resolvedAgentId });
  const { suggestions: autoSuggestions } = useSuggestions({ agentId: resolvedAgentId });
  const {
    attachments: selectedAttachments,
    enabled: attachmentsEnabled,
    dragOver,
    processFiles,
    removeAttachment,
    consumeAttachments,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useAttachments({ config: props.attachments });

  const inputValue = useSignal("");
  const fileInputRef = useSignal<HTMLInputElement | undefined>(undefined);

  // Connect agent when available
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);
    track(() => agent.value);

    const core = ctx.coreRef.value;
    const agentInstance = agent.value;
    if (!core || !agentInstance) return;

    let detached = false;
    const connectAbortController = new AbortController();

    if (agentInstance instanceof HttpAgent) {
      (agentInstance as HttpAgent).abortController = connectAbortController;
    }

    const connect = async (a: AbstractAgent) => {
      try {
        await core.connectAgent({ agent: a });
      } catch (error) {
        if (detached) return;
        console.error("CopilotChat: connectAgent failed", error);
      }
    };
    connect(agentInstance);

    cleanup(() => {
      detached = true;
      connectAbortController.abort();
      void agentInstance.detachActiveRun().catch(() => {});
    });
  });

  // Error subscription
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => ctx.coreRef.value);

    const core = ctx.coreRef.value;
    if (!core || !props.onError) return;

    const subscription = core.subscribe({
      onError: (event: { error: Error; code: CopilotKitCoreErrorCode; context: Record<string, unknown> }) => {
        const eventAgentId = event.context?.agentId;
        if (eventAgentId === resolvedAgentId || !eventAgentId) {
          props.onError!({
            error: event.error,
            code: event.code,
            context: event.context,
          });
        }
      },
    });

    cleanup(() => {
      subscription.unsubscribe();
    });
  });

  const handleSubmitMessage = $(async (value: string) => {
    const core = ctx.coreRef.value;
    const agentInstance = agent.value;
    if (!core || !agentInstance) return;

    const hasUploading = selectedAttachments.value.some(
      (a: Attachment) => a.status === "uploading",
    );
    if (hasUploading) {
      console.error("[CopilotKit] Cannot send while attachments are uploading");
      return;
    }

    const readyAttachments = consumeAttachments();

    if (readyAttachments.length > 0) {
      const contentParts: InputContent[] = [];
      if (value.trim()) {
        contentParts.push({ type: "text", text: value });
      }
      for (const att of readyAttachments) {
        contentParts.push({
          type: att.type,
          source: att.source,
          metadata: {
            ...(att.filename ? { filename: att.filename } : {}),
            ...att.metadata,
          },
        } as InputContent);
      }
      agentInstance.addMessage({
        id: randomUUID(),
        role: "user",
        content: contentParts,
      });
    } else {
      agentInstance.addMessage({
        id: randomUUID(),
        role: "user",
        content: value,
      });
    }

    inputValue.value = "";

    try {
      await core.runAgent({ agent: agentInstance });
    } catch (error) {
      console.error("CopilotChat: runAgent failed", error);
    }
  });

  const handleSelectSuggestion = $(async (suggestion: Suggestion) => {
    const core = ctx.coreRef.value;
    const agentInstance = agent.value;
    if (!core || !agentInstance) return;

    agentInstance.addMessage({
      id: randomUUID(),
      role: "user",
      content: suggestion.message,
    });

    try {
      await core.runAgent({ agent: agentInstance });
    } catch (error) {
      console.error("CopilotChat: runAgent failed after selecting suggestion", error);
    }
  });

  const handleStop = $(() => {
    const core = ctx.coreRef.value;
    const agentInstance = agent.value;
    if (!core || !agentInstance) return;

    try {
      core.stopAgent({ agent: agentInstance });
    } catch (error) {
      console.error("CopilotChat: stopAgent failed", error);
      try {
        agentInstance.abortRun();
      } catch (abortError) {
        console.error("CopilotChat: abortRun fallback failed", abortError);
      }
    }
  });

  const handleInputChange = $((value: string) => {
    inputValue.value = value;
  });

  const handleAddFile = $(() => {
    fileInputRef.value?.click();
  });

  const handleRemoveAttachment = $((id: string) => {
    removeAttachment(id);
  });

  const handleDragOverEvent = $((e: DragEvent) => {
    handleDragOver(e);
  });

  const handleDragLeaveEvent = $((e: DragEvent) => {
    handleDragLeave(e);
  });

  const handleDropEvent = $(async (e: DragEvent) => {
    await handleDrop(e);
  });

  return (
    <CopilotChatConfigurationProvider
      agentId={resolvedAgentId}
      threadId={resolvedThreadId}
      labels={props.labels}
      isModalDefaultOpen={props.isModalDefaultOpen}
    >
      <div style={{ display: "contents" }}>
        {attachmentsEnabled && (
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange$={async (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files?.length) {
                await processFiles(Array.from(target.files));
              }
            }}
            accept={props.attachments?.accept ?? "*/*"}
            style={{ display: "none" }}
          />
        )}
        <CopilotChatView
          class={props.class}
          messages={messages.value}
          isRunning={isRunning.value}
          suggestions={autoSuggestions.value}
          onSelectSuggestion$={handleSelectSuggestion}
          onSubmitMessage$={handleSubmitMessage}
          onStop$={isRunning.value && messages.value.length > 0 ? handleStop : undefined}
          inputValue={inputValue.value}
          onInputChange$={handleInputChange}
          attachments={selectedAttachments.value}
          onRemoveAttachment$={attachmentsEnabled ? handleRemoveAttachment : undefined}
          onAddFile$={attachmentsEnabled ? handleAddFile : undefined}
          dragOver={dragOver.value}
          onDragOver$={handleDragOverEvent}
          onDragLeave$={handleDragLeaveEvent}
          onDrop$={handleDropEvent}
        />
      </div>
    </CopilotChatConfigurationProvider>
  );
});
