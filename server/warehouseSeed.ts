/**
 * Deterministic, representative Basalt warehouse data used for product evaluation and local demos.
 * The UI never imports these records directly; the seed is persisted then queried through tRPC.
 */
export type Severity = "critical" | "high" | "medium" | "low";
export type Framework = "cis-aws" | "cis-azure" | "cis-k8s";
export type FindingStatus = "open" | "resolved";
export type DriftEventType = "new" | "resolved" | "regressed";

export type SeedControl = {
  id: string;
  framework: Framework;
  provider: string;
  title: string;
  description: string;
  defaultSeverity: Severity;
  currentStatus: "pass" | "fail";
  lastEvaluatedAt: Date;
};

export type SeedScanRun = {
  id: string;
  scanner: string;
  scannerVersion: string;
  provider: string;
  scopeKey: string;
  status: "complete" | "completed_with_errors";
  startedAt: Date;
  completedAt: Date;
  checksRun: number;
  findingCount: number;
  errorCount: number;
};

export type SeedFinding = {
  id: string;
  scanId: string;
  fingerprint: string;
  controlId: string;
  scanner: string;
  provider: string;
  severity: Severity;
  riskScore: number;
  status: FindingStatus;
  title: string;
  description: string;
  resourceUrn: string;
  resourceName: string;
  resourceType: string;
  account: string;
  region: string;
  remediation: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  observedAt: Date;
};

export type SeedDriftEvent = {
  id: string;
  scanId: string;
  findingFingerprint: string;
  controlId: string;
  scanner: string;
  provider: string;
  severity: Severity;
  eventType: DriftEventType;
  occurredAt: Date;
};

export type WarehouseSeed = {
  scanRuns: SeedScanRun[];
  controls: SeedControl[];
  findingObservations: SeedFinding[];
  driftEvents: SeedDriftEvent[];
};

const ANCHOR = new Date("2026-08-19T12:00:00.000Z");
const SCANNERS = [
  {
    scanner: "basalt-aws",
    provider: "aws",
    scope: "org:acme-production",
    version: "0.1.1",
  },
  {
    scanner: "basalt-azure",
    provider: "azure",
    scope: "tenant:contoso-security",
    version: "0.1.0",
  },
  {
    scanner: "basalt-k8s",
    provider: "kubernetes",
    scope: "cluster:prod-west-01",
    version: "0.1.0",
  },
  {
    scanner: "basalt-iac",
    provider: "iac",
    scope: "repo:platform-infra",
    version: "0.1.0",
  },
] as const;

function daysBefore(anchor: Date, days: number, hour = 9): Date {
  const result = new Date(anchor);
  result.setUTCDate(result.getUTCDate() - days);
  result.setUTCHours(hour, 0, 0, 0);
  return result;
}

function scanId(dayOffset: number, scannerIndex: number): string {
  return `scan-${dayOffset.toString().padStart(2, "0")}-${SCANNERS[scannerIndex].scanner}`;
}

