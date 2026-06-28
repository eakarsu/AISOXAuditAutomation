const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../config/db');
const { queryAI, parseAIJson } = require('../config/openrouter');

const router = express.Router();

const crudFeatures = [
  { key: 'controls', label: 'Control Testing', route: '/controls', table: 'controls', idColumn: 'control_id', aliases: ['control', 'controls', 'control testing'], ai: { path: '/api/ai/analyze-control', idParam: 'controlId' } },
  { key: 'risk-assessments', label: 'Risk Assessment', route: '/risk-assessments', table: 'risk_assessments', idColumn: 'risk_id', aliases: ['risk', 'risks', 'risk assessment'], ai: { path: '/api/ai/analyze-risk', idParam: 'riskId' } },
  { key: 'evidence', label: 'Evidence Collection', route: '/evidence', table: 'evidence', idColumn: 'evidence_id', aliases: ['evidence', 'evidence collection'], ai: { entity: true } },
  { key: 'compliance', label: 'Compliance Checklist', route: '/compliance', table: 'compliance_items', idColumn: 'item_id', aliases: ['compliance', 'checklist', 'compliance checklist'], ai: { entity: true } },
  { key: 'deficiencies', label: 'Deficiency Tracking', route: '/deficiencies', table: 'deficiencies', idColumn: 'deficiency_id', aliases: ['deficiency', 'deficiencies', 'finding', 'findings'], ai: { path: '/api/ai/analyze-deficiency', idParam: 'deficiencyId' } },
  { key: 'walkthroughs', label: 'Walkthroughs', route: '/walkthroughs', table: 'walkthroughs', idColumn: 'walkthrough_id', aliases: ['walkthrough', 'walkthroughs', 'narrative'], ai: { path: '/api/ai/generate-narrative', idParam: 'walkthroughId' } },
  { key: 'management-reviews', label: 'Management Review', route: '/management-reviews', table: 'management_reviews', idColumn: 'review_id', aliases: ['management review', 'management reviews'], ai: { entity: true } },
  { key: 'itgc', label: 'IT General Controls', route: '/itgc', table: 'itgc_controls', idColumn: 'itgc_id', aliases: ['itgc', 'it general controls'], ai: { path: '/api/ai/analyze-itgc', idParam: 'itgcId' } },
  { key: 'financial-reviews', label: 'Financial Review', route: '/financial-reviews', table: 'financial_reviews', idColumn: 'review_id', aliases: ['financial review', 'financial reviews'], ai: { path: '/api/ai/analyze-financial', idParam: 'reviewId' } },
  { key: 'sod-reviews', label: 'Segregation of Duties', route: '/sod-reviews', table: 'sod_reviews', idColumn: 'sod_id', aliases: ['sod', 'segregation of duties'], ai: { path: '/api/ai/analyze-sod', idParam: 'sodId' } },
  { key: 'access-reviews', label: 'Access Control', route: '/access-reviews', table: 'access_reviews', idColumn: 'review_id', aliases: ['access', 'access review', 'access reviews'], ai: { entity: true } },
  { key: 'change-requests', label: 'Change Management', route: '/change-requests', table: 'change_requests', idColumn: 'change_id', aliases: ['change', 'changes', 'change request', 'change management'], ai: { entity: true } },
  { key: 'audit-reports', label: 'Audit Reports', route: '/audit-reports', table: 'audit_reports', idColumn: 'report_id', aliases: ['audit report', 'audit reports', 'reports'], ai: { path: '/api/ai/generate-report', idParam: 'reportId' } },
  { key: 'policies', label: 'Policy Management', route: '/policies', table: 'policies', idColumn: 'policy_id', aliases: ['policy', 'policies', 'policy management'], ai: { path: '/api/ai/analyze-policy', idParam: 'policyId' } },
  { key: 'remediations', label: 'Remediation Tracking', route: '/remediations', table: 'remediations', idColumn: 'remediation_id', aliases: ['remediation', 'remediations'], ai: { entity: true } },
  { key: 'audit-plans', label: 'Audit Planning', route: '/audit-plans', table: 'audit_plans', idColumn: 'plan_id', aliases: ['audit plan', 'audit plans', 'audit planning'], ai: { path: '/api/ai/suggest-plan', idParam: 'planId' } },
  { key: 'materiality', label: 'Materiality Assessment', route: '/materiality', table: 'materiality_assessments', idColumn: 'assessment_id', aliases: ['materiality', 'materiality assessment'], ai: { path: '/api/ai/analyze-materiality', idParam: 'assessmentId' } },
  { key: 'incidents', label: 'Incident Management', route: '/incidents', table: 'incidents', idColumn: 'incident_id', aliases: ['incident', 'incidents', 'incident management'], ai: { path: '/api/ai/analyze-incident', idParam: 'incidentId' } },
];

