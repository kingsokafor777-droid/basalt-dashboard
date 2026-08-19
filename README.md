# Basalt Dashboard

**Basalt Dashboard** is the presentation and decision layer for the Basalt security platform. It turns normalized observations, control evaluations, scan runs, and drift events into a dark-themed security posture workspace for operational teams and executive stakeholders.

The application uses a typed React, TypeScript, Express, and tRPC stack with a relational persistence layer. It is designed to consume the normalized contract produced by [`basalt-warehouse`](https://github.com/kingsokafor777-droid/basalt-warehouse), while shipping a deterministic representative dataset for local evaluation and portfolio review.

## Product surface

| View              | Decision supported                                | Warehouse-backed procedure   |
| ----------------- | ------------------------------------------------- | ---------------------------- |
| Overview          | Current exposure and scanner reliability          | `dashboard.overview`         |
| Risk Trends       | New, resolved, and regressed risk over 30 days    | `dashboard.riskTrend`        |
| Control Coverage  | CIS control pass/fail coverage                    | `dashboard.controlCoverage`  |
| Compliance        | Framework scores and control-state heatmap        | `dashboard.compliance`       |
| Findings          | Investigable, filterable observation register     | `dashboard.findings`         |
| Executive Summary | Printable leadership briefing and export artifact | `dashboard.executiveSummary` |

Every dashboard value is queried through tRPC from the persisted warehouse tables. The frontend does not own hardcoded metric, chart, or table values.

## Architecture

```text
Basalt scanners ──native Basalt JSON──> basalt-warehouse
                                         │
                                  normalized warehouse contract
                                         │
                         scan_runs · controls · finding_observations · drift_events
                                         │
                                  typed server aggregates
                                         │
                                      tRPC procedures
                                         │
                             Basalt Dashboard (React + Recharts)
```

The local portfolio dataset is deterministic and deliberately representative of multi-scanner findings from `basalt-aws`, `basalt-azure`, `basalt-k8s`, and `basalt-iac`. It provisions once when an analytics procedure is first queried. The data is not frontend mock state; it is inserted into and read back from the dashboard’s four warehouse tables.

> The seed is a local demonstration fixture, not an assertion about a real customer environment. It must be replaced by an authenticated ingestion path before production use.

## Data model

| Table                  | Purpose                                   | Key characteristics                                                         |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `scan_runs`            | Completed scanner executions              | Scanner identity, scope, timestamps, checks, findings, and errors           |
| `controls`             | Control catalogue and current state       | Framework, provider, default severity, pass/fail state                      |
| `finding_observations` | Normalized immutable finding observations | Fingerprint, risk, status, resource, remediation, and first/last-seen times |
| `drift_events`         | State changes between scans               | New, resolved, and regressed events for time-series analysis                |

The schema preserves the essential vocabulary established by Basalt Warehouse: scanner/provider identity, a stable fingerprint, control identifiers, severity, current finding state, resource identity, and observation timestamps.

## Development

### Prerequisites

Use Node.js 22 or later and pnpm 10 or later. The managed project provides the database connection and application environment.

```bash
pnpm install
pnpm drizzle-kit generate
pnpm check
pnpm test
pnpm build
```

After a new schema migration is generated, review the resulting SQL and apply it through the managed database migration workflow before running the application. The first successful dashboard request initializes the local representative warehouse dataset.

## Quality controls

The project includes strict TypeScript checking, Vitest coverage for the security analytics contracts, a production client/server build, relational foreign keys, indexes supporting the dashboard query patterns, typed tRPC input validation, and visual verification of all six routes.

## Design system

Basalt uses a dark navy control-room surface with cyan reserved for trusted operational signal. **Severity colors are semantic and fixed:** critical is red, high is orange, medium is yellow, and low is blue. All charts are Recharts components and all data views inherit the same warehouse-backed source of truth.

## Security boundary

This repository intentionally ships no cloud credentials and makes no cloud API calls. In a production deployment, connect the dashboard only to an authenticated warehouse API or read model with tenant isolation, audit logging, and least-privilege access.

## License

This project is licensed under the Apache License 2.0. See [`LICENSE`](./LICENSE).
