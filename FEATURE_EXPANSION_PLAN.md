# Feature Expansion Plan

Target product: AI Compliance Automation Suite

## 1. Control Library
- Add reusable SOX, HIPAA, GDPR, and export-control control templates.
- Backend tables: `control_templates`, `control_mappings`, `framework_requirements`.
- UI entry points: Controls Monitor, Compliance, Policies.

## 2. Evidence Requests
- Add request workflow with assignees, due dates, reminders, attachments, and approval state.
- Backend tables: `evidence_requests`, `evidence_request_files`, `evidence_request_events`.
- UI entry points: Evidence Vault, Workpaper Review.

## 3. Policy Mapping
- Map policies to controls, risks, systems, owners, and regulations.
- Backend tables: `policy_control_mappings`, `policy_versions`, `regulatory_requirements`.
- UI entry points: Policies, Regulatory Update, Controls Monitor.

## 4. Audit Workflow
- Add preparer/reviewer approvals, rejection reasons, signoffs, comments, and escalation.
- Backend tables: `audit_workflows`, `audit_workflow_steps`, `audit_signoffs`.
- UI entry points: Workpaper Review, Dashboard.

## 5. Risk Dashboard
- Show high-risk controls, failed testing, overdue evidence, open deficiencies, and readiness score.
- Backend views: `compliance_readiness_metrics`, `control_risk_metrics`.
- UI entry points: Dashboard, Production Readiness.

## 6. Remediation Tracker
- Track findings, owners, due dates, proof, retest status, and closure approval.
- Backend tables: `remediation_findings`, `remediation_tasks`, `remediation_evidence`.
- UI entry points: Remediation Tracking, Deficiencies.

## 7. Audit Trail
- Add immutable activity log for upload, edit, approval, rejection, export, and AI recommendation events.
- Backend tables: `immutable_audit_events`, `audit_event_hashes`.
- UI entry points: Audit Trail, Evidence Vault.

## 8. PDF/Excel Report Export
- Generate control matrix, evidence package, exception report, remediation report, and executive report.
- Backend tables: `report_jobs`, `report_exports`.
- UI entry points: Reports, Dashboard.