const pageRoutes = [
  { label: 'Dashboard', route: '/dashboard', aliases: ['dashboard', 'home'] },
  { label: 'Evidence Vault', route: '/evidence-vault', aliases: ['evidence vault', 'vault', 'uploads'] },
  { label: 'PCAOB Workpaper Review', route: '/workpaper-review', aliases: ['workpaper review', 'pcaob workpaper'] },
  { label: 'Controls Monitor', route: '/controls-monitor', aliases: ['controls monitor', 'continuous monitor'] },
  { label: 'Regulatory Updates', route: '/regulatory-update', aliases: ['regulatory update', 'regulatory updates'] },
  { label: 'Sampling Recommendation', route: '/sampling-recommendation', aliases: ['sampling recommendation', 'sampling'] },
  { label: 'Evidence Quality', route: '/evidence-quality', aliases: ['evidence quality'] },
  { label: 'Key Report Completeness', route: '/key-report-completeness', aliases: ['key report', 'key report completeness'] },
  { label: 'Production Readiness', route: '/production-readiness', aliases: ['production readiness'] },
  { label: 'Missing Features', route: '/missing-features', aliases: ['missing features'] },
];

const soxOpsModules = [
  { key: 'control-library', label: 'Control Library', route: '/sox-ops/control-library', aliases: ['control library', 'template', 'templates', 'library'] },
  { key: 'evidence-requests', label: 'Evidence Requests', route: '/sox-ops/evidence-requests', aliases: ['evidence request', 'evidence requests', 'request'] },
  { key: 'policy-mapping', label: 'Policy Mapping', route: '/sox-ops/policy-mapping', aliases: ['policy mapping', 'mapping'] },
  { key: 'audit-workflows', label: 'Audit Workflows', route: '/sox-ops/audit-workflows', aliases: ['audit workflow', 'audit workflows', 'workflow', 'signoff', 'signoffs'] },
  { key: 'risk-dashboard', label: 'Risk Dashboard', route: '/sox-ops/risk-dashboard', aliases: ['risk dashboard', 'readiness'] },
  { key: 'remediation-retests', label: 'Remediation Retests', route: '/sox-ops/remediation-retests', aliases: ['remediation retest', 'retest', 'retests'] },
  { key: 'audit-trail', label: 'Audit Trail', route: '/sox-ops/audit-trail', aliases: ['audit trail', 'immutable trail', 'trail'] },
  { key: 'report-exports', label: 'Report Exports', route: '/sox-ops/report-exports', aliases: ['report export', 'exports', 'export'] },
  { key: 'integrations', label: 'Integrations', route: '/sox-ops/integrations', aliases: ['integration', 'integrations', 'workiva', 'auditboard'] },
  { key: 'notifications', label: 'Notifications', route: '/sox-ops/notifications', aliases: ['notification', 'notifications', 'webhook', 'webhooks'] },
  { key: 'trends-retests', label: 'Trends & Retests', route: '/sox-ops/trends-retests', aliases: ['trend', 'trends', 'trend analysis'] },
  { key: 'executive-dashboards', label: 'Executive Dashboards', route: '/sox-ops/executive-dashboards', aliases: ['executive dashboard', 'executive dashboards', 'executive'] },
];

