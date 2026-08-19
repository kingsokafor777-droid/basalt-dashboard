import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  complianceSnapshot,
  controlCoverage,
  dashboardStats,
  executiveSummary,
  findingPage,
  riskTrendSeries,
} from "./analytics";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { loadWarehouseSnapshot } from "./warehouse";

const findingsInput = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
  severity: z.string().optional(),
  scanner: z.string().optional(),
  provider: z.string().optional(),
  status: z.string().optional(),
  search: z.string().max(120).optional(),
  sortBy: z
    .enum([
      "severity",
      "scanner",
      "controlId",
      "resource",
      "status",
      "firstSeen",
      "lastSeen",
    ])
    .default("severity"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    overview: publicProcedure.query(async () =>
      dashboardStats(await loadWarehouseSnapshot())
    ),
    riskTrend: publicProcedure.query(async () =>
      riskTrendSeries(await loadWarehouseSnapshot())
    ),
    controlCoverage: publicProcedure.query(async () =>
      controlCoverage(await loadWarehouseSnapshot())
    ),
    compliance: publicProcedure
      .input(
        z.object({
          provider: z.string().default("all"),
          scanner: z.string().default("all"),
        })
      )
      .query(async ({ input }) =>
        complianceSnapshot(
          await loadWarehouseSnapshot(),
          input.provider,
          input.scanner
        )
      ),
    findings: publicProcedure
      .input(findingsInput)
      .query(async ({ input }) =>
        findingPage(await loadWarehouseSnapshot(), input)
      ),
    executiveSummary: publicProcedure.query(async () =>
      executiveSummary(await loadWarehouseSnapshot())
    ),
  }),
});

export type AppRouter = typeof appRouter;