const CONTROL_ROWS: Omit<SeedControl, "lastEvaluatedAt">[] = [
  {
    id: "cis-aws-1.2",
    framework: "cis-aws",
    provider: "aws",
    title: "Root user MFA is enabled",
    description: "The root account requires multi-factor authentication.",
    defaultSeverity: "critical",
    currentStatus: "fail",
  },
  {
    id: "cis-aws-2.1.1",
    framework: "cis-aws",
    provider: "aws",
    title: "S3 public access is blocked",
    description: "S3 account and bucket public access blocks are enabled.",
    defaultSeverity: "critical",
    currentStatus: "fail",
  },
  {
    id: "cis-aws-2.1.2",
    framework: "cis-aws",
    provider: "aws",
    title: "S3 default encryption is enabled",
    description: "S3 buckets use server-side encryption by default.",
    defaultSeverity: "medium",
    currentStatus: "fail",
  },
  {
    id: "cis-aws-3.1",
    framework: "cis-aws",
    provider: "aws",
    title: "CloudTrail is enabled in all regions",
    description:
      "CloudTrail records management events throughout the organization.",
    defaultSeverity: "medium",
    currentStatus: "fail",
  },
  {
    id: "cis-aws-4.1",
    framework: "cis-aws",
    provider: "aws",
    title: "Security groups restrict administration",
    description:
      "Administrative ports are not broadly accessible from the internet.",
    defaultSeverity: "high",
    currentStatus: "fail",
  },
  {
    id: "cis-aws-5.1",
    framework: "cis-aws",
    provider: "aws",
    title: "VPC Flow Logs are enabled",
    description: "Network telemetry is recorded for all production VPCs.",
    defaultSeverity: "low",
    currentStatus: "pass",
  },
  {
    id: "cis-azure-3.1",
    framework: "cis-azure",
    provider: "azure",
    title: "Secure transfer is required for storage",
    description: "Storage accounts require secure transfer.",
    defaultSeverity: "high",
    currentStatus: "fail",
  },
  {
    id: "cis-azure-3.2",
    framework: "cis-azure",
    provider: "azure",
    title: "Public blob access is disabled",
    description: "Anonymous blob access is disabled across storage accounts.",
    defaultSeverity: "critical",
    currentStatus: "fail",
  },
  {
    id: "cis-azure-3.4",
    framework: "cis-azure",
    provider: "azure",
    title: "Storage uses TLS 1.2 or later",
    description: "Storage transport requires TLS 1.2 or higher.",
    defaultSeverity: "medium",
    currentStatus: "fail",
  },
  {
    id: "cis-azure-4.1",
    framework: "cis-azure",
    provider: "azure",
    title: "Activity Log diagnostics are retained",
    description:
      "Subscription activity logs are exported to a central destination.",
    defaultSeverity: "medium",
    currentStatus: "fail",
  },
  {
    id: "cis-azure-5.1",
    framework: "cis-azure",
    provider: "azure",
    title: "Defender plans are enabled",
    description: "Defender for Cloud plans protect production workloads.",
    defaultSeverity: "medium",
    currentStatus: "pass",
  },
  {
    id: "cis-azure-6.1",
    framework: "cis-azure",
    provider: "azure",
    title: "Key Vault purge protection is enabled",
    description: "Deleted secrets are protected from irreversible removal.",
    defaultSeverity: "high",
    currentStatus: "pass",
  },
  {
    id: "cis-k8s-5.1.1",
    framework: "cis-k8s",
    provider: "kubernetes",
    title: "Cluster-admin bindings are restricted",
    description: "Cluster-admin is not bound to non-administrative subjects.",
    defaultSeverity: "critical",
    currentStatus: "fail",
  },
  {
    id: "cis-k8s-5.2.1",
    framework: "cis-k8s",
    provider: "kubernetes",
    title: "Privileged containers are disallowed",
    description: "Workloads do not request privileged execution.",
    defaultSeverity: "critical",
    currentStatus: "fail",
  },
  {
    id: "cis-k8s-5.2.3",
    framework: "cis-k8s",
    provider: "kubernetes",
    title: "Host network access is restricted",
    description: "Pods do not use the host network namespace.",
    defaultSeverity: "high",
    currentStatus: "fail",
  },
  {
    id: "cis-k8s-5.7.3",
    framework: "cis-k8s",
    provider: "kubernetes",
    title: "Network policies isolate workloads",
    description:
      "Namespaces with sensitive services have a default-deny network policy.",
    defaultSeverity: "high",
    currentStatus: "fail",
  },
  {
    id: "cis-k8s-5.1.5",
    framework: "cis-k8s",
    provider: "kubernetes",
    title: "Service account tokens are minimized",
    description:
      "Pods do not automount service-account tokens unless required.",
    defaultSeverity: "medium",
    currentStatus: "fail",
  },
  {
    id: "cis-k8s-5.2.8",
    framework: "cis-k8s",
    provider: "kubernetes",
    title: "Resource limits are configured",
    description: "Production containers declare CPU and memory limits.",
    defaultSeverity: "low",
    currentStatus: "pass",
  },
];

