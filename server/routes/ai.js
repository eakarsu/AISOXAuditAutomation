const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { queryAI } = require('../config/openrouter');
const router = express.Router();

// AI: Analyze Control Effectiveness
router.post('/analyze-control', auth, async (req, res) => {
  try {
    const { controlId } = req.body;
    const result = await pool.query('SELECT * FROM controls WHERE id = $1', [controlId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Control not found' });
    const control = result.rows[0];

    const prompt = `Analyze the following SOX control for effectiveness and provide recommendations:
Control ID: ${control.control_id}
Name: ${control.name}
Description: ${control.description}
Category: ${control.category}
Frequency: ${control.frequency}
Current Status: ${control.status}
Current Effectiveness: ${control.effectiveness}

Provide:
1. Effectiveness assessment (Effective/Partially Effective/Ineffective)
2. Key strengths
3. Identified weaknesses
4. Specific recommendations for improvement
5. Risk rating (High/Medium/Low)`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE controls SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, controlId]);
    res.json({ analysis, control_id: control.control_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Risk Assessment Analysis
router.post('/analyze-risk', auth, async (req, res) => {
  try {
    const { riskId } = req.body;
    const result = await pool.query('SELECT * FROM risk_assessments WHERE id = $1', [riskId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Risk not found' });
    const risk = result.rows[0];

    const prompt = `Analyze the following risk assessment and provide a comprehensive evaluation:
Risk ID: ${risk.risk_id}
Title: ${risk.title}
Description: ${risk.description}
Category: ${risk.category}
Likelihood: ${risk.likelihood}
Impact: ${risk.impact}
Current Risk Score: ${risk.risk_score}
Current Mitigation: ${risk.mitigation}

Provide:
1. Risk scoring validation (is the current score appropriate?)
2. Detailed impact analysis
3. Mitigation strategy recommendations
4. Residual risk assessment
5. Monitoring recommendations
6. Priority ranking`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE risk_assessments SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, riskId]);
    res.json({ analysis, risk_id: risk.risk_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Deficiency Classification
router.post('/analyze-deficiency', auth, async (req, res) => {
  try {
    const { deficiencyId } = req.body;
    const result = await pool.query('SELECT * FROM deficiencies WHERE id = $1', [deficiencyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deficiency not found' });
    const def = result.rows[0];

    const prompt = `Classify and analyze the following SOX audit deficiency:
Deficiency ID: ${def.deficiency_id}
Title: ${def.title}
Description: ${def.description}
Related Control: ${def.control_ref}
Current Severity: ${def.severity}
Classification: ${def.classification}

Provide:
1. Deficiency classification (Material Weakness / Significant Deficiency / Control Deficiency)
2. Justification for the classification
3. Potential financial statement impact
4. Recommended remediation steps with timeline
5. Management response suggestions
6. Compensating controls recommendations`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE deficiencies SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, deficiencyId]);
    res.json({ analysis, deficiency_id: def.deficiency_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Generate Control Narrative
router.post('/generate-narrative', auth, async (req, res) => {
  try {
    const { walkthroughId } = req.body;
    const result = await pool.query('SELECT * FROM walkthroughs WHERE id = $1', [walkthroughId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Walkthrough not found' });
    const wt = result.rows[0];

    const prompt = `Generate a professional SOX control narrative for the following walkthrough:
Process: ${wt.process_name}
Description: ${wt.description}
Department: ${wt.department}
Participants: ${wt.participants}
Findings: ${wt.findings}

Generate a comprehensive control narrative that includes:
1. Process overview
2. Key control points
3. Control activities performed
4. Information used in the control
5. Frequency and timing
6. Evidence of control operation
7. Potential risk areas`;

    const narrative = await queryAI(prompt);
    await pool.query('UPDATE walkthroughs SET ai_narrative = $1, updated_at = NOW() WHERE id = $2', [narrative, walkthroughId]);
    res.json({ narrative, walkthrough_id: wt.walkthrough_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: ITGC Analysis
router.post('/analyze-itgc', auth, async (req, res) => {
  try {
    const { itgcId } = req.body;
    const result = await pool.query('SELECT * FROM itgc_controls WHERE id = $1', [itgcId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'ITGC control not found' });
    const itgc = result.rows[0];

    const prompt = `Analyze the following IT General Control for SOX compliance:
ITGC ID: ${itgc.itgc_id}
Name: ${itgc.name}
Description: ${itgc.description}
Category: ${itgc.category}
System: ${itgc.system_name}
Control Type: ${itgc.control_type}
Test Result: ${itgc.test_result}

Provide:
1. Control adequacy assessment
2. Testing sufficiency evaluation
3. Gap analysis
4. Remediation recommendations
5. Industry best practice comparison
6. Impact on dependent business controls`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE itgc_controls SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, itgcId]);
    res.json({ analysis, itgc_id: itgc.itgc_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Financial Statement Analysis
router.post('/analyze-financial', auth, async (req, res) => {
  try {
    const { reviewId } = req.body;
    const result = await pool.query('SELECT * FROM financial_reviews WHERE id = $1', [reviewId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Financial review not found' });
    const fr = result.rows[0];

    const prompt = `Analyze the following financial statement line item for SOX audit purposes:
Account: ${fr.account_name}
Description: ${fr.description}
Period: ${fr.period}
Current Balance: $${fr.balance}
Prior Balance: $${fr.prior_balance}
Variance: ${fr.variance_pct}%

Provide:
1. Variance analysis and explanation
2. Risk assessment for material misstatement
3. Substantive testing recommendations
4. Analytical procedure results
5. Key assertions to test
6. Potential audit adjustments`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE financial_reviews SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, reviewId]);
    res.json({ analysis, review_id: fr.review_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: SoD Conflict Analysis
router.post('/analyze-sod', auth, async (req, res) => {
  try {
    const { sodId } = req.body;
    const result = await pool.query('SELECT * FROM sod_reviews WHERE id = $1', [sodId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'SoD review not found' });
    const sod = result.rows[0];

    const prompt = `Analyze the following Segregation of Duties conflict:
User: ${sod.user_name}
Role 1: ${sod.role_1}
Role 2: ${sod.role_2}
System: ${sod.system_name}
Conflict Type: ${sod.conflict_type}
Current Risk Level: ${sod.risk_level}

Provide:
1. Conflict severity assessment
2. Potential fraud scenarios
3. Compensating control recommendations
4. Role redesign suggestions
5. Monitoring procedures
6. Regulatory compliance impact`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE sod_reviews SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, sodId]);
    res.json({ analysis, sod_id: sod.sod_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Generate Audit Report Summary
router.post('/generate-report', auth, async (req, res) => {
  try {
    const { reportId } = req.body;
    const result = await pool.query('SELECT * FROM audit_reports WHERE id = $1', [reportId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit report not found' });
    const report = result.rows[0];

    const deficiencies = await pool.query('SELECT * FROM deficiencies WHERE status != $1', ['Closed']);
    const controls = await pool.query('SELECT COUNT(*) as total, effectiveness FROM controls GROUP BY effectiveness');

    const prompt = `Generate a professional audit report executive summary:
Report: ${report.title}
Type: ${report.audit_type}
Scope: ${report.scope}
Period: ${report.period}
Lead Auditor: ${report.lead_auditor}
Open Deficiencies: ${deficiencies.rows.length}
Control Effectiveness Summary: ${JSON.stringify(controls.rows)}

Generate:
1. Executive summary
2. Scope and objectives
3. Key findings summary
4. Overall assessment and opinion
5. Management action items
6. Follow-up recommendations`;

    const summary = await queryAI(prompt);
    await pool.query('UPDATE audit_reports SET ai_summary = $1, updated_at = NOW() WHERE id = $2', [summary, reportId]);
    res.json({ summary, report_id: report.report_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Policy Gap Analysis
router.post('/analyze-policy', auth, async (req, res) => {
  try {
    const { policyId } = req.body;
    const result = await pool.query('SELECT * FROM policies WHERE id = $1', [policyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Policy not found' });
    const policy = result.rows[0];

    const prompt = `Perform a gap analysis on the following SOX-related policy:
Policy: ${policy.title}
Description: ${policy.description}
Category: ${policy.category}
Version: ${policy.version}
Effective Date: ${policy.effective_date}
Review Date: ${policy.review_date}

Provide:
1. Policy completeness assessment
2. Identified gaps against SOX requirements
3. Alignment with COSO framework
4. Recommended updates
5. Implementation guidance
6. Training recommendations`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE policies SET ai_gap_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, policyId]);
    res.json({ analysis, policy_id: policy.policy_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Audit Plan Suggestions
router.post('/suggest-plan', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const result = await pool.query('SELECT * FROM audit_plans WHERE id = $1', [planId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit plan not found' });
    const plan = result.rows[0];

    const risks = await pool.query('SELECT * FROM risk_assessments WHERE risk_score >= 7 ORDER BY risk_score DESC LIMIT 5');

    const prompt = `Provide AI suggestions for the following audit plan:
Plan: ${plan.title}
Type: ${plan.audit_type}
Period: ${plan.start_date} to ${plan.end_date}
Lead: ${plan.lead_auditor}
Team: ${plan.team_members}
Budget: $${plan.budget}
Top Risks: ${JSON.stringify(risks.rows.map(r => ({ title: r.title, score: r.risk_score })))}

Provide:
1. Resource allocation recommendations
2. Risk-based prioritization
3. Timeline optimization
4. Key focus areas based on risk profile
5. Sampling methodology recommendations
6. Communication plan suggestions`;

    const suggestions = await queryAI(prompt);
    await pool.query('UPDATE audit_plans SET ai_suggestions = $1, updated_at = NOW() WHERE id = $2', [suggestions, planId]);
    res.json({ suggestions, plan_id: plan.plan_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Materiality Analysis
router.post('/analyze-materiality', auth, async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const result = await pool.query('SELECT * FROM materiality_assessments WHERE id = $1', [assessmentId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assessment not found' });
    const ma = result.rows[0];

    const prompt = `Analyze the following materiality assessment:
Title: ${ma.title}
Benchmark: ${ma.benchmark}
Benchmark Value: $${ma.benchmark_value}
Materiality Threshold: $${ma.materiality_threshold}
Tolerable Misstatement: $${ma.tolerable_misstatement}
Period: ${ma.period}

Provide:
1. Materiality threshold validation
2. Benchmark appropriateness assessment
3. Tolerable misstatement evaluation
4. Qualitative factors to consider
5. Comparison with industry standards
6. Recommendations for adjustments`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE materiality_assessments SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, assessmentId]);
    res.json({ analysis, assessment_id: ma.assessment_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Incident Analysis
router.post('/analyze-incident', auth, async (req, res) => {
  try {
    const { incidentId } = req.body;
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [incidentId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    const inc = result.rows[0];

    const prompt = `Analyze the following security/compliance incident for SOX implications:
Incident: ${inc.title}
Description: ${inc.description}
Category: ${inc.category}
Severity: ${inc.severity}
Reported Date: ${inc.reported_date}
Root Cause: ${inc.root_cause}

Provide:
1. SOX compliance impact assessment
2. Control failure analysis
3. Root cause deep-dive
4. Remediation recommendations
5. Preventive measures
6. Reporting obligations
7. Timeline for resolution`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE incidents SET ai_analysis = $1, updated_at = NOW() WHERE id = $2', [analysis, incidentId]);
    res.json({ analysis, incident_id: inc.incident_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Evidence Sufficiency Analysis
router.post('/analyze-evidence', auth, async (req, res) => {
  try {
    const { evidenceId } = req.body;
    const result = await pool.query('SELECT * FROM evidence WHERE id = $1', [evidenceId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evidence not found' });
    const ev = result.rows[0];

    const prompt = `Analyze the following audit evidence for sufficiency and appropriateness per SOX standards:
Evidence ID: ${ev.evidence_id}
Title: ${ev.title}
Description: ${ev.description}
Control Reference: ${ev.control_ref}
Type: ${ev.type}
Source: ${ev.source}
Collected By: ${ev.collected_by}
Collection Date: ${ev.collected_date}
Status: ${ev.status}
Notes: ${ev.notes}

Provide:
1. Evidence sufficiency assessment (is there enough evidence?)
2. Evidence appropriateness evaluation (is it the right type?)
3. Reliability assessment based on source
4. Completeness check - what additional evidence may be needed
5. Chain of custody concerns
6. Recommendations for strengthening the evidence package
7. PCAOB standard alignment check`;

    const analysis = await queryAI(prompt);
    await pool.query('UPDATE evidence SET notes = COALESCE(notes, \'\') || E\'\\n\\n[AI Analysis]\\n\' || $1, updated_at = NOW() WHERE id = $2', [analysis, evidenceId]);
    res.json({ analysis, evidence_id: ev.evidence_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Compliance Gap Assessment
router.post('/analyze-compliance', auth, async (req, res) => {
  try {
    const { complianceId } = req.body;
    const result = await pool.query('SELECT * FROM compliance_items WHERE id = $1', [complianceId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compliance item not found' });
    const ci = result.rows[0];

    const allItems = await pool.query('SELECT section, status, COUNT(*) as cnt FROM compliance_items GROUP BY section, status');

    const prompt = `Analyze the following SOX compliance requirement and provide gap assessment:
Item ID: ${ci.item_id}
SOX Section: ${ci.section}
Requirement: ${ci.requirement}
Description: ${ci.description}
Current Status: ${ci.status}
Assignee: ${ci.assignee}
Due Date: ${ci.due_date}
Overall Compliance Status: ${JSON.stringify(allItems.rows)}

Provide:
1. Detailed requirement interpretation
2. Gap analysis - what's missing for full compliance
3. Specific action items to achieve compliance
4. Regulatory risk if not addressed by due date
5. Best practices from peer companies
6. Documentation requirements
7. Testing procedures to validate compliance`;

    const analysis = await queryAI(prompt);
    res.json({ analysis, item_id: ci.item_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Management Review Assessment
router.post('/analyze-review', auth, async (req, res) => {
  try {
    const { reviewId } = req.body;
    const result = await pool.query('SELECT * FROM management_reviews WHERE id = $1', [reviewId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Review not found' });
    const rev = result.rows[0];

    const prompt = `Analyze the following management review control for SOX compliance effectiveness:
Review ID: ${rev.review_id}
Title: ${rev.title}
Description: ${rev.description}
Review Type: ${rev.review_type}
Reviewer: ${rev.reviewer}
Review Date: ${rev.review_date}
Period: ${rev.period}
Findings: ${rev.findings}
Conclusion: ${rev.conclusion}
Status: ${rev.status}

Provide:
1. Review quality assessment - is it thorough enough?
2. Reviewer competency evaluation considerations
3. Timeliness assessment
4. Follow-up action adequacy
5. Documentation sufficiency for audit evidence
6. Precision level assessment (threshold for investigation)
7. Recommendations for improving the MRC process
8. Common pitfalls to avoid`;

    const analysis = await queryAI(prompt);
    res.json({ analysis, review_id: rev.review_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Access Review Risk Analysis
router.post('/analyze-access', auth, async (req, res) => {
  try {
    const { accessId } = req.body;
    const result = await pool.query('SELECT * FROM access_reviews WHERE id = $1', [accessId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Access review not found' });
    const ar = result.rows[0];

    const allAccess = await pool.query('SELECT system_name, access_level, COUNT(*) as cnt FROM access_reviews GROUP BY system_name, access_level');

    const prompt = `Analyze the following user access for security and SOX compliance risks:
Review ID: ${ar.review_id}
User: ${ar.user_name}
System: ${ar.system_name}
Access Level: ${ar.access_level}
Department: ${ar.department}
Last Login: ${ar.last_login}
Appropriateness: ${ar.appropriate}
Notes: ${ar.notes}
System-wide Access Distribution: ${JSON.stringify(allAccess.rows)}

Provide:
1. Access appropriateness assessment
2. Least privilege principle evaluation
3. Risk rating (High/Medium/Low) with justification
4. Potential SoD conflicts with this access level
5. Stale account risk assessment (based on last login)
6. Recommendations for access modification
7. Monitoring controls needed
8. Compliance implications`;

    const analysis = await queryAI(prompt);
    res.json({ analysis, review_id: ar.review_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Change Risk Assessment
router.post('/analyze-change', auth, async (req, res) => {
  try {
    const { changeId } = req.body;
    const result = await pool.query('SELECT * FROM change_requests WHERE id = $1', [changeId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Change request not found' });
    const cr = result.rows[0];

    const prompt = `Analyze the following IT change request for SOX compliance and risk impact:
Change ID: ${cr.change_id}
Title: ${cr.title}
Description: ${cr.description}
System: ${cr.system_name}
Change Type: ${cr.change_type}
Requestor: ${cr.requestor}
Approver: ${cr.approver}
Request Date: ${cr.request_date}
Implementation Date: ${cr.implementation_date}
Status: ${cr.status}
Risk Level: ${cr.risk_level}

Provide:
1. Change risk assessment (impact on financial reporting)
2. Approval process adequacy evaluation
3. Testing requirements before deployment
4. Rollback plan recommendations
5. SOX impact analysis (does this change affect ICFR?)
6. Segregation of duties check (developer vs deployer)
7. Post-implementation review requirements
8. Documentation completeness check`;

    const analysis = await queryAI(prompt);
    res.json({ analysis, change_id: cr.change_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Remediation Plan Assessment
router.post('/analyze-remediation', auth, async (req, res) => {
  try {
    const { remediationId } = req.body;
    const result = await pool.query('SELECT * FROM remediations WHERE id = $1', [remediationId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Remediation not found' });
    const rem = result.rows[0];

    let deficiency = null;
    if (rem.deficiency_ref) {
      const defResult = await pool.query('SELECT * FROM deficiencies WHERE deficiency_id = $1', [rem.deficiency_ref]);
      if (defResult.rows.length > 0) deficiency = defResult.rows[0];
    }

    const prompt = `Evaluate the following remediation plan for completeness and effectiveness:
Remediation ID: ${rem.remediation_id}
Title: ${rem.title}
Description: ${rem.description}
Related Deficiency: ${rem.deficiency_ref}
${deficiency ? `Deficiency Details: ${deficiency.title} - ${deficiency.description} (Severity: ${deficiency.severity}, Classification: ${deficiency.classification})` : ''}
Action Plan: ${rem.action_plan}
Owner: ${rem.owner}
Priority: ${rem.priority}
Due Date: ${rem.due_date}
Status: ${rem.status}
Verification: ${rem.verification}

Provide:
1. Remediation plan completeness assessment
2. Is the action plan sufficient to address the root cause?
3. Timeline feasibility evaluation
4. Resource adequacy assessment
5. Verification/testing approach recommendations
6. Risk of remediation failure
7. Interim compensating controls needed
8. Sustainability assessment (will the fix last?)`;

    const analysis = await queryAI(prompt);
    res.json({ analysis, remediation_id: rem.remediation_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Freeform Audit Question
router.post('/ask', auth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const [controls, risks, deficiencies, compliance] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, effectiveness FROM controls GROUP BY effectiveness'),
      pool.query('SELECT COUNT(*) as total, status FROM risk_assessments GROUP BY status'),
      pool.query('SELECT COUNT(*) as total, severity, status FROM deficiencies GROUP BY severity, status'),
      pool.query('SELECT COUNT(*) as total, status FROM compliance_items GROUP BY status'),
    ]);

    const prompt = `You are an AI SOX audit assistant. Answer the following question using the audit program context below.

Current Audit Program State:
- Controls: ${JSON.stringify(controls.rows)}
- Risks: ${JSON.stringify(risks.rows)}
- Deficiencies: ${JSON.stringify(deficiencies.rows)}
- Compliance: ${JSON.stringify(compliance.rows)}

Question: ${question}

Provide a detailed, professional answer with specific recommendations where applicable.`;

    const answer = await queryAI(prompt);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Generate Full Audit Scope Memo
router.post('/generate-scope-memo', auth, async (req, res) => {
  try {
    const [controls, risks, plans, deficiencies] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM controls'),
      pool.query('SELECT * FROM risk_assessments WHERE risk_score >= 7 ORDER BY risk_score DESC LIMIT 10'),
      pool.query('SELECT * FROM audit_plans WHERE status IN (\'Planning\', \'Executing\') LIMIT 5'),
      pool.query('SELECT * FROM deficiencies WHERE status = \'Open\' ORDER BY severity DESC LIMIT 10'),
    ]);

    const prompt = `Generate a comprehensive SOX audit scope memo for the current audit cycle:

Context:
- Total controls in scope: ${controls.rows[0].total}
- High-risk items: ${JSON.stringify(risks.rows.map(r => ({ title: r.title, score: r.risk_score })))}
- Active audit plans: ${JSON.stringify(plans.rows.map(p => ({ title: p.title, type: p.audit_type, status: p.status })))}
- Open deficiencies: ${JSON.stringify(deficiencies.rows.map(d => ({ title: d.title, severity: d.severity, classification: d.classification })))}

Generate:
1. Audit scope and objectives
2. Significant accounts and processes in scope
3. Risk-based scoping rationale
4. ITGC scope determination
5. Sampling approach
6. Timeline and milestones
7. Resource requirements
8. Key stakeholders`;

    const memo = await queryAI(prompt);
    res.json({ memo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Regulatory Update Analysis
router.post('/regulatory-update', auth, async (req, res) => {
  try {
    const policies = await pool.query('SELECT title, category, version, effective_date FROM policies WHERE status = \'Active\'');

    const prompt = `As a SOX compliance expert, provide a regulatory update briefing:

Current Active Policies: ${JSON.stringify(policies.rows)}

Provide:
1. Recent SEC/PCAOB regulatory changes affecting SOX compliance
2. Upcoming regulatory deadlines and requirements
3. Impact assessment on current audit program
4. Recommended policy updates needed
5. Industry trends in SOX compliance
6. Technology and automation recommendations
7. Training needs based on regulatory changes`;

    const analysis = await queryAI(prompt);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Risk Heat Map Data
router.post('/risk-heatmap', auth, async (req, res) => {
  try {
    const risks = await pool.query('SELECT * FROM risk_assessments ORDER BY risk_score DESC');

    const prompt = `Analyze the following risk portfolio and provide a risk heat map narrative:

Risks: ${JSON.stringify(risks.rows.map(r => ({ title: r.title, category: r.category, likelihood: r.likelihood, impact: r.impact, score: r.risk_score, status: r.status })))}

Provide:
1. Overall risk landscape summary
2. Top 5 risks requiring immediate attention
3. Risk concentration analysis (by category)
4. Trend analysis and emerging risks
5. Risk appetite recommendations
6. Mitigation prioritization matrix
7. Board-level risk summary`;

    const analysis = await queryAI(prompt);
    res.json({ analysis, risks: risks.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Control Environment Assessment
router.post('/control-environment', auth, async (req, res) => {
  try {
    const [controls, deficiencies, itgc] = await Promise.all([
      pool.query('SELECT effectiveness, COUNT(*) as cnt FROM controls GROUP BY effectiveness'),
      pool.query('SELECT classification, COUNT(*) as cnt FROM deficiencies WHERE status != \'Closed\' GROUP BY classification'),
      pool.query('SELECT test_result, COUNT(*) as cnt FROM itgc_controls GROUP BY test_result'),
    ]);

    const prompt = `Assess the overall control environment based on the following data:

Control Effectiveness: ${JSON.stringify(controls.rows)}
Open Deficiencies by Classification: ${JSON.stringify(deficiencies.rows)}
ITGC Test Results: ${JSON.stringify(itgc.rows)}

Provide a COSO-framework based assessment:
1. Control Environment tone and culture assessment
2. Risk Assessment process maturity
3. Control Activities effectiveness
4. Information & Communication adequacy
5. Monitoring Activities effectiveness
6. Overall COSO maturity rating (1-5)
7. Key improvement areas
8. Comparison to industry benchmarks`;

    const analysis = await queryAI(prompt);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: Dashboard Summary
router.post('/dashboard-summary', auth, async (req, res) => {
  try {
    const controls = await pool.query('SELECT COUNT(*) as total, effectiveness, COUNT(*) FILTER (WHERE effectiveness = \'Effective\') as effective FROM controls GROUP BY effectiveness');
    const risks = await pool.query('SELECT COUNT(*) as total, status FROM risk_assessments GROUP BY status');
    const deficiencies = await pool.query('SELECT COUNT(*) as total, severity FROM deficiencies WHERE status != \'Closed\' GROUP BY severity');

    const prompt = `Provide a brief executive dashboard summary for a SOX audit program:
Controls Summary: ${JSON.stringify(controls.rows)}
Risk Summary: ${JSON.stringify(risks.rows)}
Open Deficiencies: ${JSON.stringify(deficiencies.rows)}

Provide a concise 3-4 paragraph executive summary covering:
1. Overall compliance posture
2. Key risk areas requiring attention
3. Priority action items`;

    const summary = await queryAI(prompt);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
