const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function main() {
  if (process.env.MIGRATE_ON_START !== 'true') return;
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('runtime admin credentials are required');
  await pool.query(await fs.readFile(path.join(__dirname, 'config', 'schema.sql'), 'utf8'));
  await pool.query(await fs.readFile(path.join(__dirname, 'migrations', '001_governed_sox_assessment.sql'), 'utf8'));
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id SERIAL PRIMARY KEY, user_id INTEGER, feature VARCHAR(120),
      input JSONB, output JSONB, endpoint VARCHAR(120), input_data JSONB,
      result JSONB, created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS user_id INTEGER;
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS feature VARCHAR(120);
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS input JSONB;
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS output JSONB;
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS endpoint VARCHAR(120);
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS input_data JSONB;
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS result JSONB;
    ALTER TABLE ai_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
  `);
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,'admin')
     ON CONFLICT (email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,role='admin'`,
    [email.toLowerCase(), hash, process.env.PROVISION_ADMIN_NAME || 'Runtime Admin']
  );
  await pool.end();
}

main().catch((error) => {
  console.error('Runtime bootstrap failed:', error.message);
  process.exit(1);
});