type FindingDefinition = Omit<
  SeedFinding,
  "id" | "scanId" | "firstSeenAt" | "lastSeenAt" | "observedAt"
> & {
  ageDays: number;
};

const FINDINGS: FindingDefinition[] = [
  {
    fingerprint: "aws-root-mfa-prod",
    controlId: "cis-aws-1.2",
    scanner: "basalt-aws",
    provider: "aws",
    severity: "critical",
    riskScore: 98,
    status: "open",
    title: "Root account MFA is disabled",
    description:
      "The organization root user has no hardware or virtual MFA device.",
    resourceUrn: "arn:aws:iam::671245901321:root",
    resourceName: "production-root",
    resourceType: "AWS::IAM::RootUser",
    account: "671245901321",
    region: "global",
    remediation:
      "Enable a phishing-resistant MFA device for the root account and remove unused access keys.",
    ageDays: 29,
  },
  {
    fingerprint: "aws-public-artifacts",
    controlId: "cis-aws-2.1.1",
    scanner: "basalt-aws",
    provider: "aws",
    severity: "critical",
    riskScore: 94,
    status: "open",
    title: "Public access block is disabled on artifacts bucket",
    description:
      "A production artifact bucket permits public ACLs and policies.",
    resourceUrn: "arn:aws:s3:::payments-artifacts-prod",
    resourceName: "payments-artifacts-prod",
    resourceType: "AWS::S3::Bucket",
    account: "671245901321",
    region: "us-east-1",
    remediation:
      "Enable all four S3 public-access block settings and remove public policies.",
    ageDays: 24,
  },
  {
    fingerprint: "aws-ssh-world",
    controlId: "cis-aws-4.1",
    scanner: "basalt-aws",
    provider: "aws",
    severity: "high",
    riskScore: 89,
    status: "open",
    title: "Security group exposes SSH to the internet",
    description: "A production security group permits TCP/22 from 0.0.0.0/0.",
    resourceUrn: "arn:aws:ec2:us-east-1:671245901321:security-group/sg-0128a9",
    resourceName: "bastion-ingress",
    resourceType: "AWS::EC2::SecurityGroup",
    account: "671245901321",
    region: "us-east-1",
    remediation:
      "Restrict SSH to the approved bastion CIDR or use Session Manager.",
    ageDays: 21,
  },
  {
    fingerprint: "aws-encryption-audit",
    controlId: "cis-aws-2.1.2",
    scanner: "basalt-aws",
    provider: "aws",
    severity: "medium",
    riskScore: 63,
    status: "open",
    title: "Audit bucket lacks default encryption",
    description:
      "Audit archive uploads are not encrypted by a bucket-default policy.",
    resourceUrn: "arn:aws:s3:::acme-audit-archive",
    resourceName: "acme-audit-archive",
    resourceType: "AWS::S3::Bucket",
    account: "671245901321",
    region: "us-east-2",
    remediation:
      "Set default SSE-KMS encryption and a bucket policy denying unencrypted writes.",
    ageDays: 18,
  },
  {
    fingerprint: "aws-cloudtrail-west",
    controlId: "cis-aws-3.1",
    scanner: "basalt-aws",
    provider: "aws",
    severity: "medium",
    riskScore: 58,
    status: "resolved",
    title: "CloudTrail missing from secondary region",
    description: "A regional trail was not logging management events.",
    resourceUrn:
      "arn:aws:cloudtrail:us-west-2:671245901321:trail/acme-org-trail",
    resourceName: "acme-org-trail",
    resourceType: "AWS::CloudTrail::Trail",
    account: "671245901321",
    region: "us-west-2",
    remediation:
      "Use an organization trail configured for all current and future regions.",
    ageDays: 17,
  },
  {
    fingerprint: "azure-public-blob",
    controlId: "cis-azure-3.2",
    scanner: "basalt-azure",
    provider: "azure",
    severity: "critical",
    riskScore: 96,
    status: "open",
    title: "Public blob access is enabled",
    description:
      "The customer-export storage account permits anonymous blob reads.",
    resourceUrn:
      "/subscriptions/8b33/resourceGroups/rg-data-prod/providers/Microsoft.Storage/storageAccounts/customerexportprod",
    resourceName: "customerexportprod",
    resourceType: "Microsoft.Storage/storageAccounts",
    account: "8b33",
    region: "eastus",
    remediation:
      "Set allowBlobPublicAccess to false and review container ACLs for anonymous access.",
    ageDays: 27,
  },
  {
    fingerprint: "azure-insecure-transfer",
    controlId: "cis-azure-3.1",
    scanner: "basalt-azure",
    provider: "azure",
    severity: "high",
    riskScore: 84,
    status: "open",
    title: "Secure transfer is not required",
    description:
      "A storage account accepts connections without HTTPS enforcement.",
    resourceUrn:
      "/subscriptions/8b33/resourceGroups/rg-ops-prod/providers/Microsoft.Storage/storageAccounts/opsdiagstore",
    resourceName: "opsdiagstore",
    resourceType: "Microsoft.Storage/storageAccounts",
    account: "8b33",
    region: "westus2",
    remediation:
      "Enable secure transfer required and enforce TLS in dependent clients.",
    ageDays: 22,
  },
  {
    fingerprint: "azure-tls-legacy",
    controlId: "cis-azure-3.4",
    scanner: "basalt-azure",
    provider: "azure",
    severity: "medium",
    riskScore: 61,
    status: "open",
    title: "Storage account permits legacy TLS",
    description: "The minimum TLS version is configured below TLS 1.2.",
    resourceUrn:
      "/subscriptions/8b33/resourceGroups/rg-ops-prod/providers/Microsoft.Storage/storageAccounts/opsdiagstore",
    resourceName: "opsdiagstore",
    resourceType: "Microsoft.Storage/storageAccounts",
    account: "8b33",
    region: "westus2",
    remediation:
      "Set minimumTlsVersion to TLS1_2 and validate dependent client compatibility.",
    ageDays: 19,
  },
  {
    fingerprint: "azure-activity-diagnostics",
    controlId: "cis-azure-4.1",
    scanner: "basalt-azure",
    provider: "azure",
    severity: "medium",
    riskScore: 55,
    status: "resolved",
    title: "Subscription Activity Log export was missing",
    description:
      "Activity Log diagnostics did not stream to the central SIEM workspace.",
    resourceUrn:
      "/subscriptions/8b33/providers/Microsoft.Insights/diagnosticSettings/activity-log",
    resourceName: "activity-log",
    resourceType: "Microsoft.Insights/diagnosticSettings",
    account: "8b33",
    region: "global",
    remediation:
      "Deploy an Activity Log diagnostic setting to the approved Log Analytics workspace.",
    ageDays: 14,
  },
  {
    fingerprint: "k8s-cluster-admin",
    controlId: "cis-k8s-5.1.1",
    scanner: "basalt-k8s",
    provider: "kubernetes",
    severity: "critical",
    riskScore: 97,
    status: "open",
    title: "Cluster-admin is bound to an application service account",
    description:
      "The payments API service account has unrestricted cluster-wide permissions.",
    resourceUrn: "k8s://prod-west-01/ClusterRoleBinding/payments-admin",
    resourceName: "payments-admin",
    resourceType: "rbac.authorization.k8s.io/ClusterRoleBinding",
    account: "prod-west-01",
    region: "us-west-2",
    remediation:
      "Replace the binding with namespace-scoped least-privilege roles.",
    ageDays: 25,
  },
  {
    fingerprint: "k8s-privileged-agent",
    controlId: "cis-k8s-5.2.1",
    scanner: "basalt-k8s",
    provider: "kubernetes",
    severity: "critical",
    riskScore: 93,
    status: "open",
    title: "Privileged container runs in production",
    description:
      "A telemetry DaemonSet requests privileged Linux capabilities.",
    resourceUrn: "k8s://prod-west-01/DaemonSet/observability/node-agent",
    resourceName: "node-agent",
    resourceType: "apps/v1/DaemonSet",
    account: "prod-west-01",
    region: "us-west-2",
    remediation:
      "Remove privileged mode and grant only the capabilities required by the workload.",
    ageDays: 20,
  },
  {
    fingerprint: "k8s-host-network",
    controlId: "cis-k8s-5.2.3",
    scanner: "basalt-k8s",
    provider: "kubernetes",
    severity: "high",
    riskScore: 82,
    status: "open",
    title: "Pod uses the host network namespace",
    description: "The checkout deployment runs with hostNetwork enabled.",
    resourceUrn: "k8s://prod-west-01/Deployment/checkout/checkout-api",
    resourceName: "checkout-api",
    resourceType: "apps/v1/Deployment",
    account: "prod-west-01",
    region: "us-west-2",
    remediation:
      "Disable hostNetwork and expose required ports through a Kubernetes Service.",
    ageDays: 16,
  },
  {
    fingerprint: "k8s-default-deny",
    controlId: "cis-k8s-5.7.3",
    scanner: "basalt-k8s",
    provider: "kubernetes",
    severity: "high",
    riskScore: 78,
    status: "open",
    title: "Sensitive namespace has no default-deny policy",
    description:
      "The payments namespace lacks an ingress and egress baseline policy.",
    resourceUrn: "k8s://prod-west-01/Namespace/payments",
    resourceName: "payments",
    resourceType: "v1/Namespace",
    account: "prod-west-01",
    region: "us-west-2",
    remediation:
      "Create default-deny ingress and egress NetworkPolicies then allow documented flows.",
    ageDays: 13,
  },
  {
    fingerprint: "k8s-token-automount",
    controlId: "cis-k8s-5.1.5",
    scanner: "basalt-k8s",
    provider: "kubernetes",
    severity: "medium",
    riskScore: 57,
    status: "resolved",
    title: "Service account token automount was enabled",
    description: "A batch workload received an unused service account token.",
    resourceUrn: "k8s://prod-west-01/Job/reporting/monthly-close",
    resourceName: "monthly-close",
    resourceType: "batch/v1/Job",
    account: "prod-west-01",
    region: "us-west-2",
    remediation:
      "Set automountServiceAccountToken to false for workloads that do not call the API server.",
    ageDays: 11,
  },
  {
    fingerprint: "iac-ssh-cidr",
    controlId: "cis-aws-4.1",
    scanner: "basalt-iac",
    provider: "iac",
    severity: "high",
    riskScore: 87,
    status: "open",
    title: "Terraform rule exposes SSH to 0.0.0.0/0",
    description:
      "A planned security group resource allows unrestricted SSH ingress.",
    resourceUrn:
      "git://platform-infra/modules/network/main.tf#aws_security_group.bastion",
    resourceName: "aws_security_group.bastion",
    resourceType: "terraform/aws_security_group",
    account: "platform-infra",
    region: "source",
    remediation:
      "Constrain cidr_blocks to the approved administration network before merging.",
    ageDays: 9,
  },
  {
    fingerprint: "iac-s3-public-acl",
    controlId: "cis-aws-2.1.1",
    scanner: "basalt-iac",
    provider: "iac",
    severity: "low",
    riskScore: 38,
    status: "resolved",
    title: "Terraform bucket ACL was public-read",
    description:
      "A module definition declared a public-read ACL for a non-public bucket.",
    resourceUrn:
      "git://platform-infra/modules/data/main.tf#aws_s3_bucket_acl.archive",
    resourceName: "aws_s3_bucket_acl.archive",
    resourceType: "terraform/aws_s3_bucket_acl",
    account: "platform-infra",
    region: "source",
    remediation:
      "Use private ACLs and explicit, least-privilege bucket policies.",
    ageDays: 7,
  },
];

