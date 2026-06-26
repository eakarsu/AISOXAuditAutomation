const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('./config/db');
const createCrudRouter = require('./routes/crud');
const authRouter = require('./routes/auth');
const aiRouter = require('./routes/ai');
const evidenceVaultRouter = require('./routes/evidenceVault');
const pdfReportRouter = require('./routes/pdfReport');
const { initAuditLog } = require('./middleware/auditLog');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/api/', generalLimiter);

// Initialize DB tables
initAuditLog().catch(console.error);

// Auth routes
app.use('/api/auth', authRouter);

// AI routes
app.use('/api/ai', aiRouter);

// Evidence vault (file upload) — handles /upload and /file/:id
app.use('/api/evidence', evidenceVaultRouter);
// Evidence CRUD (list/create/update/delete) — falls through from the vault router above
app.use('/api/evidence', createCrudRouter('evidence', 'evidence_id'));

// PDF Reports
app.use('/api/reports', pdfReportRouter);

// Serve uploaded files
app.use('/uploads', require('./middleware/auth'), express.static(path.join(__dirname, '../uploads')));

// CRUD routes for all features
app.use('/api/controls', createCrudRouter('controls', 'control_id'));
app.use('/api/risk-assessments', createCrudRouter('risk_assessments', 'risk_id'));
app.use('/api/compliance', createCrudRouter('compliance_items', 'item_id'));
app.use('/api/deficiencies', createCrudRouter('deficiencies', 'deficiency_id'));
app.use('/api/walkthroughs', createCrudRouter('walkthroughs', 'walkthrough_id'));
app.use('/api/management-reviews', createCrudRouter('management_reviews', 'review_id'));
app.use('/api/itgc', createCrudRouter('itgc_controls', 'itgc_id'));
app.use('/api/financial-reviews', createCrudRouter('financial_reviews', 'review_id'));
app.use('/api/sod-reviews', createCrudRouter('sod_reviews', 'sod_id'));
app.use('/api/access-reviews', createCrudRouter('access_reviews', 'review_id'));
app.use('/api/change-requests', createCrudRouter('change_requests', 'change_id'));
app.use('/api/audit-reports', createCrudRouter('audit_reports', 'report_id'));
app.use('/api/policies', createCrudRouter('policies', 'policy_id'));
app.use('/api/remediations', createCrudRouter('remediations', 'remediation_id'));
app.use('/api/audit-plans', createCrudRouter('audit_plans', 'plan_id'));
app.use('/api/materiality', createCrudRouter('materiality_assessments', 'assessment_id'));
app.use('/api/incidents', createCrudRouter('incidents', 'incident_id'));

// Dashboard stats
app.get('/api/dashboard', require('./middleware/auth'), async (req, res) => {
  try {
    const [controls, risks, deficiencies, evidence, compliance, remediations] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE effectiveness = 'Effective') as effective, COUNT(*) FILTER (WHERE effectiveness = 'Ineffective') as ineffective FROM controls"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Open') as open, AVG(risk_score) as avg_score FROM risk_assessments"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE severity = 'High') as high, COUNT(*) FILTER (WHERE severity = 'Critical') as critical FROM deficiencies WHERE status != 'Closed'"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Approved') as approved FROM evidence"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed FROM compliance_items"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed FROM remediations"),
    ]);
    res.json({
      controls: controls.rows[0],
      risks: risks.rows[0],
      deficiencies: deficiencies.rows[0],
      evidence: evidence.rows[0],
      compliance: compliance.rows[0],
      remediations: remediations.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/regulatory-digest', require('./routes/regulatoryDigest')); app.use('/api/anomaly-detection', require('./routes/anomalyDetection')); app.use('/api/remediation-tracking', require('./routes/remediationTracking')); app.use('/api/multi-year-audit-plan', require('./routes/multiYearAuditPlan')); app.use('/api/evidence-adequacy', require('./routes/evidenceAdequacy')); app.use('/api/continuous-controls-monitor', require('./routes/continuousControlsMonitor'));
app.use('/api/key-report-completeness', require('./routes/keyReportCompleteness'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-sampling-recommendation-engine-test-size-based-on', require('./routes/gapNoSamplingRecommendationEngineTestSizeBasedOn'));
app.use('/api/gap-no-evidence-quality-assessment-is-provided-evidence-sufficient', require('./routes/gapNoEvidenceQualityAssessmentIsProvidedEvidenceSufficient'));
app.use('/api/gap-no-ai-driven-control-to-risk-auto-mapping', require('./routes/gapNoAiDrivenControlToRiskAutoMapping'));
app.use('/api/gap-no-integration-with-workiva-auditboard-or-other-audit', require('./routes/gapNoIntegrationWithWorkivaAuditboardOrOtherAudit'));
app.use('/api/gap-no-workflow-approvals-sign-offs-for-findings-no-approval', require('./routes/gapNoWorkflowApprovalsSignOffsForFindingsNoApproval'));
app.use('/api/gap-no-multi-year-trend-analysis-or-re-test-scheduling', require('./routes/gapNoMultiYearTrendAnalysisOrReTestScheduling'));
app.use('/api/gap-no-webhooks-notifications-for-remediation-deadlines-or-new', require('./routes/gapNoWebhooksNotificationsForRemediationDeadlinesOrNew'));
app.use('/api/gap-no-dedicated-audit-trail-subsystem-despite-domain-requirement', require('./routes/gapNoDedicatedAuditTrailSubsystemDespiteDomainRequirement'));
app.use('/api/gap-no-dashboards-for-executive-reporting-beyond-pdf-export', require('./routes/gapNoDashboardsForExecutiveReportingBeyondPdfExport'));

app.listen(PORT, () => {
  console.log(`SOX Audit Server running on port ${PORT}`);
});
