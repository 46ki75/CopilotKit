import { useSignal } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import {
  randomUUID,
  getModalityFromMimeType,
  exceedsMaxSize,
  readFileAsBase64,
  matchesAcceptFilter,
  formatFileSize,
} from "@copilotkit/shared";
import type { Attachment, AttachmentsConfig } from "@copilotkit/shared";

/**
 * Options for the useAttachments hook.
 */
export interface UseAttachmentsProps {
  config?: AttachmentsConfig;
}

/**
 * Return value from the useAttachments hook.
 */
export interface UseAttachmentsReturn {
  /** Currently selected attachments (uploading + ready). */
  attachments: Signal<Attachment[]>;
  /** Whether attachments are enabled. */
  enabled: boolean;
  /** Whether the user is dragging a file over the drop zone. */
  dragOver: Signal<boolean>;
  /** Process an array of files (validate, upload, add to state). */
  processFiles: (files: File[]) => Promise<void>;
  /** Remove an attachment by ID. */
  removeAttachment: (id: string) => void;
  /**
   * Consume ready attachments and clear the queue.
   * Returns the attachments that were ready.
   */
  consumeAttachments: () => Attachment[];
  /**
   * Handle file input change events. Pass this as the handler for
   * an `<input type="file">` element's `onChange$` event.
   */
  handleFileInputChange: (target: HTMLInputElement) => Promise<void>;
  /**
   * Handle drag over events on a drop zone element.
   */
  handleDragOver: (e: DragEvent) => void;
  /**
   * Handle drag leave events on a drop zone element.
   */
  handleDragLeave: (e: DragEvent) => void;
  /**
   * Handle drop events on a drop zone element.
   */
  handleDrop: (e: DragEvent) => Promise<void>;
}

/**
 * Hook that manages file attachment state — uploads, drag-and-drop, and
 * lifecycle. This is the Qwik equivalent of the React `useAttachments`
 * hook from `@copilotkit/react-core`.
 *
 * All attachment state is exposed as reactive Qwik signals. File processing
 * callbacks are plain functions that can be called from Qwik event handlers.
 *
 * ## Usage
 *
 * ```tsx
 * import { component$ } from "@builder.io/qwik";
 * import { useAttachments } from "@cloud.ikuma/copilotkit-qwik";
 *
 * export const FileUpload = component$(() => {
 *   const {
 *     attachments,
 *     enabled,
 *     processFiles,
 *     removeAttachment,
 *     consumeAttachments,
 *   } = useAttachments({ config: { enabled: true } });
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         onChange$={(e) => {
 *           const input = e.target as HTMLInputElement;
 *           if (input.files?.length) {
 *             processFiles(Array.from(input.files));
 *           }
 *         }}
 *       />
 *       <ul>
 *         {attachments.value.map((att) => (
 *           <li key={att.id}>
 *             {att.filename} ({att.status})
 *             <button onClick$={() => removeAttachment(att.id)}>Remove</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * });
 * ```
 */
export function useAttachments({
  config,
}: UseAttachmentsProps): UseAttachmentsReturn {
  const enabled = config?.enabled ?? false;

  const attachmentsSig = useSignal<Attachment[]>([]);
  const dragOverSig = useSignal(false);

  const processFiles = async (files: File[]) => {
    const accept = config?.accept ?? "*/*";
    const maxSize = config?.maxSize ?? 20 * 1024 * 1024;

    const rejectedFiles = files.filter(
      (file) => !matchesAcceptFilter(file, accept),
    );
    for (const file of rejectedFiles) {
      config?.onUploadFailed?.({
        reason: "invalid-type",
        file,
        message: `File "${file.name}" is not accepted. Supported types: ${accept}`,
      });
    }

    const validFiles = files.filter((file) =>
      matchesAcceptFilter(file, accept),
    );

    for (const file of validFiles) {
      if (exceedsMaxSize(file, maxSize)) {
        config?.onUploadFailed?.({
          reason: "file-too-large",
          file,
          message: `File "${file.name}" exceeds the maximum size of ${formatFileSize(maxSize)}`,
        });
        continue;
      }

      const modality = getModalityFromMimeType(file.type);
      const placeholderId = randomUUID();
      const placeholder: Attachment = {
        id: placeholderId,
        type: modality,
        source: { type: "data", value: "", mimeType: file.type },
        filename: file.name,
        size: file.size,
        status: "uploading",
      };

      attachmentsSig.value = [...attachmentsSig.value, placeholder];

      try {
        let source: Attachment["source"];
        let uploadMetadata: Record<string, unknown> | undefined;

        if (config?.onUpload) {
          const { metadata: meta, ...uploadSource } =
            await config.onUpload(file);
          source = uploadSource;
          uploadMetadata = meta;
        } else {
          const base64 = await readFileAsBase64(file);
          source = { type: "data", value: base64, mimeType: file.type };
        }

        attachmentsSig.value = attachmentsSig.value.map((att) =>
          att.id === placeholderId
            ? {
                ...att,
                source,
                status: "ready" as const,
                metadata: uploadMetadata,
              }
            : att,
        );
      } catch (error) {
        attachmentsSig.value = attachmentsSig.value.filter(
          (att) => att.id !== placeholderId,
        );
        console.error(`[CopilotKit] Failed to upload "${file.name}":`, error);
        config?.onUploadFailed?.({
          reason: "upload-failed",
          file,
          message:
            error instanceof Error
              ? error.message
              : `Failed to upload "${file.name}"`,
        });
      }
    }
  };

  const handleFileInputChange = async (target: HTMLInputElement) => {
    if (!target.files?.length) return;
    try {
      await processFiles(Array.from(target.files));
    } catch (error) {
      console.error("[CopilotKit] Upload error:", error);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    dragOverSig.value = true;
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverSig.value = false;
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverSig.value = false;
    if (!enabled) return;

    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) {
      try {
        await processFiles(files);
      } catch (error) {
        console.error("[CopilotKit] Drop error:", error);
      }
    }
  };

  const removeAttachment = (id: string) => {
    attachmentsSig.value = attachmentsSig.value.filter((a) => a.id !== id);
  };

  const consumeAttachments = () => {
    const ready = attachmentsSig.value.filter((a) => a.status === "ready");
    if (ready.length === 0) return ready;
    attachmentsSig.value = attachmentsSig.value.filter(
      (a) => a.status !== "ready",
    );
    return ready;
  };

  return {
    attachments: attachmentsSig,
    enabled,
    dragOver: dragOverSig,
    processFiles,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeAttachment,
    consumeAttachments,
  };
}
