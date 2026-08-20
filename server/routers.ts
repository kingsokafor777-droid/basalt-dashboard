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
import { tenantProcedure } from "./tenant";
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
    overview: tenantProcedure.query(async ({ ctx }) =>
      dashboardStats(await loadWarehouseSnapshot(ctx.tenant.organizationId))
    ),
    riskTrend: tenantProcedure.query(async ({ ctx }) =>
      riskTrendSeries(await loadWarehouseSnapshot(ctx.tenant.organizationId))
    ),
    controlCoverage: tenantProcedure.query(async ({ ctx }) =>
      controlCoverage(await loadWarehouseSnapshot(ctx.tenant.organizationId))
    ),
    compliance: tenantProcedure
      .input(
        z.object({
          provider: z.string().default("all"),
          scanner: z.string().default("all"),
        })
      )
      .query(async ({ ctx, input }) =>
        complianceSnapshot(
          await loadWarehouseSnapshot(ctx.tenant.organizationId),
          input.provider,
          input.scanner
        )
      ),
    findings: tenantProcedure
      .input(findingsInput)
      .query(async ({ ctx, input }) =>
        findingPage(
          await loadWarehouseSnapshot(ctx.tenant.organizationId),
          input
        )
      ),
    executiveSummary: tenantProcedure.query(async ({ ctx }) =>
      executiveSummary(await loadWarehouseSnapshot(ctx.tenant.organizationId))
    ),
  }),
});

export type AppRouter = typeof appRouter;
