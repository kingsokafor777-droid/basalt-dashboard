# Basalt Dashboard Architecture

## Integration boundary

The dashboard is a read-oriented consumer of Basalt Warehouse semantics. Scanner plugins remain responsible for collection and rule evaluation; `basalt-warehouse` remains responsible for durable ingestion and historical modelling. The dashboard converts the normalized read model into user-facing decisions through typed, parameterized tRPC procedures.

The production integration point is deliberately narrow: an authenticated warehouse read API should supply the four relations represented by the dashboard schema. That prevents browser-side access to scanner credentials, raw cloud APIs, or unvalidated ingestion payloads.

## Query model

| Procedure          | Relations read                      | Output use                                      |
| ------------------ | ----------------------------------- | ----------------------------------------------- |
| `overview`         | `finding_observations`, `scan_runs` | KPI cards and severity distribution             |
| `riskTrend`        | `drift_events`                      | 30-day Recharts area trend                      |
| `controlCoverage`  | `controls`                          | Framework coverage chart and register           |
| `compliance`       | `controls`                          | Score gauges and status heatmap                 |
| `findings`         | `finding_observations`, `controls`  | Filterable paginated register and detail drawer |
| `executiveSummary` | All four relations                  | Print/export leadership briefing                |

## Temporal semantics

Finding observations record `firstSeenAt`, `lastSeenAt`, and `observedAt` as UTC timestamps. The user interface formats those instants only at the presentation boundary. Drift events represent a state transition at a point in time and are the only source for the rolling new/resolved/regressed trend; this avoids reconstructing a trend from mutable current-state records.

## Seed design

`server/warehouseSeed.ts` defines a fixed-date portfolio dataset and does not use random generation. It captures representative AWS, Azure, Kubernetes, and Terraform findings, complete and error-marked scan executions, cross-framework controls, and 30 days of drift events. `ensureWarehouseSeeded` guards insertion so an existing warehouse is never overwritten by the local fixture.

## Extension path

To replace the fixture, implement an authenticated ingestion or synchronization job outside the dashboard request path and retain the same relation-level contract. Recalculate derived data in Warehouse, not in the browser, and return only tenant-authorized, minimized records through the typed API surface.
