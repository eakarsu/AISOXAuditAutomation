const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// Whitelisted columns per table - prevents SQL injection from arbitrary keys
const TABLE_COLUMNS = {
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

function filterAllowedKeys(tableName, body) {
  const allowed = TABLE_COLUMNS[tableName] || [];
  const filtered = {};
  for (const key of Object.keys(body)) {
    if (allowed.includes(key)) filtered[key] = body[key];
  }
  return filtered;
}

function createCrudRouter(tableName, idColumn) {
  const router = express.Router();

  // GET all - with pagination, search, filter
  router.get('/', auth, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;
      const search = req.query.search || '';
      const status = req.query.status || '';

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIdx = 1;

      // Generic search across text columns
      if (search) {
        const allowed = TABLE_COLUMNS[tableName] || [];
        const textCols = allowed.filter(c => !['id'].includes(c)).slice(0, 3);
        if (textCols.length > 0) {
          const searchConditions = textCols.map(col => {
            params.push(`%${search}%`);
            return `CAST(${col} AS TEXT) ILIKE $${paramIdx++}`;
          });
          whereClause += ` AND (${searchConditions.join(' OR ')})`;
        }
      }

      if (status) {
        params.push(status);
        whereClause += ` AND status = $${paramIdx++}`;
      }

      const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName} ${whereClause}`, params);
      const total = parseInt(countResult.rows[0].count);

      params.push(limit);
      params.push(offset);
      const dataResult = await pool.query(
        `SELECT * FROM ${tableName} ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        params
      );

      res.json({
        data: dataResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET one
  router.get('/:id', auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create - whitelist columns
  router.post('/', auth, auditLog(tableName), async (req, res) => {
    try {
      const body = filterAllowedKeys(tableName, req.body);
      const keys = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
      if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

      const values = keys.map(k => body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const result = await pool.query(
        `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update - whitelist columns
  router.put('/:id', auth, auditLog(tableName), async (req, res) => {
    try {
      const body = filterAllowedKeys(tableName, req.body);
      const keys = Object.keys(body).filter(k => k !== 'id' && k !== 'created_at');
      if (keys.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

      const values = keys.map(k => body[k]);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', auth, auditLog(tableName), async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