export function buildWarehouseSeed(anchor = ANCHOR): WarehouseSeed {
  const controls: SeedControl[] = CONTROL_ROWS.map(control => ({
    ...control,
    lastEvaluatedAt: daysBefore(anchor, 0, 11),
  }));

  const scanRuns: SeedScanRun[] = [];
  for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
    SCANNERS.forEach((definition, scannerIndex) => {
      const startedAt = daysBefore(anchor, 29 - dayOffset, 4 + scannerIndex);
      const completedAt = new Date(
        startedAt.getTime() + (7 + scannerIndex * 2) * 60_000
      );
      const status: SeedScanRun["status"] =
        dayOffset === 8 && scannerIndex === 1
          ? "completed_with_errors"
          : "complete";
      scanRuns.push({
        id: scanId(dayOffset, scannerIndex),
        scanner: definition.scanner,
        scannerVersion: definition.version,
        provider: definition.provider,
        scopeKey: definition.scope,
        status,
        startedAt,
        completedAt,
        checksRun: 18 + scannerIndex * 7,
        findingCount: 4 + ((dayOffset + scannerIndex * 3) % 9),
        errorCount: dayOffset === 8 && scannerIndex === 1 ? 1 : 0,
      });
    });
  }

  const findingObservations: SeedFinding[] = FINDINGS.map((finding, index) => {
    const scannerIndex = SCANNERS.findIndex(
      item => item.scanner === finding.scanner
    );
    const ageDays = finding.ageDays;
    const observedDay = Math.min(29, Math.max(0, ageDays - 1));
    const observedAt = daysBefore(anchor, 29 - observedDay, 10 + (index % 4));
    const lastSeenAt =
      finding.status === "resolved"
        ? daysBefore(anchor, Math.max(1, ageDays - 5), 10)
        : observedAt;
    return {
      ...finding,
      id: `finding-${(index + 1).toString().padStart(2, "0")}`,
      scanId: scanId(observedDay, scannerIndex),
      firstSeenAt: daysBefore(anchor, ageDays, 8),
      lastSeenAt,
      observedAt,
    };
  });

  const newPattern = [
    2, 1, 1, 3, 2, 1, 0, 2, 2, 1, 3, 2, 1, 2, 0, 1, 2, 3, 1, 2, 1, 0, 2, 1, 3,
    1, 2, 2, 1, 2,
  ];
  const resolvedPattern = [
    0, 1, 1, 0, 1, 2, 1, 1, 0, 2, 1, 0, 2, 1, 1, 2, 0, 1, 2, 1, 0, 2, 1, 1, 2,
    1, 1, 2, 1, 2,
  ];
  const regressedPattern = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0,
    1, 0, 0, 1, 0,
  ];
  const driftEvents: SeedDriftEvent[] = [];
  const severityCycle: Severity[] = ["high", "medium", "critical", "low"];
  const eventSpecs: Array<{ type: DriftEventType; values: number[] }> = [
    { type: "new", values: newPattern },
    { type: "resolved", values: resolvedPattern },
    { type: "regressed", values: regressedPattern },
  ];

  for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
    for (const eventSpec of eventSpecs) {
      for (
        let occurrence = 0;
        occurrence < eventSpec.values[dayOffset];
        occurrence += 1
      ) {
        const finding =
          FINDINGS[
            (dayOffset * 3 + occurrence + eventSpec.type.length) %
              FINDINGS.length
          ];
        const scannerIndex = SCANNERS.findIndex(
          item => item.scanner === finding.scanner
        );
        driftEvents.push({
          id: `drift-${dayOffset}-${eventSpec.type}-${occurrence}`,
          scanId: scanId(dayOffset, scannerIndex),
          findingFingerprint: `${finding.fingerprint}-${eventSpec.type}-${dayOffset}-${occurrence}`,
          controlId: finding.controlId,
          scanner: finding.scanner,
          provider: finding.provider,
          severity:
            severityCycle[(dayOffset + occurrence) % severityCycle.length],
          eventType: eventSpec.type,
          occurredAt: daysBefore(anchor, 29 - dayOffset, 15),
        });
      }
    }
  }

  return { scanRuns, controls, findingObservations, driftEvents };
}
