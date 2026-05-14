const pool = require('../config/db');

// Initialize audit_log table
const initAuditLog = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_email VARCHAR(255),
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100),
      old_data JSONB,
      new_data JSONB,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

// Middleware factory that logs mutations
const auditLog = (entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (res.statusCode < 400) {
      try {
        const action = req.method === 'POST' ? 'CREATE'
          : req.method === 'PUT' ? 'UPDATE'
          : req.method === 'DELETE' ? 'DELETE'
          : 'READ';
        if (['CREATE', 'UPDATE', 'DELETE'].includes(action)) {
          await pool.query(
            `INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, new_data, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              req.user?.id || null,
              req.user?.email || null,
              action,
              entityType,
              req.params.id || data?.id || null,
              JSON.stringify(req.body),
              req.ip
            ]
          );
        }
      } catch (e) {
        console.error('Audit log error:', e.message);
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = { initAuditLog, auditLog };