const standaloneAiTools = [
  { key: 'regulatory-digest', label: 'Regulatory Change Digest', route: '/cf-regulatory-change-digest-ingesting-sec-pcaob-updates-flagging', endpoint: '/api/regulatory-digest/analyze', aliases: ['regulatory digest', 'regulatory change', 'sec update', 'pcaob update'] },
  { key: 'anomaly-detection', label: 'GL/AP Anomaly Detection', route: '/cf-anomaly-detection-in-gl-payroll-ap-transaction-feeds', endpoint: '/api/anomaly-detection/analyze', aliases: ['anomaly', 'gl anomaly', 'ap anomaly', 'payroll anomaly'] },
  { key: 'remediation-tracking', label: 'Remediation Timeline Prediction', route: '/cf-remediation-tracking-dashboard-with-timeline-view-and-predictive', endpoint: '/api/remediation-tracking/analyze', aliases: ['remediation timeline', 'predict remediation', 'remediation dashboard'] },
  { key: 'multi-year-audit-plan', label: 'Multi-Year Audit Plan', route: '/cf-multi-year-audit-plan-optimization-with-risk-based-resource-allocation', endpoint: '/api/multi-year-audit-plan/analyze', aliases: ['multi year audit', 'audit plan optimization', 'resource allocation'] },
  { key: 'evidence-adequacy', label: 'Evidence Adequacy RAG', route: '/cf-evidence-adequacy-checker-via-rag-over-pcaob-coso', endpoint: '/api/evidence-adequacy/analyze', aliases: ['evidence adequacy', 'pcaob coso', 'rag evidence'] },
  { key: 'continuous-controls-monitor', label: 'Continuous Controls Monitor', route: '/cf-continuous-controls-monitoring-with-real-time-exception-alerts', endpoint: '/api/continuous-controls-monitor/analyze', aliases: ['continuous controls', 'real time exception', 'exception alerts'] },
  { key: 'sampling-engine', label: 'Sampling Recommendation Engine', route: '/gap-no-sampling-recommendation-engine-test-size-based-on', endpoint: '/api/gap-no-sampling-recommendation-engine-test-size-based-on/run', aliases: ['sampling engine', 'test size', 'risk materiality'] },
  { key: 'evidence-quality-gap', label: 'Evidence Quality Assessment', route: '/gap-no-evidence-quality-assessment-is-provided-evidence-sufficient', endpoint: '/api/gap-no-evidence-quality-assessment-is-provided-evidence-sufficient/run', aliases: ['evidence quality assessment', 'evidence sufficient'] },
  { key: 'control-risk-mapping', label: 'Control-to-Risk Auto Mapping', route: '/gap-no-ai-driven-control-to-risk-auto-mapping', endpoint: '/api/gap-no-ai-driven-control-to-risk-auto-mapping/run', aliases: ['control to risk', 'auto mapping'] },
  { key: 'audit-integration-gap', label: 'Workiva/AuditBoard Integration', route: '/gap-no-integration-with-workiva-auditboard-or-other-audit', endpoint: '/api/gap-no-integration-with-workiva-auditboard-or-other-audit/run', aliases: ['workiva integration', 'auditboard integration'] },
  { key: 'workflow-approvals-gap', label: 'Finding Approval Workflow', route: '/gap-no-workflow-approvals-sign-offs-for-findings-no-approval', endpoint: '/api/gap-no-workflow-approvals-sign-offs-for-findings-no-approval/run', aliases: ['approval workflow', 'finding approval'] },
  { key: 'trend-retest-gap', label: 'Multi-Year Trend Analysis', route: '/gap-no-multi-year-trend-analysis-or-re-test-scheduling', endpoint: '/api/gap-no-multi-year-trend-analysis-or-re-test-scheduling/run', aliases: ['multi year trend', 're test scheduling'] },
  { key: 'remediation-notifications-gap', label: 'Remediation Deadline Notifications', route: '/gap-no-webhooks-notifications-for-remediation-deadlines-or-new', endpoint: '/api/gap-no-webhooks-notifications-for-remediation-deadlines-or-new/run', aliases: ['deadline notification', 'remediation notification'] },
  { key: 'audit-trail-gap', label: 'Dedicated Audit Trail', route: '/gap-no-dedicated-audit-trail-subsystem-despite-domain-requirement', endpoint: '/api/gap-no-dedicated-audit-trail-subsystem-despite-domain-requirement/run', aliases: ['dedicated audit trail'] },
  { key: 'executive-reporting-gap', label: 'Executive Reporting Dashboard', route: '/gap-no-dashboards-for-executive-reporting-beyond-pdf-export', endpoint: '/api/gap-no-dashboards-for-executive-reporting-beyond-pdf-export/run', aliases: ['executive reporting', 'dashboard beyond pdf'] },
];

const tableColumns = {
  controls: ['control_id','name','description','category','owner','frequency','status','effectiveness','last_tested','ai_analysis'],
  risk_assessments: ['risk_id','title','description','category','likelihood','impact','risk_score','mitigation','owner','status','ai_analysis'],
  evidence: ['evidence_id','title','description','control_ref','type','source','collected_by','collected_date','status','notes','file_path','file_hash','file_size','doc_type'],
  compliance_items: ['item_id','section','requirement','description','status','assignee','due_date','completion_date','notes'],
  deficiencies: ['deficiency_id','title','description','control_ref','severity','classification','identified_date','remediation_plan','owner','status','workflow_state','ai_analysis'],
  walkthroughs: ['walkthrough_id','title','description','control_ref','process','risk_area','performed_by','reviewed_by','start_date','end_date','status','findings','ai_summary'],
  management_reviews: ['review_id','title','type','period','reviewer','status','findings','action_items','ai_summary'],
  itgc_controls: ['itgc_id','name','category','description','owner','frequency','status','effectiveness','system','ai_analysis'],
  financial_reviews: ['review_id','title','period','type','reviewed_by','status','findings','variance','ai_analysis'],
  sod_reviews: ['sod_id','title','description','user_affected','roles','risk_level','status','remediation','ai_analysis'],
  access_reviews: ['review_id','system','user_count','reviewed_by','review_date','status','findings','ai_summary'],
  change_requests: ['change_id','title','description','type','priority','requestor','status','approval_status','implementation_date','ai_analysis'],
  audit_reports: ['report_id','title','type','period','auditor','status','executive_summary','findings','recommendations','ai_summary'],
  policies: ['policy_id','title','category','description','version','owner','review_date','status','content','ai_summary'],
  remediations: ['remediation_id','deficiency_ref','title','description','owner','due_date','status','verification_date','workflow_state','ai_analysis'],
  audit_plans: ['plan_id','title','description','audit_type','scope','period','lead_auditor','team','status','risk_areas','ai_summary'],
  materiality_assessments: ['assessment_id','title','entity','period','benchmark','benchmark_value','materiality_amount','clearly_trivial','status','notes','ai_analysis'],
  incidents: ['incident_id','title','description','category','severity','reported_by','status','resolution','ai_analysis'],
};

