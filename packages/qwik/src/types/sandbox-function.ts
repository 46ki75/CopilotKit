import type { StandardSchemaV1 } from "@copilotkit/shared";

export type SandboxFunction<
  TParams extends StandardSchemaV1 = StandardSchemaV1,
> = {
  name: string;
  description: string;
  parameters: TParams;
  handler: (args: any) => Promise<unknown>;
};
