const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('./config/db');
const createCrudRouter = require('./routes/crud');
const authRouter = require('./routes/auth');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRouter);

// AI routes
app.use('/api/ai', aiRouter);

// CRUD routes for all features
app.use('/api/controls', createCrudRouter('controls', 'control_id'));
app.use('/api/risk-assessments', createCrudRouter('risk_assessments', 'risk_id'));
app.use('/api/evidence', createCrudRouter('evidence', 'evidence_id'));
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
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE effectiveness = \'Effective\') as effective, COUNT(*) FILTER (WHERE effectiveness = \'Ineffective\') as ineffective FROM controls'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Open\') as open, AVG(risk_score) as avg_score FROM risk_assessments'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE severity = \'High\') as high, COUNT(*) FILTER (WHERE severity = \'Critical\') as critical FROM deficiencies WHERE status != \'Closed\''),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Approved\') as approved FROM evidence'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Completed\') as completed FROM compliance_items'),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'Completed\') as completed FROM remediations'),
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

app.listen(PORT, () => {
  console.log(`SOX Audit Server running on port ${PORT}`);
});