const idPrefixes = {
  controls: 'CTL',
  'risk-assessments': 'RSK',
  evidence: 'EVD',
  compliance: 'CMP',
  deficiencies: 'DEF',
  walkthroughs: 'WLK',
  'management-reviews': 'MGR',
  itgc: 'ITGC',
  'financial-reviews': 'FIN',
  'sod-reviews': 'SOD',
  'access-reviews': 'ACC',
  'change-requests': 'CHG',
  'audit-reports': 'RPT',
  policies: 'POL',
  remediations: 'REM',
  'audit-plans': 'PLN',
  materiality: 'MAT',
  incidents: 'INC',
};

const globalAiActions = [
  { key: 'coso-scoring', label: 'COSO Scoring', endpoint: '/api/ai/coso-scoring', aliases: ['coso', 'coso scoring', 'control environment'] },
  { key: 'scope-memo', label: 'Scope Memo', endpoint: '/api/ai/scope-memo', aliases: ['scope memo', 'generate scope'] },
  { key: 'risk-heatmap', label: 'Risk Heatmap', endpoint: '/api/ai/risk-heatmap', aliases: ['risk heatmap', 'heatmap'] },
  { key: 'remediation-analyzer', label: 'Remediation Analyzer', endpoint: '/api/ai/remediation-analyzer', aliases: ['remediation analyzer'] },
  { key: 'workpaper-review', label: 'Workpaper Review', endpoint: '/api/ai/workpaper-review', aliases: ['workpaper ai', 'review workpaper'] },
  { key: 'controls-monitor', label: 'Controls Monitor AI', endpoint: '/api/ai/controls-monitor', aliases: ['controls monitor ai'] },
  { key: 'regulatory-update', label: 'Regulatory Update AI', endpoint: '/api/ai/regulatory-update', aliases: ['regulatory update ai'] },
  { key: 'sampling-recommendation', label: 'Sampling Recommendation AI', endpoint: '/api/ai/sampling-recommendation', aliases: ['sampling ai', 'recommend sample size'] },
  { key: 'evidence-quality', label: 'Evidence Quality AI', endpoint: '/api/ai/evidence-quality', aliases: ['evidence quality ai', 'assess evidence'] },
  { key: 'dashboard-summary', label: 'Dashboard Summary', endpoint: '/api/ai/dashboard-summary', aliases: ['dashboard summary', 'summarize dashboard'] },
];

