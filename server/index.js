const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path:path.join(__dirname,'../.env') });

const pool = require('./config/db');
const createCrudRouter = require('./routes/crud');
const auth = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');
const { validateRuntime } = require('./governance/runtime');
const { createProviderGate } = require('./governance/providerGate');

validateRuntime();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const origins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map((value)=>value.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin,callback){if(!origin||origins.includes(origin))return callback(null,true);return callback(new Error('CORS origin denied'));},
  credentials:true,
}));
app.use(express.json({limit:'1mb'}));
app.use('/api/',generalLimiter);

app.use('/api/auth',require('./routes/auth'));
app.get('/api/health',(_req,res)=>res.json({status:'ok',timestamp:new Date().toISOString()}));
app.use(createProviderGate([
  '/api/ai','/api/gap','/api/anomaly-detection','/api/system-chat','/api/evidence/upload',
  '/api/regulatory-digest','/api/remediation-tracking','/api/multi-year-audit-plan',
  '/api/evidence-adequacy','/api/continuous-controls-monitor','/api/sox-ops',
]));
app.use('/api/governed-sox-assessments',require('./governance/router'));
app.use('/api',auth);

if(process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP==='true'){
  require('./middleware/auditLog').initAuditLog().catch((error)=>console.error('Legacy schema bootstrap failed:',error.message));
}

app.use('/api/evidence',require('./routes/evidenceVault'));
app.use('/api/evidence',createCrudRouter('evidence','evidence_id'));
app.use('/api/reports',require('./routes/pdfReport'));
app.use('/uploads',auth,express.static(path.join(__dirname,'../uploads')));
app.use('/api/controls',createCrudRouter('controls','control_id'));
app.use('/api/risk-assessments',createCrudRouter('risk_assessments','risk_id'));
app.use('/api/compliance',createCrudRouter('compliance_items','item_id'));
app.use('/api/deficiencies',createCrudRouter('deficiencies','deficiency_id'));
app.use('/api/walkthroughs',createCrudRouter('walkthroughs','walkthrough_id'));
app.use('/api/management-reviews',createCrudRouter('management_reviews','review_id'));
app.use('/api/itgc',createCrudRouter('itgc_controls','itgc_id'));
app.use('/api/financial-reviews',createCrudRouter('financial_reviews','review_id'));
app.use('/api/sod-reviews',createCrudRouter('sod_reviews','sod_id'));
app.use('/api/access-reviews',createCrudRouter('access_reviews','review_id'));
app.use('/api/change-requests',createCrudRouter('change_requests','change_id'));
app.use('/api/audit-reports',createCrudRouter('audit_reports','report_id'));
app.use('/api/policies',createCrudRouter('policies','policy_id'));
app.use('/api/remediations',createCrudRouter('remediations','remediation_id'));
app.use('/api/audit-plans',createCrudRouter('audit_plans','plan_id'));
app.use('/api/materiality',createCrudRouter('materiality_assessments','assessment_id'));
app.use('/api/incidents',createCrudRouter('incidents','incident_id'));

app.get('/api/dashboard',async(_req,res)=>{
  try{
    const [controls,risks,deficiencies,evidence,compliance,remediations]=await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE effectiveness = 'Effective') as effective, COUNT(*) FILTER (WHERE effectiveness = 'Ineffective') as ineffective FROM controls"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Open') as open, AVG(risk_score) as avg_score FROM risk_assessments"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE severity = 'High') as high, COUNT(*) FILTER (WHERE severity = 'Critical') as critical FROM deficiencies WHERE status != 'Closed'"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Approved') as approved FROM evidence"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed FROM compliance_items"),
      pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'Completed') as completed FROM remediations"),
    ]);
    res.json({controls:controls.rows[0],risks:risks.rows[0],deficiencies:deficiencies.rows[0],evidence:evidence.rows[0],compliance:compliance.rows[0],remediations:remediations.rows[0]});
  }catch(_error){res.status(500).json({error:'Dashboard query failed'});}
});

app.use('/api/key-report-completeness',require('./routes/keyReportCompleteness'));

if(process.env.ENABLE_LEGACY_PROVIDER_ROUTES==='true'){
  app.use('/api/ai',require('./routes/ai'));
  app.use('/api/anomaly-detection',require('./routes/anomalyDetection'));
  app.use('/api/system-chat',require('./routes/systemChat'));
  app.use('/api/regulatory-digest',require('./routes/regulatoryDigest'));
  app.use('/api/remediation-tracking',require('./routes/remediationTracking'));
  app.use('/api/multi-year-audit-plan',require('./routes/multiYearAuditPlan'));
  app.use('/api/evidence-adequacy',require('./routes/evidenceAdequacy'));
  app.use('/api/continuous-controls-monitor',require('./routes/continuousControlsMonitor'));
  app.use('/api/sox-ops',require('./routes/soxOps'));
  app.use('/api/gap-no-sampling-recommendation-engine-test-size-based-on',require('./routes/gapNoSamplingRecommendationEngineTestSizeBasedOn'));
  app.use('/api/gap-no-evidence-quality-assessment-is-provided-evidence-sufficient',require('./routes/gapNoEvidenceQualityAssessmentIsProvidedEvidenceSufficient'));
  app.use('/api/gap-no-ai-driven-control-to-risk-auto-mapping',require('./routes/gapNoAiDrivenControlToRiskAutoMapping'));
  app.use('/api/gap-no-integration-with-workiva-auditboard-or-other-audit',require('./routes/gapNoIntegrationWithWorkivaAuditboardOrOtherAudit'));
  app.use('/api/gap-no-workflow-approvals-sign-offs-for-findings-no-approval',require('./routes/gapNoWorkflowApprovalsSignOffsForFindingsNoApproval'));
  app.use('/api/gap-no-multi-year-trend-analysis-or-re-test-scheduling',require('./routes/gapNoMultiYearTrendAnalysisOrReTestScheduling'));
  app.use('/api/gap-no-webhooks-notifications-for-remediation-deadlines-or-new',require('./routes/gapNoWebhooksNotificationsForRemediationDeadlinesOrNew'));
  app.use('/api/gap-no-dedicated-audit-trail-subsystem-despite-domain-requirement',require('./routes/gapNoDedicatedAuditTrailSubsystemDespiteDomainRequirement'));
  app.use('/api/gap-no-dashboards-for-executive-reporting-beyond-pdf-export',require('./routes/gapNoDashboardsForExecutiveReportingBeyondPdfExport'));
}

app.use((err,_req,res,_next)=>{console.error('Server error:',err.message);res.status(err.status||500).json({error:err.status?err.message:'Internal server error'});});
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
app.listen(PORT,()=>console.log(`SOX Audit Server running on port ${PORT}`));
