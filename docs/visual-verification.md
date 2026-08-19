# Visual Verification Notes

The Basalt Overview, Control Coverage, Compliance, Findings, and Executive Summary routes were rendered against the seeded warehouse database on 2026-08-19. The persistent sidebar, dark navy visual system, strict severity palette, data-driven KPI cards, framework register, compliance heatmap, filters, and executive layout all rendered with populated warehouse records.

The design deliberately uses cyan only as the operational signal color and reserves red, orange, yellow, and blue for the four severity semantics. A follow-up validation pass will confirm chart rendering after the production build and apply any necessary Recharts presentation adjustments before delivery.

The Compliance route was rechecked after the scanner-filter addition. It presents independent **All providers** and **All scanners** selectors; the scanner selector exposes Basalt AWS, Basalt Azure, Basalt K8s, and Basalt IaC. Type and analytics test validation for that persisted-data filter passed before this interaction check.

The final desktop verification confirmed that the Risk Trends area chart renders all three populated drift series, the default Compliance view renders both filters and the complete heatmap, the Findings table renders populated paginated observations, and the Executive Summary renders a calibrated posture score, sparkline, printable report structure, and five ranked critical findings. The Basalt K8s filter interaction was also confirmed to restrict the heatmap to five Kubernetes controls; zero-observation framework cards are now explicitly rendered as no-data states.

Compact viewport checks at 390 × 844 confirmed that metrics stack cleanly, the donut distribution and executive report remain readable, and the previously missing mobile navigation is now restored through a persistent Basalt header and drawer trigger.

After the navigation-shell correction, all six routes were rechecked at 390 × 844: Overview, Risk Trends, Control Coverage, Compliance, Findings, and Executive Summary. Each route retained the mobile Basalt header and menu trigger, while page content began below the header without overlap. The mobile layouts preserve their primary KPI, chart, filter, table/register, or executive-report content at the viewport entry point.

The compact header is wired to the template's shared `SidebarTrigger`, which controls the same mobile sheet navigation used by the six-route shell. A live workspace transition from Overview to Risk Trends was also confirmed after the navigation correction; the route remained populated with warehouse-backed drift data.
