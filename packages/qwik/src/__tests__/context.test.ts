import { describe, it, expect } from "vitest";
import { CopilotKitContextId } from "../context/copilot-context";

describe("CopilotKitContextId", () => {
  it("should be defined", () => {
    expect(CopilotKitContextId).toBeDefined();
  });

  it("should have the expected context ID string", () => {
    // Qwik context IDs are objects with an `id` property
    expect((CopilotKitContextId as any).id).toBe("copilotkit.context");
  });
});
