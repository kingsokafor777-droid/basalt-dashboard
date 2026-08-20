import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("dashboard authorization boundary", () => {
  it("rejects unauthenticated analytics access before any warehouse read", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());

    await expect(caller.dashboard.overview()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
