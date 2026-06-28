const express = require('express');
const auth = require('../middleware/auth');
const { queryAI, parseAIJson } = require('../config/openrouter');

const router = express.Router();

function nowIso(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const actionGuidance = {
  'Review template': 'Assess whether the reusable control template is complete, testable, mapped to SOX/COSO, and ready for deployment.',
  'Send request': 'Assess evidence request readiness, due date risk, owner accountability, reminder plan, and approval path.',
  'Validate mapping': 'Assess policy-to-control/risk/regulation mapping quality, coverage gaps, version risk, and missing owners.',
  'Advance workflow': 'Assess audit workflow state, signoff readiness, rejection risk, escalation path, and reviewer accountability.',
  'Review readiness': 'Explain readiness score, high-risk drivers, overdue items, and executive actions.',
  'Retest plan': 'Assess remediation proof, retest readiness, closure risk, owner accountability, and verification steps.',
  'Verify trail': 'Assess immutable audit trail completeness, event integrity, hash/chain evidence, and audit defensibility.',
  'Generate export': 'Assess report export readiness, audience fit, missing sections, evidence attachments, and distribution risk.',
  'Test integration': 'Assess integration readiness, auth risk, sync failures, field mapping, and rollout plan.',
  'Send notification': 'Assess notification routing, message clarity, escalation gaps, reminder cadence, and delivery risk.',
  'Trend analysis': 'Assess multi-year control trends, retest schedule, recurring deficiencies, and risk trajectory.',
  'Review dashboard': 'Assess executive dashboard completeness, KPI clarity, decision usefulness, and missing metrics.',
};

const modules = {
  'control-library': {
    title: 'Control Library',
    description: 'Reusable SOX/COSO control templates, framework requirements, and mappings.',
    primaryAction: 'Review template',
    columns: ['template_id', 'name', 'framework', 'assertion', 'owner', 'status'],
    rows: [
      { id: 1, template_id: 'CTL-TPL-001', name: 'Revenue Cutoff Review', framework: 'SOX 404 / COSO Control Activities', assertion: 'Cutoff', owner: 'SOX PMO', status: 'approved', test_steps: 'Reconcile shipping terms to revenue posting period.', evidence_required: 'Invoice listing, shipment log, JE extract' },
      { id: 2, template_id: 'CTL-TPL-002', name: 'User Access Recertification', framework: 'SOX ITGC', assertion: 'Access Security', owner: 'IT Compliance', status: 'review', test_steps: 'Validate access appropriateness and reviewer signoff.', evidence_required: 'User listing, reviewer attestation' },
      { id: 3, template_id: 'CTL-TPL-003', name: 'Journal Entry Approval', framework: 'SOX 404', assertion: 'Completeness / Accuracy', owner: 'Controller', status: 'approved', test_steps: 'Sample JEs for preparer/approver segregation.', evidence_required: 'JE population, approval workflow' },
      { id: 4, template_id: 'CTL-TPL-004', name: 'Vendor Master Change', framework: 'SOX 404', assertion: 'Occurrence', owner: 'AP Manager', status: 'draft', test_steps: 'Inspect change approvals and bank validation.', evidence_required: 'Vendor change report, approvals' },
    ],
  },
  'evidence-requests': {
    title: 'Evidence Requests',
    description: 'Assignee workflow for evidence requests, reminders, attachments, and approval states.',
    primaryAction: 'Send request',
    columns: ['request_id', 'control_ref', 'assignee', 'due_date', 'status', 'priority'],
    rows: [
      { id: 1, request_id: 'EVR-1001', control_ref: 'CTL-REV-014', assignee: 'revenue.owner@example.com', due_date: nowIso(5), status: 'open', priority: 'high', reminder_plan: 'Daily after T-2', approval_state: 'awaiting evidence' },
      { id: 2, request_id: 'EVR-1002', control_ref: 'ITGC-ACC-002', assignee: 'itgc.owner@example.com', due_date: nowIso(2), status: 'overdue risk', priority: 'critical', reminder_plan: 'Immediate escalation', approval_state: 'not submitted' },
      { id: 3, request_id: 'EVR-1003', control_ref: 'CTL-JE-005', assignee: 'controller@example.com', due_date: nowIso(10), status: 'submitted', priority: 'medium', reminder_plan: 'Weekly', approval_state: 'reviewer check' },
      { id: 4, request_id: 'EVR-1004', control_ref: 'CTL-AP-009', assignee: 'ap.owner@example.com', due_date: nowIso(7), status: 'open', priority: 'medium', reminder_plan: 'T-3 and due date', approval_state: 'awaiting evidence' },
    ],
  },
  'policy-mapping': {
    title: 'Policy Mapping',
    description: 'Map policies to controls, risks, systems, owners, and regulations.',
    primaryAction: 'Validate mapping',
    columns: ['mapping_id', 'policy', 'control_ref', 'risk_ref', 'regulation', 'coverage'],
    rows: [
      { id: 1, mapping_id: 'MAP-001', policy: 'Revenue Recognition Policy', control_ref: 'CTL-REV-014', risk_ref: 'RISK-REV-01', regulation: 'SOX 404', coverage: 'strong', owner: 'Revenue Accounting' },
      { id: 2, mapping_id: 'MAP-002', policy: 'Access Management Policy', control_ref: 'ITGC-ACC-002', risk_ref: 'RISK-IT-04', regulation: 'COSO', coverage: 'partial', owner: 'IT Compliance' },
      { id: 3, mapping_id: 'MAP-003', policy: 'Vendor Master Policy', control_ref: 'CTL-AP-009', risk_ref: 'RISK-AP-02', regulation: 'SOX 404', coverage: 'weak', owner: 'Procurement' },
      { id: 4, mapping_id: 'MAP-004', policy: 'Change Management Policy', control_ref: 'ITGC-CHG-008', risk_ref: 'RISK-IT-01', regulation: 'PCAOB AS 2201', coverage: 'strong', owner: 'Engineering Ops' },
    ],
  },
  'audit-workflows': {
    title: 'Audit Workflow',
    description: 'Preparer/reviewer approvals, signoffs, rejection reasons, comments, and escalation.',
    primaryAction: 'Advance workflow',
    columns: ['workflow_id', 'workpaper', 'preparer', 'reviewer', 'state', 'days_in_state'],
    rows: [
      { id: 1, workflow_id: 'WF-001', workpaper: 'Revenue cutoff testing', preparer: 'A. Rivera', reviewer: 'M. Chen', state: 'reviewer pending', days_in_state: 3, rejection_reason: null, escalation: 'SOX Manager at 5 days' },
      { id: 2, workflow_id: 'WF-002', workpaper: 'Access recertification', preparer: 'J. Patel', reviewer: 'N. Brooks', state: 'rejected', days_in_state: 6, rejection_reason: 'Missing population completeness evidence', escalation: 'IT Compliance lead' },
      { id: 3, workflow_id: 'WF-003', workpaper: 'JE approval sample', preparer: 'L. Kim', reviewer: 'M. Chen', state: 'approved', days_in_state: 1, rejection_reason: null, escalation: 'None' },
      { id: 4, workflow_id: 'WF-004', workpaper: 'Vendor master changes', preparer: 'P. Stone', reviewer: 'R. Shah', state: 'preparer draft', days_in_state: 2, rejection_reason: null, escalation: 'AP Manager at 7 days' },
    ],
  },
  'risk-dashboard': {
    title: 'Risk Dashboard',
    description: 'High-risk controls, failed testing, overdue evidence, deficiencies, and readiness score.',
    primaryAction: 'Review readiness',
    columns: ['metric_id', 'area', 'score', 'risk_level', 'owner', 'trend'],
    rows: [
      { id: 1, metric_id: 'RD-001', area: 'Revenue cycle', score: 82, risk_level: 'medium', owner: 'Controller', trend: 'improving', drivers: '2 open evidence requests, 1 partial control' },
      { id: 2, metric_id: 'RD-002', area: 'ITGC access', score: 61, risk_level: 'high', owner: 'IT Compliance', trend: 'worsening', drivers: '1 rejected workpaper, stale access review' },
      { id: 3, metric_id: 'RD-003', area: 'AP procurement', score: 74, risk_level: 'medium', owner: 'Procurement', trend: 'flat', drivers: 'Vendor master coverage weak' },
      { id: 4, metric_id: 'RD-004', area: 'Change management', score: 88, risk_level: 'low', owner: 'Engineering Ops', trend: 'stable', drivers: 'No overdue retests' },
    ],
  },
  'remediation-retests': {
    title: 'Remediation Retests',
    description: 'Findings, owners, due dates, proof, retest status, and closure approval.',
    primaryAction: 'Retest plan',
    columns: ['finding_id', 'title', 'owner', 'due_date', 'retest_status', 'closure_state'],
    rows: [
      { id: 1, finding_id: 'FND-001', title: 'Access review population incomplete', owner: 'IT Compliance', due_date: nowIso(14), retest_status: 'scheduled', closure_state: 'open', proof: 'New extract logic and reviewer evidence pending' },
      { id: 2, finding_id: 'FND-002', title: 'JE approval missing timestamp', owner: 'Controller', due_date: nowIso(30), retest_status: 'not started', closure_state: 'open', proof: 'Workflow config change planned' },
      { id: 3, finding_id: 'FND-003', title: 'Vendor master bank validation', owner: 'AP Manager', due_date: nowIso(9), retest_status: 'in progress', closure_state: 'review', proof: 'Bank validation evidence uploaded' },
      { id: 4, finding_id: 'FND-004', title: 'Change ticket approvals inconsistent', owner: 'Engineering Ops', due_date: nowIso(45), retest_status: 'passed', closure_state: 'approval pending', proof: 'Sample retest passed' },
    ],
  },
  'audit-trail': {
    title: 'Immutable Audit Trail',
    description: 'Tamper-evident upload, edit, approval, rejection, export, and AI recommendation events.',
    primaryAction: 'Verify trail',
    columns: ['event_id', 'event_type', 'actor', 'entity', 'hash_status', 'created_at'],
    rows: [
      { id: 1, event_id: 'AUD-0001', event_type: 'evidence_upload', actor: 'auditor@example.com', entity: 'EV-1001', hash_status: 'verified', created_at: nowIso(-1), hash: '8f23a...b92' },
      { id: 2, event_id: 'AUD-0002', event_type: 'workpaper_rejected', actor: 'reviewer@example.com', entity: 'WF-002', hash_status: 'verified', created_at: nowIso(-1), hash: '6bd10...a33' },
      { id: 3, event_id: 'AUD-0003', event_type: 'ai_recommendation', actor: 'system', entity: 'RISK-IT-04', hash_status: 'verified', created_at: nowIso(0), hash: 'a093e...d17' },
      { id: 4, event_id: 'AUD-0004', event_type: 'report_export', actor: 'manager@example.com', entity: 'RPT-Q2', hash_status: 'review', created_at: nowIso(0), hash: 'pending' },
    ],
  },
  'report-exports': {
    title: 'Report Exports',
    description: 'Control matrix, evidence package, exception report, remediation report, and executive report exports.',
    primaryAction: 'Generate export',
    columns: ['job_id', 'report_type', 'format', 'audience', 'status', 'owner'],
    rows: [
      { id: 1, job_id: 'EXP-001', report_type: 'Control Matrix', format: 'Excel', audience: 'External auditor', status: 'ready', owner: 'SOX PMO', sections: 'Controls, risks, owners, test status' },
      { id: 2, job_id: 'EXP-002', report_type: 'Evidence Package', format: 'PDF ZIP', audience: 'PCAOB support', status: 'review', owner: 'Audit Manager', sections: 'Evidence index, files, hashes' },
      { id: 3, job_id: 'EXP-003', report_type: 'Exception Report', format: 'PDF', audience: 'Audit Committee', status: 'draft', owner: 'Controller', sections: 'Open deficiencies, severity, remediation' },
      { id: 4, job_id: 'EXP-004', report_type: 'Executive Dashboard', format: 'PDF', audience: 'CFO', status: 'ready', owner: 'SOX PMO', sections: 'Readiness KPIs, trend, risk' },
    ],
  },
  integrations: {
    title: 'Audit Integrations',
    description: 'Workiva, AuditBoard, Jira, Slack, email, and webhook integration readiness.',
    primaryAction: 'Test integration',
    columns: ['integration_id', 'system', 'direction', 'status', 'owner', 'last_sync'],
    rows: [
      { id: 1, integration_id: 'INT-001', system: 'Workiva', direction: 'export', status: 'configured', owner: 'SOX PMO', last_sync: nowIso(-1), mapping: 'Controls and evidence package' },
      { id: 2, integration_id: 'INT-002', system: 'AuditBoard', direction: 'bidirectional', status: 'planned', owner: 'Audit Manager', last_sync: null, mapping: 'Deficiencies and workpapers' },
      { id: 3, integration_id: 'INT-003', system: 'Jira', direction: 'outbound', status: 'configured', owner: 'Engineering Ops', last_sync: nowIso(0), mapping: 'Remediation tasks' },
      { id: 4, integration_id: 'INT-004', system: 'Slack', direction: 'outbound', status: 'warning', owner: 'Platform', last_sync: nowIso(-3), mapping: 'Evidence reminders and escalations' },
    ],
  },
  notifications: {
    title: 'Notifications',
    description: 'Webhook, email, and Slack alerts for remediation deadlines, approvals, evidence requests, and new deficiencies.',
    primaryAction: 'Send notification',
    columns: ['rule_id', 'event', 'channel', 'severity', 'status', 'owner'],
    rows: [
      { id: 1, rule_id: 'NTF-001', event: 'Evidence due in 3 days', channel: 'Email', severity: 'medium', status: 'enabled', owner: 'SOX PMO', template: 'Evidence request {{request_id}} is due soon.' },
      { id: 2, rule_id: 'NTF-002', event: 'Critical deficiency opened', channel: 'Slack + Email', severity: 'critical', status: 'enabled', owner: 'Controller', template: 'Critical deficiency {{deficiency_id}} needs review.' },
      { id: 3, rule_id: 'NTF-003', event: 'Workpaper rejected', channel: 'In-app + Email', severity: 'high', status: 'enabled', owner: 'Audit Manager', template: 'Workpaper {{workflow_id}} was rejected.' },
      { id: 4, rule_id: 'NTF-004', event: 'Retest overdue', channel: 'Webhook', severity: 'high', status: 'paused', owner: 'Platform', template: 'Retest for {{finding_id}} is overdue.' },
    ],
  },
  'trends-retests': {
    title: 'Trend & Retest Scheduling',
    description: 'Multi-year trend analysis, recurring deficiency detection, and automated retest scheduling.',
    primaryAction: 'Trend analysis',
    columns: ['trend_id', 'area', 'years_observed', 'recurrence', 'next_retest', 'risk_level'],
    rows: [
      { id: 1, trend_id: 'TRD-001', area: 'Access reviews', years_observed: 3, recurrence: 'recurring', next_retest: nowIso(21), risk_level: 'high', pattern: 'Population completeness issues repeated in Q2.' },
      { id: 2, trend_id: 'TRD-002', area: 'Journal entries', years_observed: 2, recurrence: 'declining', next_retest: nowIso(35), risk_level: 'medium', pattern: 'Approval timestamp exceptions reduced.' },
      { id: 3, trend_id: 'TRD-003', area: 'Vendor master', years_observed: 2, recurrence: 'emerging', next_retest: nowIso(14), risk_level: 'medium', pattern: 'Bank validation gaps appearing.' },
      { id: 4, trend_id: 'TRD-004', area: 'Change management', years_observed: 4, recurrence: 'stable', next_retest: nowIso(60), risk_level: 'low', pattern: 'Low repeat exception count.' },
    ],
  },
  'executive-dashboards': {
    title: 'Executive Dashboards',
    description: 'Audit committee and CFO dashboards beyond static PDF exports.',
    primaryAction: 'Review dashboard',
    columns: ['dashboard_id', 'audience', 'readiness_score', 'open_high_risks', 'status', 'owner'],
    rows: [
      { id: 1, dashboard_id: 'DSH-001', audience: 'Audit Committee', readiness_score: 78, open_high_risks: 4, status: 'live', owner: 'SOX PMO', metrics: 'Readiness, open deficiencies, overdue evidence, trend' },
      { id: 2, dashboard_id: 'DSH-002', audience: 'CFO', readiness_score: 84, open_high_risks: 2, status: 'live', owner: 'Controller', metrics: 'Control health, reporting risk, remediation forecast' },
      { id: 3, dashboard_id: 'DSH-003', audience: 'External Auditor', readiness_score: 71, open_high_risks: 5, status: 'review', owner: 'Audit Manager', metrics: 'Evidence status, workpaper state, audit trail completeness' },
      { id: 4, dashboard_id: 'DSH-004', audience: 'IT Steering Committee', readiness_score: 69, open_high_risks: 3, status: 'draft', owner: 'IT Compliance', metrics: 'ITGC, access, change, incidents' },
    ],
  },
};

function moduleList() {
  return Object.entries(modules).map(([key, m]) => ({
    key,
    title: m.title,
    description: m.description,
    primaryAction: m.primaryAction,
    columns: m.columns,
    count: m.rows.length,
    attention: m.rows.filter((r) => /high|critical|warning|weak|overdue|rejected|review|paused/i.test(JSON.stringify(r))).length,
  }));
}

function mockAnalysis(moduleKey, module, row) {
  const label = row.name || row.title || row.template_id || row.request_id || row.workflow_id || row.mapping_id || row.dashboard_id || `Record ${row.id}`;
  return {
    mock: true,
    summary: `${module.primaryAction} completed for ${label}. OpenRouter is not configured, so this is a structured local fallback.`,
    findings: [
      { area: module.title, finding: `${label} was reviewed using current SOX operating context.`, severity: moduleList().find((m) => m.key === moduleKey)?.attention ? 'medium' : 'low' },
      { area: 'Required follow-up', finding: actionGuidance[module.primaryAction], severity: /high|critical|warning|weak|overdue|rejected|review|paused/i.test(JSON.stringify(row)) ? 'high' : 'medium' },
    ],
    recommendations: [
      { priority: 1, action: 'Confirm owner accountability and due date.' },
      { priority: 2, action: 'Attach supporting evidence and reviewer signoff.' },
      { priority: 3, action: 'Escalate if the item remains unresolved after the next review cycle.' },
    ],
    risks: [
      { risk: 'Incomplete audit evidence', impact: 'Auditor reliance may be limited.', mitigation: 'Link evidence, source system extract, and approval trail.' },
    ],
    confidence: 0.74,
  };
}

async function runAI(moduleKey, module, row) {
  if (!process.env.OPENROUTER_API_KEY) return mockAnalysis(moduleKey, module, row);
  const prompt = `SOX Ops module: ${module.title}
Action: ${module.primaryAction}
Goal: ${actionGuidance[module.primaryAction]}
Selected row JSON:
${JSON.stringify(row, null, 2)}

Return strict compact JSON only. Do not use markdown fences. Keep every string under 180 characters.
Schema:
{
  "summary": "one concise executive sentence",
  "findings": [{"area":"...", "finding":"...", "severity":"low|medium|high|critical"}],
  "recommendations": [{"priority":1, "action":"..."}],
  "risks": [{"risk":"...", "impact":"...", "mitigation":"..."}],
  "follow_up_questions": ["..."],
  "confidence": 0.0
}
Limits: findings max 5, recommendations max 5, risks max 4, follow_up_questions max 4.`;
  try {
    const raw = await queryAI(
      prompt,
      'You are an expert SOX audit automation copilot. Return strict compact JSON only. Do not use markdown fences.',
      { maxTokens: 1400, temperature: 0.2 }
    );
    const parsed = parseAIJson(raw);
    return parsed || {
      summary: `${module.primaryAction} completed, but the AI response format was incomplete. Retry the action if you need a full structured report.`,
      findings: [{ area: module.title, finding: 'The provider returned malformed or truncated structured data.', severity: 'medium' }],
      recommendations: [{ priority: 1, action: 'Retry the action or reduce the selected record context.' }],
      risks: [{ risk: 'Incomplete AI formatting', impact: 'The report could not be fully parsed.', mitigation: 'Use compact structured output and retry.' }],
      confidence: 0.35,
    };
  } catch (err) {
    const fallback = mockAnalysis(moduleKey, module, row);
    fallback.error = err.message;
    fallback.summary = `${module.primaryAction} could not reach OpenRouter. Showing fallback analysis.`;
    return fallback;
  }
}

router.get('/summary', auth, (_req, res) => {
  const list = moduleList();
  res.json({
    module_count: list.length,
    record_count: list.reduce((sum, m) => sum + m.count, 0),
    attention_count: list.reduce((sum, m) => sum + m.attention, 0),
    modules: list,
  });
});

router.get('/:moduleKey', auth, (req, res) => {
  const module = modules[req.params.moduleKey];
  if (!module) return res.status(404).json({ error: 'SOX Ops module not found' });
  res.json({ key: req.params.moduleKey, ...module, rows: module.rows });
});

router.post('/:moduleKey/:id/run', auth, async (req, res) => {
  const module = modules[req.params.moduleKey];
  if (!module) return res.status(404).json({ error: 'SOX Ops module not found' });
  const row = module.rows.find((r) => r.id === Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'SOX Ops row not found' });
  const analysis = await runAI(req.params.moduleKey, module, row);
  row.last_action = module.primaryAction;
  row.last_action_at = new Date().toISOString();
  row.ai_summary = analysis.summary;
  res.json({ success: true, row, analysis });
});

router.put('/:moduleKey/:id', auth, (req, res) => {
  const module = modules[req.params.moduleKey];
  if (!module) return res.status(404).json({ error: 'SOX Ops module not found' });
  const row = module.rows.find((r) => r.id === Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'SOX Ops row not found' });
  Object.assign(row, req.body || {}, { updated_at: new Date().toISOString() });
  res.json({ success: true, row });
});

router.delete('/:moduleKey/:id', auth, (req, res) => {
  const module = modules[req.params.moduleKey];
  if (!module) return res.status(404).json({ error: 'SOX Ops module not found' });
  const before = module.rows.length;
  module.rows = module.rows.filter((r) => r.id !== Number(req.params.id));
  if (module.rows.length === before) return res.status(404).json({ error: 'SOX Ops row not found' });
  res.json({ success: true });
});

module.exports = router;