function clean(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

function normalize(s) {
  return clean(s).toLowerCase();
}

function baseUrl() {
  return `http://localhost:${process.env.BACKEND_PORT || process.env.PORT || 3001}`;
}

function authHeaders(req) {
  return {
    Authorization: req.headers.authorization || '',
    'Content-Type': 'application/json',
  };
}

function labelFor(row, feature) {
  return row?.name || row?.title || row?.[feature?.idColumn] || row?.control_id || row?.evidence_id || row?.request_id || row?.template_id || `Record ${row?.id || ''}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextReference(feature) {
  return `${idPrefixes[feature.key] || feature.key.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-8)}`;
}

function inferTitle(message, feature) {
  let title = clean(message)
    .replace(/\b(create|add|new|open|make|record|item)\b/gi, ' ')
    .replace(/\b(named|called|titled|for|with|about)\b/gi, ' ')
    .replace(new RegExp(`\\b(${feature.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi'), ' ')
    .replace(/\s+/g, ' ')
    .trim();
  title = title.replace(/^[:\-]+|[:\-]+$/g, '').trim();
  if (!title) title = `Chat-created ${feature.label}`;
  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}

function compactDescription(message, title) {
  const description = clean(message);
  return description && description !== title ? description : `Created from System Chat: ${title}`;
}

function defaultRecordFor(feature, message, user = {}) {
  const title = inferTitle(message, feature);
  const description = compactDescription(message, title);
  const year = String(new Date().getFullYear());
  const actor = user.email || user.name || 'System Chat';
  const ref = nextReference(feature);

  const defaults = {
    controls: { control_id: ref, name: title, description, category: 'Financial Reporting', owner: actor, frequency: 'Monthly', status: 'Pending', effectiveness: 'Not Tested' },
    'risk-assessments': { risk_id: ref, title, description, category: 'Operational', likelihood: 'Medium', impact: 'Medium', risk_score: 5, mitigation: 'Review exposure and define a mitigation owner.', owner: actor, status: 'Open' },
    evidence: { evidence_id: ref, title, description, type: 'Document', source: 'System Chat', collected_by: actor, collected_date: today(), status: 'Pending Review', notes: 'Created from chat. Attach a file if supporting documentation is required.' },
    compliance: { item_id: ref, section: 'SOX 404', requirement: title, description, status: 'Not Started', assignee: actor, due_date: today(), notes: 'Created from System Chat.' },
    deficiencies: { deficiency_id: ref, title, description, severity: 'Medium', classification: 'Control Deficiency', identified_date: today(), remediation_plan: 'Assign owner, document root cause, and define remediation evidence.', owner: actor, status: 'Open', workflow_state: 'open' },
    walkthroughs: { walkthrough_id: ref, title, description, process: 'Financial Close', risk_area: 'Control Design', performed_by: actor, reviewed_by: 'Audit Manager', start_date: today(), status: 'Draft', findings: 'Pending walkthrough procedures.' },
    'management-reviews': { review_id: ref, title, type: 'Quarterly Review', period: year, reviewer: actor, status: 'Planned', findings: 'Pending review.', action_items: 'Define review agenda and evidence package.' },
    itgc: { itgc_id: ref, name: title, category: 'Access Management', description, owner: actor, frequency: 'Quarterly', status: 'Pending', effectiveness: 'Not Tested', system: 'ERP' },
    'financial-reviews': { review_id: ref, title, period: year, type: 'Analytical Review', reviewed_by: actor, status: 'Planned', findings: 'Pending analysis.', variance: 'To be calculated.' },
    'sod-reviews': { sod_id: ref, title, description, user_affected: 'TBD', roles: 'TBD', risk_level: 'Medium', status: 'Open', remediation: 'Review role conflict and document compensating controls.' },
    'access-reviews': { review_id: ref, system: title, user_count: 0, reviewed_by: actor, review_date: today(), status: 'Planned', findings: 'Pending access review.' },
    'change-requests': { change_id: ref, title, description, type: 'Application Change', priority: 'Medium', requestor: actor, status: 'Submitted', approval_status: 'Pending', implementation_date: today() },
    'audit-reports': { report_id: ref, title, type: 'SOX Audit Report', period: year, auditor: actor, status: 'Draft', executive_summary: description, findings: 'Pending audit procedures.', recommendations: 'Pending management review.' },
    policies: { policy_id: ref, title, category: 'SOX Compliance', description, version: '1.0', owner: actor, review_date: today(), status: 'Draft', content: description },
    remediations: { remediation_id: ref, title, description, owner: actor, due_date: today(), status: 'Pending', workflow_state: 'pending', deficiency_ref: '' },
    'audit-plans': { plan_id: ref, title, description, audit_type: 'SOX 404', scope: 'Financial reporting controls', period: year, lead_auditor: actor, team: actor, status: 'Draft', risk_areas: 'Revenue, access controls, change management' },
    materiality: { assessment_id: ref, title, entity: 'Corporate', period: year, benchmark: 'Revenue', benchmark_value: 0, materiality_amount: 0, clearly_trivial: 0, status: 'Draft', notes: description },
    incidents: { incident_id: ref, title, description, category: 'SOX Control Incident', severity: 'Medium', reported_by: actor, status: 'Open', resolution: 'Pending investigation.' },
  };

  return defaults[feature.key] || { [feature.idColumn]: ref, title, description, status: 'Open' };
}

function allowedRecord(feature, record) {
  const allowed = new Set(tableColumns[feature.table] || []);
  return Object.fromEntries(Object.entries(record || {}).filter(([key, value]) => allowed.has(key) && value !== undefined && value !== null && value !== ''));
}

async function refineCreatedRecord(feature, message, fallback) {
  if (!process.env.OPENROUTER_API_KEY) return fallback;
  try {
    const raw = await queryAI(
      `Create a SOX audit application record from this user request.
Feature: ${feature.label}
Allowed columns only: ${(tableColumns[feature.table] || []).join(', ')}
Fallback record: ${JSON.stringify(fallback)}
User request: ${message}
Return strict JSON containing only allowed column keys. Preserve generated reference IDs unless the user explicitly provided a better ID.`,
      'You extract structured SOX audit records. Return strict JSON only.'
    );
    const parsed = parseAIJson(raw);
    return { ...fallback, ...allowedRecord(feature, parsed || {}) };
  } catch (_) {
    return fallback;
  }
}

function routeToFeature(route = '') {
  const path = String(route || '').split('?')[0];
  const soxMatch = path.match(/^\/sox-ops\/([^/]+)/);
  if (soxMatch) return { type: 'sox', item: soxOpsModules.find((m) => m.key === soxMatch[1]) };
  const crud = crudFeatures.find((f) => f.route === path || `/${f.key}` === path);
  if (crud) return { type: 'crud', item: crud };
  const ai = standaloneAiTools.find((f) => f.route === path);
  if (ai) return { type: 'ai', item: ai };
  return { type: null, item: null };
}

function matchByAlias(items, text) {
  return items
    .map((item) => ({ item, score: item.aliases.filter((alias) => text.includes(alias)).sort((a, b) => b.length - a.length)[0]?.length || 0 }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function inferCrudFeature(text, context = {}) {
  const routeFeature = routeToFeature(context.route || '');
  return matchByAlias(crudFeatures, text) || (routeFeature?.type === 'crud' ? routeFeature.item : null);
}

function inferSoxModule(text, context = {}) {
  const routeFeature = routeToFeature(context.route || '');
  return matchByAlias(soxOpsModules, text) || (routeFeature?.type === 'sox' ? routeFeature.item : null);
}

function inferStandaloneTool(text, context = {}) {
  const routeFeature = routeToFeature(context.route || '');
  return matchByAlias(standaloneAiTools, text) || (routeFeature?.type === 'ai' ? routeFeature.item : null);
}

async function countTable(table) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return rows[0].count;
}

async function listRows(feature, limit = 10) {
  try {
    const { rows } = await pool.query(`SELECT * FROM ${feature.table} ORDER BY created_at DESC LIMIT $1`, [limit]);
    return rows;
  } catch (_) {
    const { rows } = await pool.query(`SELECT * FROM ${feature.table} ORDER BY id DESC LIMIT $1`, [limit]);
    return rows;
  }
}

async function findRecord(feature, text) {
  const rows = await listRows(feature, 60);
  if (!rows.length) return { rows, row: null };
  const numeric = text.match(/\b\d+\b/)?.[0];
  if (numeric) {
    const byId = rows.find((r) => String(r.id) === numeric);
    if (byId) return { rows, row: byId };
  }
  const row = rows.find((r) => {
    const idValue = String(r[feature.idColumn] || '').toLowerCase();
    const title = String(r.name || r.title || r.requirement || r.description || '').toLowerCase();
    return (idValue && text.includes(idValue)) || (title && title.length > 3 && text.includes(title.slice(0, Math.min(title.length, 24))));
  });
  return { rows, row: row || rows[0] };
}

async function callInternal(req, path, body = {}) {
  const resp = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: authHeaders(req),
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `${path} failed with HTTP ${resp.status}`);
  return data;
}

async function runCrudAi(req, feature, row) {
  if (!row) return { reply: `No ${feature.label} record is available to analyze.`, route: feature.route, action: 'no_record' };
  const body = feature.ai?.entity ? { resource: feature.key, id: row.id } : { [feature.ai.idParam]: row.id };
  const data = await callInternal(req, feature.ai?.entity ? '/api/ai/analyze-entity' : feature.ai.path, body);
  return {
    reply: `${feature.label} AI completed for ${labelFor(row, feature)}.`,
    action: `analyze_${feature.key}`,
    route: feature.route,
    data: data.analysis ? { analysis: data.analysis, record: row } : { analysis: data, record: row },
  };
}

async function createCrudRecord(req, feature, message) {
  const fallback = defaultRecordFor(feature, message, req.user || {});
  const record = allowedRecord(feature, await refineCreatedRecord(feature, message, fallback));
  const keys = Object.keys(record).filter((key) => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
  if (!keys.length) return { reply: `I could not infer enough fields to create a ${feature.label} record.`, route: feature.route, action: 'create_needs_fields' };

  const values = keys.map((key) => record[key]);
  const columns = keys.join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(`INSERT INTO ${feature.table} (${columns}) VALUES (${placeholders}) RETURNING *`, values);
  const created = rows[0];
  return {
    reply: `Created ${labelFor(created, feature)} in ${feature.label}.`,
    route: feature.route,
    action: `create_${feature.key}`,
    data: { record: created },
  };
}

async function updateCrudRecord(feature, text) {
  const { row } = await findRecord(feature, text);
  if (!row) return { reply: `No ${feature.label} record is available to update.`, route: feature.route, action: 'no_record' };

  const update = {};
  const columns = new Set(Object.keys(row));
  if (columns.has('status')) {
    if (/complete|completed|close|closed|approve|approved/i.test(text)) update.status = /approve|approved/i.test(text) ? 'Approved' : /close|closed/i.test(text) ? 'Closed' : 'Completed';
    if (/in progress|start|started/i.test(text)) update.status = 'In Progress';
    if (/open|reopen/i.test(text)) update.status = 'Open';
  }
  if (columns.has('priority')) {
    if (/high priority|critical/i.test(text)) update.priority = text.includes('critical') ? 'Critical' : 'High';
    if (/low priority/i.test(text)) update.priority = 'Low';
  }
  if (!Object.keys(update).length) {
    return {
      reply: `I found ${labelFor(row, feature)}, but I could not infer a supported field change. Try "mark ${labelFor(row, feature)} completed" or use the row edit popup.`,
      route: feature.route,
      action: 'update_needs_field',
      data: { record: row },
    };
  }

  const keys = Object.keys(update);
  const values = keys.map((k) => update[k]);
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await pool.query(`UPDATE ${feature.table} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`, [...values, row.id]);
  return { reply: `Updated ${labelFor(rows[0], feature)} in ${feature.label}.`, route: feature.route, action: `update_${feature.key}`, data: { record: rows[0], changes: update } };
}

function inferWorkflowTransition(text) {
  if (!/\b(move|transition|advance|send|change)\b/i.test(text)) return null;
  const subjectText = text.split(/\b(?:to|into|as)\b/i)[0] || text;
  const entityType = /\bdeficiency|deficiencies|finding|findings\b/i.test(subjectText) ? 'deficiencies' : /\bremediation|remediations\b/i.test(subjectText) ? 'remediations' : null;
  if (!entityType) return null;
  const id = text.match(/\b(?:id|record|deficiency|remediation|finding)?\s*#?(\d+)\b/i)?.[1];
  if (!id) return null;
  const stateText = text.match(/\b(?:to|into|as)\s+(.+)$/i)?.[1] || text;

  const stateAliases = [
    { re: /\bin remediation|remediation\b/i, value: 'in_remediation' },
    { re: /\bunder verification|verification|verify\b/i, value: 'under_verification' },
    { re: /\bclosed|close\b/i, value: 'closed' },
    { re: /\bin progress|progress|started\b/i, value: 'in_progress' },
    { re: /\bcompleted|complete\b/i, value: 'completed' },
    { re: /\bverified\b/i, value: 'verified' },
    { re: /\bpending\b/i, value: 'pending' },
    { re: /\bopen|reopen\b/i, value: 'open' },
  ];
  const newState = stateAliases.find((item) => item.re.test(stateText))?.value;
  return newState ? { entityType, entityId: Number(id), newState } : null;
}

async function transitionWorkflow(req, transition) {
  const data = await callInternal(req, '/api/ai/workflow/transition', transition);
  return {
    reply: data.message || `Workflow moved to ${transition.newState}.`,
    action: 'workflow_transition',
    route: transition.entityType === 'remediations' ? '/remediations' : '/deficiencies',
    data,
  };
}

async function deleteCrudRecord(feature, text) {
  const { row } = await findRecord(feature, text);
  if (!row || !/\bdelete\b.+\b(record|item|control|risk|evidence|deficiency|remediation|policy|report)\b/i.test(text)) {
    return { reply: `Tell me "delete record ${labelFor(row, feature)}" if you want to delete this ${feature.label} item.`, route: feature.route, action: 'delete_needs_explicit_record' };
  }
  await pool.query(`DELETE FROM ${feature.table} WHERE id = $1`, [row.id]);
  return { reply: `Deleted ${labelFor(row, feature)} from ${feature.label}.`, route: feature.route, action: `delete_${feature.key}`, data: { deleted: row } };
}

async function runSoxOps(req, module, text) {
  const moduleRes = await fetch(`${baseUrl()}/api/sox-ops/${module.key}`, { headers: authHeaders(req) });
  const moduleData = await moduleRes.json();
  if (!moduleRes.ok) return { reply: moduleData.error || 'SOX Ops module not found', data: moduleData };

  if (/run|review|send|validate|advance|generate|test|analy[sz]e|verify/i.test(text)) {
    const row = moduleData.rows.find((r) => text.includes(String(labelFor(r, { idColumn: 'template_id' })).toLowerCase())) || moduleData.rows[0];
    const runRes = await fetch(`${baseUrl()}/api/sox-ops/${module.key}/${row.id}/run`, { method: 'POST', headers: authHeaders(req) });
    const runData = await runRes.json();
    return {
      reply: runData.analysis?.summary || `${moduleData.primaryAction} completed.`,
      data: runData,
      route: module.route,
      action: `run_${module.key}`,
    };
  }
  return { reply: `Loaded ${moduleData.rows.length} records from ${moduleData.title}.`, data: moduleData, route: module.route, action: `show_${module.key}` };
}

async function runStandaloneTool(req, tool, message) {
  const sample = {
    request: message,
    scenario: `System Chat requested ${tool.label}.`,
    context: 'Use available SOX audit automation context and provide a practical professional recommendation.',
    return_format: 'summary, findings, recommendations, risks, follow-up questions, confidence',
  };
  const data = await callInternal(req, tool.endpoint, sample);
  return {
    reply: `${tool.label} completed.`,
    route: tool.route,
    action: `run_${tool.key}`,
    data: data.result || data.analysis || data,
  };
}

async function firstId(table) {
  const { rows } = await pool.query(`SELECT id FROM ${table} ORDER BY id ASC LIMIT 1`);
  return rows[0]?.id;
}

async function globalActionPayload(action, message) {
  if (action.key === 'scope-memo') {
    return { planId: await firstId('audit_plans'), entityName: 'SOX Audit Program', period: String(new Date().getFullYear()), auditType: 'SOX 404' };
  }
  if (action.key === 'workpaper-review') return { planId: await firstId('audit_plans') };
  if (action.key === 'sampling-recommendation') return { controlId: await firstId('controls'), populationSize: 120, materialityThreshold: 50000, riskLevel: 'medium' };
  if (action.key === 'evidence-quality') {
    return { controlId: await firstId('controls'), evidenceDescription: message, evidenceMetadata: { source: 'system chat', requested_at: new Date().toISOString() } };
  }
  return { prompt: message, request: message };
}

async function runGlobalAi(req, action, message) {
  const data = await callInternal(req, action.endpoint, await globalActionPayload(action, message));
  return {
    reply: `${action.label} completed.`,
    route: '/dashboard',
    action: `run_${action.key}`,
    data: data.analysis || data.scores || data.summary || data,
  };
}

async function dashboardCounts() {
  const data = {};
  await Promise.all(crudFeatures.map(async (feature) => {
    data[feature.key] = await countTable(feature.table).catch(() => 0);
  }));
  return data;
}

async function aiAnswer(message) {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      summary: 'OpenRouter is not configured. I can still operate pages, CRUD resources, SOX Ops modules, and local summaries.',
      recommendations: [{ action: 'Set OPENROUTER_API_KEY to enable free-form SOX analysis.' }],
    };
  }
  try {
    const raw = await queryAI(
      `User system-chat request: ${message}
Available app areas: ${crudFeatures.map((f) => f.label).join(', ')}.
Available SOX Ops modules: ${soxOpsModules.map((m) => m.label).join(', ')}.
Return strict JSON with summary, findings, recommendations, risks, and confidence.`,
      'You are an expert SOX audit automation system assistant. Return strict JSON only.'
    );
    return parseAIJson(raw) || { summary: raw };
  } catch (err) {
    return { summary: `AI request failed: ${err.message}` };
  }
}

router.get('/capabilities', auth, (_req, res) => {
  res.json({
    capabilities: [
      'Open any sidebar page by name.',
      'Create, list, summarize, show, analyze, update, and explicitly delete CRUD records.',
      'Upload evidence files from System Chat using the attachment button.',
      'Move deficiency and remediation workflow states from commands such as "move deficiency 9 to in remediation".',
      'Run AI for entity pages like controls, risks, evidence, deficiencies, policies, incidents, remediations, and reports.',
      'Run all SOX Ops module actions from the separate sidebar modules.',
      'Run standalone AI/gap tools such as regulatory digest, anomaly detection, evidence adequacy, sampling, and executive reporting.',
      'Use current page context for commands like "run AI on this page" or "list records here".',
    ],
    pages: [...pageRoutes, ...crudFeatures.map(({ label, route }) => ({ label, route })), ...soxOpsModules.map(({ label, route }) => ({ label, route }))],
    ai_tools: [...standaloneAiTools.map(({ key, label, route }) => ({ key, label, route })), ...globalAiActions.map(({ key, label }) => ({ key, label }))],
  });
});

router.post('/message', auth, async (req, res) => {
  const message = clean(req.body?.message);
  const text = normalize(message);
  const context = req.body?.context || {};
  try {
    if (!message) return res.json({ reply: 'Ask me to open a page, list records, run AI, update a record, or run a SOX Ops action.' });

    const page = matchByAlias([...pageRoutes, ...crudFeatures, ...soxOpsModules, ...standaloneAiTools], text);
    if (page && /\b(open|go to|navigate|show page|take me)\b/i.test(text)) {
      return res.json({ reply: `Opening ${page.label}.`, route: page.route, action: 'navigate' });
    }

    const globalAction = matchByAlias(globalAiActions, text);
    if (globalAction) return res.json(await runGlobalAi(req, globalAction, message));

    if (/\b(count|counts|dashboard totals|how many)\b/i.test(text)) {
      const data = await dashboardCounts();
      return res.json({
        reply: `Current SOX totals include ${data.controls || 0} controls, ${data.evidence || 0} evidence items, ${data.deficiencies || 0} deficiencies, and ${data.remediations || 0} remediations.`,
        action: 'dashboard_counts',
        route: '/dashboard',
        data,
      });
    }

    const workflowTransition = inferWorkflowTransition(text);
    if (workflowTransition) return res.json(await transitionWorkflow(req, workflowTransition));

    const soxModule = inferSoxModule(text, context);
    if (soxModule && /\b(sox ops|list|show|open|run|review|send|validate|advance|generate|test|analy[sz]e|verify)\b/i.test(text)) {
      return res.json(await runSoxOps(req, soxModule, text));
    }

    const crudFeature = inferCrudFeature(text, context);
    if (crudFeature) {
      if (/\b(delete|remove)\b/i.test(text)) return res.json(await deleteCrudRecord(crudFeature, text));
      if (/\b(create|add|new|make)\b/i.test(text)) return res.json(await createCrudRecord(req, crudFeature, message));
      if (/\b(update|mark|set|close|complete|approve|reopen|start)\b/i.test(text)) return res.json(await updateCrudRecord(crudFeature, text));
      if (/\b(run ai|analy[sz]e|assess|classify|generate narrative|generate report|suggest)\b/i.test(text)) {
        const { row } = await findRecord(crudFeature, text);
        return res.json(await runCrudAi(req, crudFeature, row));
      }
      if (/\b(list|show|load|records|items|table|rows)\b/i.test(text)) {
        const data = await listRows(crudFeature);
        return res.json({ reply: `Loaded ${data.length} ${crudFeature.label} records.`, action: `list_${crudFeature.key}`, route: crudFeature.route, data });
      }
    }

    const standaloneTool = inferStandaloneTool(text, context);
    if (standaloneTool && /\b(run|analy[sz]e|review|check|score|generate|optimize|recommend)\b/i.test(text)) {
      return res.json(await runStandaloneTool(req, standaloneTool, message));
    }

    const data = await aiAnswer(message);
    res.json({ reply: data.summary || 'I analyzed your SOX request.', action: 'ai_answer', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
