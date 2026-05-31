import { describe, it, expect } from "vitest";

import { storesSchema, workspaceSchema } from "@/lib/schema";

import storesData from "@/data/stores.json";
import workspaceData from "@/data/workspace.json";

describe("data/*.json schema validation", () => {
  it("data/stores.json は storesSchema を満たす", () => {
    const result = storesSchema.safeParse(storesData);
    expect(result.success).toBe(true);
  });

  it("data/workspace.json は workspaceSchema を満たす", () => {
    const result = workspaceSchema.safeParse(workspaceData);
    expect(result.success).toBe(true);
  });
});

describe("schema rejects invalid data", () => {
  it("storesSchema は配列を期待する", () => {
    expect(storesSchema.safeParse({}).success).toBe(false);
    expect(storesSchema.safeParse(null).success).toBe(false);
  });

  it("store は status が StoreStatusKey でないと不可", () => {
    expect(
      storesSchema.safeParse([
        {
          id: "x",
          status: "unknown-status",
          profile: {},
          tasks: [],
        },
      ]).success,
    ).toBe(false);
  });

  it("workspaceSchema は name と icon を要求する", () => {
    expect(workspaceSchema.safeParse({ name: "" }).success).toBe(false);
    expect(workspaceSchema.safeParse({ icon: "" }).success).toBe(false);
  });
});
