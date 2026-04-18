import { component$, useSignal, $ } from "@builder.io/qwik";

export type AudioRecorderState = "idle" | "recording" | "processing";

export interface CopilotChatAudioRecorderProps {
  class?: string;
  onRecordingComplete$?: (audioBlob: Blob) => Promise<void>;
}

// Module-level weak storage for MediaRecorder references (avoids polluting window)
const recorderMap = new WeakMap<object, MediaRecorder>();
const recorderKey = {};

export const CopilotChatAudioRecorder = component$<CopilotChatAudioRecorderProps>(
  (props) => {
    const recorderState = useSignal<AudioRecorderState>("idle");

    const handleClick = $(async () => {
      if (recorderState.value === "idle") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          const chunks: Blob[] = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
            recorderMap.delete(recorderKey);
            recorderState.value = "processing";
            try {
              await props.onRecordingComplete$?.(blob);
            } finally {
              recorderState.value = "idle";
            }
          };

          mediaRecorder.start();
          recorderState.value = "recording";
          recorderMap.set(recorderKey, mediaRecorder);
        } catch {
          recorderState.value = "idle";
        }
      } else if (recorderState.value === "recording") {
        const recorder = recorderMap.get(recorderKey);
        if (recorder && recorder.state !== "inactive") {
          recorder.stop();
        }
        recorderMap.delete(recorderKey);
      }
    });

    const isRecording = recorderState.value === "recording";
    const isProcessing = recorderState.value === "processing";

    return (
      <button
        type="button"
        class={props.class ?? ""}
        onClick$={handleClick}
        disabled={isProcessing}
        title={isRecording ? "Stop recording" : isProcessing ? "Processing..." : "Start recording"}
        style={{
          background: "none",
          border: "none",
          cursor: isProcessing ? "not-allowed" : "pointer",
          padding: "4px",
          borderRadius: "4px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: isRecording ? "#ef4444" : "#666",
        }}
      >
        {isProcessing ? (
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #666",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "cpk-spin 0.6s linear infinite",
            }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
            {isRecording && <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2" fill="none" />}
          </svg>
        )}
      </button>
    );
  },
);
