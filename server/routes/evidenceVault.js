const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { queryAI, parseAIJson } = require('../config/openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.xls', '.csv', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

// Initialize evidence vault tables
const initTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      endpoint VARCHAR(100),
      input_data JSONB,
      result JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS file_path TEXT,
    ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS file_size INTEGER,
    ADD COLUMN IF NOT EXISTS doc_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS chain_of_custody JSONB DEFAULT '[]'
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS controls_monitoring (
      id SERIAL PRIMARY KEY,
      control_id INTEGER,
      analysis JSONB,
      drift_detected BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};
initTables().catch(console.error);

// POST /api/evidence/upload - multer upload + SHA-256 hash + AI doc classification
router.post('/upload', auth, requireRole('admin', 'auditor'), upload.single('file'), auditLog('evidence'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Compute SHA-256 hash
    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const { title, description, control_ref, evidence_id } = req.body;

    // Insert evidence record
    const evidResult = await pool.query(
      `INSERT INTO evidence (evidence_id, title, description, control_ref, type, source, collected_by, collected_date, status, file_path, file_hash, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'Pending Review', $8, $9, $10) RETURNING *`,
      [
        evidence_id || `EV-${Date.now()}`,
        title || req.file.originalname,
        description || '',
        control_ref || '',
        path.extname(req.file.originalname).replace('.', '').toUpperCase(),
        'File Upload',
        req.user.email || req.user.name || 'Unknown',
        req.file.path,
        hash,
        req.file.size
      ]
    );
    const evidence = evidResult.rows[0];

    // AI auto-classify doc type (fire & forget, don't block response)
    const classifyAsync = async () => {
      try {
        const prompt = `You are a SOX audit document classifier. A file named "${req.file.originalname}" (${path.extname(req.file.originalname)}) was uploaded as evidence.
Based on the filename and extension, classify this document.
Respond with JSON only:
{
  "doc_type": "invoice|purchase_order|contract|access_listing|bank_statement|journal_entry|policy|other",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`;
        const aiText = await queryAI(prompt);
        const aiResult = parseAIJson(aiText);
        if (aiResult) {
          await pool.query(`UPDATE evidence SET doc_type = $1 WHERE id = $2`, [aiResult.doc_type, evidence.id]);
          await pool.query(
            `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
            [req.user.id, 'evidence/classify', { filename: req.file.originalname }, aiResult]
          );
        }
      } catch (e) { console.error('AI classify error:', e.message); }
    };
    classifyAsync();

    res.status(201).json({
      message: 'Evidence uploaded successfully',
      evidence,
      hash,
      file: {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evidence/file/:id - retrieve file by evidence id
router.get('/file/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM evidence WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evidence not found' });
    const evidence = result.rows[0];
    if (!evidence.file_path || !fs.existsSync(evidence.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    res.sendFile(path.resolve(evidence.file_path));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.initTables = initTables;
