-- SOX Audit Automation Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'auditor',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 1. Control Testing
CREATE TABLE IF NOT EXISTS controls (
  id SERIAL PRIMARY KEY,
  control_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  owner VARCHAR(255),
  frequency VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Pending',
  effectiveness VARCHAR(50) DEFAULT 'Not Tested',
  last_tested DATE,
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id SERIAL PRIMARY KEY,
  risk_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  likelihood VARCHAR(50),
  impact VARCHAR(50),
  risk_score INTEGER,
  mitigation TEXT,
  owner VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Open',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Evidence Collection
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  evidence_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  control_ref VARCHAR(50),
  type VARCHAR(100),
  source VARCHAR(255),
  collected_by VARCHAR(255),
  collected_date DATE,
  status VARCHAR(50) DEFAULT 'Pending Review',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Compliance Checklist
CREATE TABLE IF NOT EXISTS compliance_items (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(50) UNIQUE NOT NULL,
  section VARCHAR(100) NOT NULL,
  requirement VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Not Started',
  assignee VARCHAR(255),
  due_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Deficiency Tracking
CREATE TABLE IF NOT EXISTS deficiencies (
  id SERIAL PRIMARY KEY,
  deficiency_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  control_ref VARCHAR(50),
  severity VARCHAR(50),
  classification VARCHAR(100),
  identified_date DATE,
  remediation_plan TEXT,
  owner VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Open',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Walkthrough Documentation
CREATE TABLE IF NOT EXISTS walkthroughs (
  id SERIAL PRIMARY KEY,
  walkthrough_id VARCHAR(50) UNIQUE NOT NULL,
  process_name VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  performed_by VARCHAR(255),
  performed_date DATE,
  participants TEXT,
  findings TEXT,
  status VARCHAR(50) DEFAULT 'Draft',
  ai_narrative TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Management Review
CREATE TABLE IF NOT EXISTS management_reviews (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  review_type VARCHAR(100),
  reviewer VARCHAR(255),
  review_date DATE,
  period VARCHAR(100),
  findings TEXT,
  conclusion VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Scheduled',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. IT General Controls (ITGC)
CREATE TABLE IF NOT EXISTS itgc_controls (
  id SERIAL PRIMARY KEY,
  itgc_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  system_name VARCHAR(255),
  control_type VARCHAR(100),
  owner VARCHAR(255),
  test_result VARCHAR(50) DEFAULT 'Not Tested',
  test_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Financial Statement Review
CREATE TABLE IF NOT EXISTS financial_reviews (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  description TEXT,
  period VARCHAR(100),
  balance DECIMAL(15,2),
  prior_balance DECIMAL(15,2),
  variance_pct DECIMAL(5,2),
  reviewer VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Pending',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Segregation of Duties
CREATE TABLE IF NOT EXISTS sod_reviews (
  id SERIAL PRIMARY KEY,
  sod_id VARCHAR(50) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  role_1 VARCHAR(255),
  role_2 VARCHAR(255),
  system_name VARCHAR(255),
  conflict_type VARCHAR(100),
  risk_level VARCHAR(50),
  mitigation TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Access Control Review
CREATE TABLE IF NOT EXISTS access_reviews (
  id SERIAL PRIMARY KEY,
  review_id VARCHAR(50) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  system_name VARCHAR(255),
  access_level VARCHAR(100),
  department VARCHAR(100),
  last_login DATE,
  appropriate VARCHAR(50) DEFAULT 'Pending Review',
  reviewer VARCHAR(255),
  review_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 12. Change Management
CREATE TABLE IF NOT EXISTS change_requests (
  id SERIAL PRIMARY KEY,
  change_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  system_name VARCHAR(255),
  change_type VARCHAR(100),
  requestor VARCHAR(255),
  approver VARCHAR(255),
  request_date DATE,
  implementation_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  risk_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 13. Audit Reports
CREATE TABLE IF NOT EXISTS audit_reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audit_type VARCHAR(100),
  scope TEXT,
  period VARCHAR(100),
  lead_auditor VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Draft',
  findings_count INTEGER DEFAULT 0,
  opinion VARCHAR(100),
  ai_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 14. Policy Management
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  policy_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  version VARCHAR(20),
  effective_date DATE,
  review_date DATE,
  owner VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Active',
  ai_gap_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. Remediation Tracking
CREATE TABLE IF NOT EXISTS remediations (
  id SERIAL PRIMARY KEY,
  remediation_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deficiency_ref VARCHAR(50),
  action_plan TEXT,
  owner VARCHAR(255),
  priority VARCHAR(50),
  due_date DATE,
  completion_date DATE,
  status VARCHAR(50) DEFAULT 'Not Started',
  verification TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 16. Audit Planning / Timeline
CREATE TABLE IF NOT EXISTS audit_plans (
  id SERIAL PRIMARY KEY,
  plan_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audit_type VARCHAR(100),
  start_date DATE,
  end_date DATE,
  lead_auditor VARCHAR(255),
  team_members TEXT,
  status VARCHAR(50) DEFAULT 'Planning',
  budget DECIMAL(10,2),
  ai_suggestions TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 17. Materiality Assessment
CREATE TABLE IF NOT EXISTS materiality_assessments (
  id SERIAL PRIMARY KEY,
  assessment_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  benchmark VARCHAR(100),
  benchmark_value DECIMAL(15,2),
  materiality_threshold DECIMAL(15,2),
  tolerable_misstatement DECIMAL(15,2),
  period VARCHAR(100),
  assessor VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Draft',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 18. Incident Management
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  incident_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  severity VARCHAR(50),
  reported_by VARCHAR(255),
  reported_date DATE,
  resolved_date DATE,
  root_cause TEXT,
  impact_assessment TEXT,
  status VARCHAR(50) DEFAULT 'Open',
  ai_analysis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
