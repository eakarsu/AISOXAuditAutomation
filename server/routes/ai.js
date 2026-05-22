const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryAI, parseAIJson } = require('../config/openrouter');
const PDFDocument = require('pdfkit');
const router = express.Router();

function hasApiKey() {
  const k = process.env.OPENROUTER_API_KEY;
  return !!(k && !/^(your|placeholder|changeme|sk-or-v1-xxx)/i.test(k));
}

// Persist AI result to ai_results table
async function persistAIResult(userId, endpoint, inputData, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (e) { console.error('persistAIResult error:', e.message); }
}

// Initialize ai_results table
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(100),
    input_data JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

// Add workflow_state and chain_of_custody columns if missing
pool.query(`
  ALTER TABLE deficiencies ADD COLUMN IF NOT EXISTS workflow_state VARCHAR(50) DEFAULT 'open';
  ALTER TABLE remediations ADD COLUMN IF NOT EXISTS workflow_state VARCHAR(50) DEFAULT 'pending';
`).catch(console.error);

// AI: Analyze Control Effectiveness - structured JSON output
router.post('/analyze-control', auth, aiRateLimiter, async (req, res) => {
  try {
    const { controlId } = req.body;
    const result = await pool.query('SELECT * FROM controls WHERE id = $1', [controlId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Control not found' });
    const control = result.rows[0];

    const prompt = `Analyze the following SOX control. Respond ONLY with JSON:
Control ID: ${control.control_id}
Name: ${control.name}
Description: ${control.description}
Category: ${control.category}
Frequency: ${control.frequency}
Status: ${control.status}
Effectiveness: ${control.effectiveness}

Return JSON:
{
  "effectiveness": "Effective|Partially Effective|Ineffective",
  "risk_rating": "High|Medium|Low",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "summary": "brief narrative"
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE controls SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, controlId]);
      await persistAIResult(req.user.id, 'analyze-control', { controlId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText, control_id: control.control_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Risk Assessment Analysis - structured JSON
router.post('/analyze-risk', auth, aiRateLimiter, async (req, res) => {
  try {
    const { riskId } = req.body;
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [riskId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk not found' });
    const risk = result.rows[0];

    const prompt = `Analyze this risk assessment. Return ONLY JSON:
Risk ID: ${risk.risk_id}, Title: ${risk.title}
Category: ${risk.category}, Likelihood: ${risk.likelihood}, Impact: ${risk.impact}
Current Score: ${risk.risk_score}, Mitigation: ${risk.mitigation}

Return:
{
  "validated_score": 1-10,
  "score_justification": "...",
  "impact_analysis": "...",
  "mitigation_recommendations": ["..."],
  "residual_risk": "High|Medium|Low",
  "monitoring_frequency": "Daily|Weekly|Monthly|Quarterly",
  "priority": "Critical|High|Medium|Low",
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE risk_assessments SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, riskId]);
      await persistAIResult(req.user.id, 'analyze-risk', { riskId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText, risk_id: risk.risk_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Deficiency Classification - structured JSON
router.post('/analyze-deficiency', auth, aiRateLimiter, async (req, res) => {
  try {
    const { deficiencyId } = req.body;
    const result = await pool.query('SELECT * FROM deficiencies WHERE id = $1', [deficiencyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deficiency not found' });
    const def = result.rows[0];

    const prompt = `Classify this SOX deficiency. Return ONLY JSON:
Title: ${def.title}, Description: ${def.description}
Control Ref: ${def.control_ref}, Current Severity: ${def.severity}

Return:
{
  "classification": "Material Weakness|Significant Deficiency|Control Deficiency",
  "justification": "...",
  "financial_impact": "...",
  "remediation_steps": [{"step": "...", "timeline": "..."}],
  "compensating_controls": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE deficiencies SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, deficiencyId]);
      await persistAIResult(req.user.id, 'analyze-deficiency', { deficiencyId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText, deficiency_id: def.deficiency_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Control Narrative Generator
router.post('/generate-narrative', auth, aiRateLimiter, async (req, res) => {
  try {
    const { walkthroughId } = req.body;
    const result = await pool.query('SELECT * FROM walkthroughs WHERE id = $1', [walkthroughId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Walkthrough not found' });
    const wt = result.rows[0];

    const prompt = `Generate a SOX control narrative. Return ONLY JSON:
Process: ${wt.process || wt.title}, Description: ${wt.description}
Findings: ${wt.findings}

Return:
{
  "narrative": "full narrative text",
  "control_points": ["..."],
  "risk_areas": ["..."],
  "evidence_required": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const narrative = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE walkthroughs SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [narrative, walkthroughId]);
      await persistAIResult(req.user.id, 'generate-narrative', { walkthroughId }, parsed || { raw: aiText });
    }
    res.json({ narrative: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: ITGC Analysis
router.post('/analyze-itgc', auth, aiRateLimiter, async (req, res) => {
  try {
    const { itgcId } = req.body;
    const result = await pool.query('SELECT * FROM itgc_controls WHERE id = $1', [itgcId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'ITGC control not found' });
    const itgc = result.rows[0];

    const prompt = `Analyze this ITGC for SOX compliance. Return ONLY JSON:
Name: ${itgc.name}, Category: ${itgc.category}
Description: ${itgc.description}, System: ${itgc.system}

Return:
{
  "adequacy": "Adequate|Partially Adequate|Inadequate",
  "gaps": ["..."],
  "recommendations": ["..."],
  "business_impact": "...",
  "priority": "Critical|High|Medium|Low",
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE itgc_controls SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, itgcId]);
      await persistAIResult(req.user.id, 'analyze-itgc', { itgcId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Financial Statement Analysis
router.post('/analyze-financial', auth, aiRateLimiter, async (req, res) => {
  try {
    const { reviewId } = req.body;
    const result = await pool.query('SELECT * FROM financial_reviews WHERE id = $1', [reviewId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Financial review not found' });
    const fr = result.rows[0];

    const prompt = `Analyze this financial review for SOX audit. Return ONLY JSON:
Title: ${fr.title}, Period: ${fr.period}, Type: ${fr.type}
Findings: ${fr.findings}

Return:
{
  "misstatement_risk": "High|Medium|Low",
  "key_assertions": ["existence","completeness","valuation","rights","presentation"],
  "testing_recommendations": ["..."],
  "variance_analysis": "...",
  "audit_adjustments": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE financial_reviews SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, reviewId]);
      await persistAIResult(req.user.id, 'analyze-financial', { reviewId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: SoD Analysis
router.post('/analyze-sod', auth, aiRateLimiter, async (req, res) => {
  try {
    const { sodId } = req.body;
    const result = await pool.query('SELECT * FROM sod_reviews WHERE id = $1', [sodId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SoD review not found' });
    const sod = result.rows[0];

    const prompt = `Analyze this SoD conflict. Return ONLY JSON:
Title: ${sod.title}, Description: ${sod.description}
Roles: ${sod.roles}, Risk Level: ${sod.risk_level}

Return:
{
  "severity": "Critical|High|Medium|Low",
  "fraud_scenarios": ["..."],
  "compensating_controls": ["..."],
  "role_redesign": "...",
  "monitoring_procedures": ["..."],
  "regulatory_impact": "...",
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE sod_reviews SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, sodId]);
      await persistAIResult(req.user.id, 'analyze-sod', { sodId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Generate Audit Report Summary
router.post('/generate-report', auth, aiRateLimiter, async (req, res) => {
  try {
    const { reportId } = req.body;
    const result = await pool.query('SELECT * FROM audit_reports WHERE id = $1', [reportId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit report not found' });
    const report = result.rows[0];

    const [deficiencies, controls] = await Promise.all([
      pool.query("SELECT COUNT(*) as cnt, severity FROM deficiencies WHERE status != 'Closed' GROUP BY severity"),
      pool.query('SELECT COUNT(*) as cnt, effectiveness FROM controls GROUP BY effectiveness')
    ]);

    const prompt = `Generate an audit report executive summary. Return ONLY JSON:
Report: ${report.title}, Type: ${report.type}
Period: ${report.period}, Auditor: ${report.auditor}
Deficiency Counts by Severity: ${JSON.stringify(deficiencies.rows)}
Control Effectiveness: ${JSON.stringify(controls.rows)}

Return:
{
  "executive_summary": "...",
  "overall_opinion": "Effective|Effective with Exceptions|Ineffective",
  "key_findings": ["..."],
  "management_actions": ["..."],
  "follow_up_items": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const summary = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE audit_reports SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [summary, reportId]);
      await persistAIResult(req.user.id, 'generate-report', { reportId }, parsed || { raw: aiText });
    }
    res.json({ summary: parsed || aiText, report_id: report.report_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Policy Gap Analysis
router.post('/analyze-policy', auth, aiRateLimiter, async (req, res) => {
  try {
    const { policyId } = req.body;
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [policyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    const policy = result.rows[0];

    const prompt = `Perform a SOX policy gap analysis. Return ONLY JSON:
Policy: ${policy.title}, Category: ${policy.category}
Description: ${policy.description}, Version: ${policy.version}

Return:
{
  "completeness_score": 0-100,
  "gaps": ["..."],
  "sox_alignment": "Fully Aligned|Partially Aligned|Not Aligned",
  "coso_coverage": {"control_environment": true, "risk_assessment": true, "control_activities": true, "information_communication": true, "monitoring": true},
  "recommendations": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE policies SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [analysis, policyId]);
      await persistAIResult(req.user.id, 'analyze-policy', { policyId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Audit Plan Suggestions
router.post('/suggest-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { planId } = req.body;
    const result = await pool.query('SELECT * FROM audit_plans WHERE id = $1', [planId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit plan not found' });
    const plan = result.rows[0];

    const risks = await pool.query('SELECT title, risk_score FROM risk_assessments WHERE risk_score >= 7 ORDER BY risk_score DESC LIMIT 5');

    const prompt = `Provide audit plan optimization suggestions. Return ONLY JSON:
Plan: ${plan.title}, Type: ${plan.audit_type}
Period: ${plan.period}, Scope: ${plan.scope}
Top Risks: ${JSON.stringify(risks.rows)}

Return:
{
  "priority_areas": ["..."],
  "resource_recommendations": "...",
  "timeline_optimization": ["..."],
  "sampling_approach": "...",
  "risk_coverage": {"high_risk": true, "medium_risk": true, "compliance": true},
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const suggestions = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE audit_plans SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [suggestions, planId]);
      await persistAIResult(req.user.id, 'suggest-plan', { planId }, parsed || { raw: aiText });
    }
    res.json({ suggestions: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Materiality Threshold Validator
router.post('/analyze-materiality', auth, aiRateLimiter, async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const result = await pool.query('SELECT * FROM materiality_assessments WHERE id = $1', [assessmentId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    const ma = result.rows[0];

    const benchmarkValue = parseFloat(ma.benchmark_value) || 0;
    const materialityAmount = parseFloat(ma.materiality_amount) || 0;
    const clearlyTrivial = parseFloat(ma.clearly_trivial) || 0;
    const percentOfBenchmark = benchmarkValue > 0 ? (materialityAmount / benchmarkValue * 100).toFixed(2) : 0;

    const prompt = `Validate this materiality assessment. Return ONLY JSON:
Benchmark: ${ma.benchmark} = $${benchmarkValue}
Materiality Amount: $${materialityAmount} (${percentOfBenchmark}% of benchmark)
Clearly Trivial: $${clearlyTrivial}
Period: ${ma.period}

Typical ranges: Pre-tax income 5-10%, Revenue 0.5-2%, Total assets 0.5-2%

Return:
{
  "threshold_valid": true/false,
  "formula_check": {"percentage_of_benchmark": "${percentOfBenchmark}%", "within_acceptable_range": true/false},
  "clearly_trivial_valid": true/false,
  "benchmark_appropriate": true/false,
  "qualitative_factors": ["..."],
  "recommended_adjustments": "...",
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE materiality_assessments SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, assessmentId]);
      await persistAIResult(req.user.id, 'analyze-materiality', { assessmentId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText, formula_data: { percentOfBenchmark, benchmarkValue, materialityAmount } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Incident Analysis
router.post('/analyze-incident', auth, aiRateLimiter, async (req, res) => {
  try {
    const { incidentId } = req.body;
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [incidentId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    const inc = result.rows[0];

    const prompt = `Analyze this SOX incident. Return ONLY JSON:
Title: ${inc.title}, Category: ${inc.category}
Severity: ${inc.severity}, Description: ${inc.description}

Return:
{
  "sox_impact": "Material|Significant|Minor|None",
  "control_failures": ["..."],
  "root_cause_analysis": "...",
  "remediation": ["..."],
  "preventive_measures": ["..."],
  "reporting_obligations": ["..."],
  "resolution_timeline": "...",
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const analysis = parsed ? JSON.stringify(parsed) : aiText;
    if (!aiText.includes('AI Analysis unavailable')) {
      await pool.query('UPDATE incidents SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, incidentId]);
      await persistAIResult(req.user.id, 'analyze-incident', { incidentId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────
// CUSTOM FEATURES
// ─────────────────────────────────────────────────────────────

// COSO 5-Component Control Environment Scoring
router.post('/coso-scoring', auth, aiRateLimiter, requireRole('admin', 'auditor', 'management'), async (req, res) => {
  try {
    const [controls, policies, incidents, deficiencies] = await Promise.all([
      pool.query('SELECT effectiveness, COUNT(*) as cnt FROM controls GROUP BY effectiveness'),
      pool.query('SELECT status, COUNT(*) as cnt FROM policies GROUP BY status'),
      pool.query('SELECT severity, COUNT(*) as cnt FROM incidents GROUP BY severity'),
      pool.query("SELECT severity, COUNT(*) as cnt FROM deficiencies WHERE status != 'Closed' GROUP BY severity")
    ]);

    const prompt = `Perform COSO 5-Component Framework scoring based on this data. Return ONLY JSON:
Control Effectiveness Distribution: ${JSON.stringify(controls.rows)}
Policy Status Distribution: ${JSON.stringify(policies.rows)}
Open Deficiencies by Severity: ${JSON.stringify(deficiencies.rows)}
Recent Incidents by Severity: ${JSON.stringify(incidents.rows)}

Return:
{
  "scores": {
    "control_environment": {"score": 1-5, "rationale": "..."},
    "risk_assessment": {"score": 1-5, "rationale": "..."},
    "control_activities": {"score": 1-5, "rationale": "..."},
    "information_communication": {"score": 1-5, "rationale": "..."},
    "monitoring": {"score": 1-5, "rationale": "..."}
  },
  "overall_score": 1-5,
  "overall_rating": "Strong|Satisfactory|Needs Improvement|Weak",
  "priority_improvements": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (parsed) {
      await persistAIResult(req.user.id, 'coso-scoring', {}, parsed);
      res.json({ scores: parsed });
    } else {
      res.json({ raw: aiText });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Audit Scope Memo Generator
router.post('/scope-memo', auth, aiRateLimiter, requireRole('admin', 'auditor'), async (req, res) => {
  try {
    const { planId, entityName, period, auditType } = req.body;

    let plan = null;
    if (planId) {
      const r = await pool.query('SELECT * FROM audit_plans WHERE id = $1', [planId]);
      if (r.rows.length > 0) plan = r.rows[0];
    }

    const topRisks = await pool.query('SELECT title, category, risk_score FROM risk_assessments WHERE status = $1 ORDER BY risk_score DESC LIMIT 10', ['Open']);
    const openDeficiencies = await pool.query("SELECT COUNT(*) as cnt FROM deficiencies WHERE status != 'Closed'");

    const prompt = `Generate a formal SOX audit scope memorandum. Return ONLY JSON:
Entity: ${entityName || plan?.title || 'Unknown'}
Audit Type: ${auditType || plan?.audit_type || 'SOX Compliance'}
Period: ${period || plan?.period || new Date().getFullYear()}
Scope: ${plan?.scope || 'Full SOX compliance audit'}
Top Risks: ${JSON.stringify(topRisks.rows)}
Open Deficiencies: ${openDeficiencies.rows[0].cnt}

Return:
{
  "memo": {
    "to": "Audit Committee",
    "from": "Internal Audit",
    "date": "${new Date().toLocaleDateString()}",
    "subject": "...",
    "background": "...",
    "objectives": ["..."],
    "scope": "...",
    "out_of_scope": ["..."],
    "methodology": "...",
    "timing": "...",
    "resources": "...",
    "risk_areas": ["..."]
  },
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (parsed) {
      await persistAIResult(req.user.id, 'scope-memo', { planId, entityName }, parsed);
    }
    res.json({ memo: parsed || { raw: aiText } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Risk Heat-Map Narrative Generator
router.post('/risk-heatmap', auth, aiRateLimiter, async (req, res) => {
  try {
    const risks = await pool.query('SELECT title, category, likelihood, impact, risk_score, status FROM risk_assessments ORDER BY risk_score DESC');

    const prompt = `Generate a risk heat-map narrative. Return ONLY JSON:
Risk Data: ${JSON.stringify(risks.rows)}

Return:
{
  "heat_map": {
    "critical": [{"title": "...", "score": 0}],
    "high": [{"title": "...", "score": 0}],
    "medium": [{"title": "...", "score": 0}],
    "low": [{"title": "...", "score": 0}]
  },
  "narrative": "comprehensive narrative text",
  "top_risks": ["..."],
  "concentration_areas": ["..."],
  "trending": "Increasing|Stable|Decreasing",
  "recommendations": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (parsed) {
      await persistAIResult(req.user.id, 'risk-heatmap', {}, parsed);
    }
    res.json({ heatmap: parsed || { raw: aiText }, risk_count: risks.rowCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cross-Entity Remediation Analyzer
router.post('/remediation-analyzer', auth, aiRateLimiter, async (req, res) => {
  try {
    const [deficiencies, remediations] = await Promise.all([
      pool.query("SELECT d.*, r.title as rem_title, r.status as rem_status, r.due_date as rem_due FROM deficiencies d LEFT JOIN remediations r ON r.deficiency_ref = d.deficiency_id WHERE d.status != 'Closed'"),
      pool.query("SELECT * FROM remediations WHERE status != 'Completed' ORDER BY due_date ASC LIMIT 20")
    ]);

    const prompt = `Analyze cross-entity remediation status. Return ONLY JSON:
Open Deficiencies with Remediations: ${JSON.stringify(deficiencies.rows.map(r => ({
  id: r.deficiency_id, title: r.title, severity: r.severity,
  remediation: r.rem_title, rem_status: r.rem_status, due_date: r.rem_due
})))}
Overdue/Pending Remediations: ${JSON.stringify(remediations.rows)}

Return:
{
  "overdue_items": [{"deficiency": "...", "remediation": "...", "days_overdue": 0}],
  "at_risk_items": ["..."],
  "completed_rate": 0-100,
  "bottlenecks": ["..."],
  "priority_actions": ["..."],
  "cross_entity_themes": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (parsed) {
      await persistAIResult(req.user.id, 'remediation-analyzer', {}, parsed);
    }
    res.json({ analysis: parsed || { raw: aiText }, counts: { deficiencies: deficiencies.rowCount, remediations: remediations.rowCount } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────
// NEW PROPOSED FEATURES
// ─────────────────────────────────────────────────────────────

// PCAOB-style Workpaper Reviewer
router.post('/workpaper-review', auth, aiRateLimiter, requireRole('admin', 'auditor'), async (req, res) => {
  try {
    const { planId } = req.body;

    const [plans, walkthroughs, evidence] = await Promise.all([
      pool.query('SELECT * FROM audit_plans WHERE id = $1', [planId]),
      pool.query('SELECT * FROM walkthroughs WHERE id IN (SELECT id FROM walkthroughs LIMIT 5)'),
      pool.query("SELECT COUNT(*) as cnt, status FROM evidence GROUP BY status")
    ]);

    const plan = plans.rows[0];

    const prompt = `Perform a PCAOB-style workpaper review. Return ONLY JSON:
Audit Plan: ${JSON.stringify(plan)}
Walkthroughs: ${JSON.stringify(walkthroughs.rows.slice(0, 3))}
Evidence Status: ${JSON.stringify(evidence.rows)}

Return:
{
  "findings": [
    {
      "as_standard": "AS 2201|AS 2305|AS 1105|AS 2301",
      "finding": "...",
      "severity": "Critical|Significant|Minor",
      "recommendation": "..."
    }
  ],
  "completeness_score": 0-100,
  "documentation_gaps": ["..."],
  "overall_conclusion": "Pass|Pass with Comments|Fail",
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (parsed) {
      await persistAIResult(req.user.id, 'workpaper-review', { planId }, parsed);
    }
    res.json({ review: parsed || { raw: aiText } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Continuous Controls Monitoring
router.post('/controls-monitor', auth, aiRateLimiter, async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS controls_monitoring (
        id SERIAL PRIMARY KEY,
        analysis JSONB,
        drift_detected BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const [controls, lastAnalysis] = await Promise.all([
      pool.query("SELECT * FROM controls WHERE effectiveness IN ('Ineffective','Partially Effective') OR status = 'Pending'"),
      pool.query('SELECT * FROM controls_monitoring ORDER BY created_at DESC LIMIT 1')
    ]);

    const previous = lastAnalysis.rows[0]?.analysis;

    const prompt = `Analyze controls for drift and monitoring signals. Return ONLY JSON:
Current Problematic Controls: ${JSON.stringify(controls.rows.map(c => ({
  id: c.control_id, name: c.name, effectiveness: c.effectiveness, status: c.status
})))}
Previous Analysis: ${previous ? JSON.stringify(previous).substring(0, 500) : 'None'}

Return:
{
  "drift_detected": true/false,
  "drifted_controls": [{"control_id": "...", "issue": "...", "change": "..."}],
  "monitoring_alerts": [{"control_id": "...", "alert": "...", "severity": "High|Medium|Low"}],
  "trend": "Improving|Stable|Deteriorating",
  "immediate_actions": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    const driftDetected = parsed?.drift_detected || false;

    if (parsed) {
      await pool.query(
        'INSERT INTO controls_monitoring (analysis, drift_detected) VALUES ($1, $2)',
        [JSON.stringify(parsed), driftDetected]
      );
      await persistAIResult(req.user.id, 'controls-monitor', {}, parsed);
    }
    res.json({ monitoring: parsed || { raw: aiText }, drift_detected: driftDetected });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Regulatory Update Briefing
router.post('/regulatory-update', auth, aiRateLimiter, async (req, res) => {
  try {
    const [compliance, policies] = await Promise.all([
      pool.query('SELECT section, requirement, status FROM compliance_items ORDER BY created_at DESC LIMIT 20'),
      pool.query("SELECT title, category, version FROM policies WHERE status = 'Active'")
    ]);

    const prompt = `Generate a regulatory update briefing for SOX compliance. Return ONLY JSON:
Current Compliance Items: ${JSON.stringify(compliance.rows)}
Active Policies: ${JSON.stringify(policies.rows)}

Return:
{
  "briefing": {
    "date": "${new Date().toLocaleDateString()}",
    "key_updates": [{"regulation": "...", "change": "...", "effective_date": "...", "impact": "High|Medium|Low"}],
    "affected_policies": ["..."],
    "action_items": [{"item": "...", "priority": "High|Medium|Low", "deadline": "..."}],
    "upcoming_deadlines": ["..."]
  },
  "compliance_gaps": ["..."],
  "summary": "..."
}`;

    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (parsed) {
      await persistAIResult(req.user.id, 'regulatory-update', {}, parsed);
    }
    res.json({ briefing: parsed || { raw: aiText } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Audit Log endpoint
router.get('/audit-log', auth, requireRole('admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [countResult, dataResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM audit_log'),
      pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset])
    ]);
    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].count), totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit) }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Workflow state machine for deficiency → remediation → verification
router.post('/workflow/transition', auth, requireRole('admin', 'auditor'), async (req, res) => {
  try {
    const { entityType, entityId, newState } = req.body;

    const validTransitions = {
      deficiencies: {
        open: ['in_remediation'],
        in_remediation: ['under_verification'],
        under_verification: ['closed', 'open'],
        closed: []
      },
      remediations: {
        pending: ['in_progress'],
        in_progress: ['completed', 'pending'],
        completed: ['verified'],
        verified: []
      }
    };

    if (!validTransitions[entityType]) {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    const tableName = entityType;
    const current = await pool.query(`SELECT workflow_state FROM ${tableName} WHERE id = $1`, [entityId]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Entity not found' });

    const currentState = current.rows[0].workflow_state || 'open';
    const allowed = validTransitions[entityType][currentState] || [];

    if (!allowed.includes(newState)) {
      return res.status(400).json({ error: `Cannot transition from '${currentState}' to '${newState}'. Allowed: ${allowed.join(', ')}` });
    }

    await pool.query(`UPDATE ${tableName} SET workflow_state = $1, updated_at = NOW() WHERE id = $2`, [newState, entityId]);
    await pool.query(
      'INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, new_data) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, req.user.email, 'WORKFLOW_TRANSITION', entityType, entityId, JSON.stringify({ from: currentState, to: newState })]
    );

    res.json({ message: `Transitioned from '${currentState}' to '${newState}'`, entity_type: entityType, entity_id: entityId, new_state: newState });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Sampling recommendation — test sample size based on risk/materiality
router.post('/sampling-recommendation', auth, aiRateLimiter, async (req, res) => {
  try {
    const { controlId, populationSize, materialityThreshold, riskLevel } = req.body;
    let control = null;
    if (controlId) {
      const r = await pool.query('SELECT * FROM controls WHERE id = $1', [controlId]);
      control = r.rows[0] || null;
    }
    const prompt = `You are a SOX audit sampling expert. Recommend a sample size and methodology for control testing.
Control: ${control ? JSON.stringify(control) : '(not provided)'}
Population size: ${populationSize || 'unknown'}
Materiality threshold: ${materialityThreshold || 'unknown'}
Risk level: ${riskLevel || 'medium'}

Return JSON:
{
  "recommended_sample_size": <number>,
  "sampling_methodology": "attribute|variables|MUS|haphazard|systematic",
  "rationale": "...",
  "tolerable_deviation_rate": <number>,
  "expected_deviation_rate": <number>,
  "confidence_level_pct": <number>,
  "notes": "..."
}`;
    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (!aiText.includes('AI Analysis unavailable')) {
      await persistAIResult(req.user.id, 'sampling-recommendation', { controlId, populationSize, materialityThreshold, riskLevel }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Evidence quality assessment — is the provided evidence sufficient/appropriate?
router.post('/evidence-quality', auth, aiRateLimiter, async (req, res) => {
  try {
    const { controlId, evidenceDescription, evidenceMetadata } = req.body;
    let control = null;
    if (controlId) {
      const r = await pool.query('SELECT * FROM controls WHERE id = $1', [controlId]);
      control = r.rows[0] || null;
    }
    const prompt = `You are a SOX audit evidence-quality expert. Assess whether the provided evidence is sufficient and appropriate per PCAOB AS 1105.
Control: ${control ? JSON.stringify(control) : '(not provided)'}
Evidence description: ${evidenceDescription || ''}
Evidence metadata: ${evidenceMetadata ? JSON.stringify(evidenceMetadata) : ''}

Return JSON:
{
  "sufficient": <boolean>,
  "appropriate": <boolean>,
  "relevance_score": <0-100>,
  "reliability_score": <0-100>,
  "gaps": ["..."],
  "additional_evidence_needed": ["..."],
  "rationale": "..."
}`;
    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (!aiText.includes('AI Analysis unavailable')) {
      await persistAIResult(req.user.id, 'evidence-quality', { controlId }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Anomaly detection over GL/AP transaction feeds
// Caller passes either a `transactions` array (paste) or a population summary; AI flags anomalies.
router.post('/anomaly-detection', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!hasApiKey()) {
      return res.status(503).json({ error: 'AI not configured: set OPENROUTER_API_KEY in server environment.' });
    }
    const { transactions, feed = 'GL', period, materialityThreshold, contextNotes } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: '`transactions` (non-empty array) is required.' });
    }
    // Cap to first 200 to stay within model context.
    const sample = transactions.slice(0, 200);
    const prompt = `You are a SOX-trained transaction anomaly-detection analyst. Examine the following ${feed} transactions and flag anomalies (round numbers, weekend/late-night postings, just-below-threshold amounts, duplicate vendors, unusual GL accounts, manual journal entries, posting/approval-by-same-user, out-of-period entries, abnormal velocity). Be precise and reference row indices.
Period: ${period || 'unspecified'}
Materiality threshold: ${materialityThreshold || 'unspecified'}
Context notes: ${contextNotes || 'none'}

Transactions (JSON, capped at 200 rows):
${JSON.stringify(sample)}

Return ONLY JSON:
{
  "anomalies": [
    {
      "row_indices": [<number>],
      "anomaly_type": "round_number|weekend_posting|just_below_threshold|duplicate_vendor|unusual_gl_account|manual_je|self_approved|out_of_period|velocity_spike|other",
      "severity": "Critical|High|Medium|Low",
      "description": "...",
      "amount": <number|null>,
      "recommended_followup": "..."
    }
  ],
  "summary_statistics": {
    "transactions_examined": <number>,
    "anomalies_flagged": <number>,
    "by_severity": {"Critical": <number>, "High": <number>, "Medium": <number>, "Low": <number>}
  },
  "concentration_risks": ["..."],
  "summary": "..."
}`;
    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (!aiText.includes('AI Analysis unavailable')) {
      await persistAIResult(req.user.id, 'anomaly-detection', { feed, period, materialityThreshold, transactionCount: transactions.length }, parsed || { raw: aiText });
    }
    res.json({ analysis: parsed || aiText, examined: sample.length, total_provided: transactions.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: GL/AP anomaly detection — caller-supplied feed, schema-light variant.
// Body: { feed_type: "GL"|"AP", entries: [{id, date, account, amount, vendor?, description?, approver?}],
//         lookback_period?, materiality_threshold? }
// Returns: { anomalies: [{entry_id, anomaly_type, severity, sox_control_implicated, suggested_test, rationale}],
//            summary, recommended_followups }
router.post('/gl-ap-anomaly-detection', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!hasApiKey()) {
      return res.status(503).json({ error: 'AI not configured: set OPENROUTER_API_KEY in server environment.' });
    }
    const { feed_type, entries, lookback_period, materiality_threshold } = req.body || {};
    const feed = (feed_type === 'AP' ? 'AP' : 'GL');
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: '`entries` (non-empty array) is required.' });
    }
    // Cap to first 200 entries to stay within model context.
    const sample = entries.slice(0, 200);
    const prompt = `You are a SOX-trained anomaly-detection analyst examining a ${feed} feed. Flag anomalies indicative of fraud, error, or control failure (round-dollar amounts, weekend/holiday/late-night postings, just-below-approval-threshold amounts, duplicate vendors/invoices, unusual or rarely-used GL accounts, manual journal entries, self-approval / preparer=approver, out-of-period postings, velocity spikes, split transactions). Reference the entry by its supplied id.
Feed: ${feed}
Lookback period: ${lookback_period || 'unspecified'}
Materiality threshold: ${materiality_threshold || 'unspecified'}

Entries (JSON, capped at 200 rows):
${JSON.stringify(sample)}

Return ONLY JSON in this exact shape:
{
  "anomalies": [
    {
      "entry_id": "<id from input>",
      "anomaly_type": "round_dollar|weekend_posting|just_below_threshold|duplicate_vendor|duplicate_invoice|unusual_gl_account|manual_je|self_approved|out_of_period|velocity_spike|split_transaction|other",
      "severity": "Critical|High|Medium|Low",
      "sox_control_implicated": "<e.g., Segregation of Duties, JE Approval, Vendor Master Maintenance, Period-End Close Cutoff>",
      "suggested_test": "<concrete audit procedure>",
      "rationale": "<why this is anomalous, cite specific values>"
    }
  ],
  "summary": {
    "feed_type": "${feed}",
    "entries_examined": <number>,
    "anomalies_flagged": <number>,
    "by_severity": {"Critical": <number>, "High": <number>, "Medium": <number>, "Low": <number>},
    "top_control_implications": ["..."]
  },
  "recommended_followups": ["..."]
}`;
    const aiText = await queryAI(prompt);
    const parsed = parseAIJson(aiText);
    if (!aiText.includes('AI Analysis unavailable')) {
      await persistAIResult(req.user.id, 'gl-ap-anomaly-detection', {
        feed_type: feed,
        lookback_period,
        materiality_threshold,
        entry_count: entries.length
      }, parsed || { raw: aiText });
    }
    const payload = parsed && typeof parsed === 'object'
      ? {
          anomalies: parsed.anomalies || [],
          summary: parsed.summary || { feed_type: feed, entries_examined: sample.length, anomalies_flagged: (parsed.anomalies || []).length },
          recommended_followups: parsed.recommended_followups || []
        }
      : { anomalies: [], summary: { feed_type: feed, entries_examined: sample.length, anomalies_flagged: 0, raw: aiText }, recommended_followups: [] };
    res.json(payload);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
