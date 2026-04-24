const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Generic CRUD
  getAll: (resource) => request(`/${resource}`),
  getOne: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, data) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (resource, id, data) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),

  // AI
  analyzeControl: (controlId) => request('/ai/analyze-control', { method: 'POST', body: JSON.stringify({ controlId }) }),
  analyzeRisk: (riskId) => request('/ai/analyze-risk', { method: 'POST', body: JSON.stringify({ riskId }) }),
  analyzeDeficiency: (deficiencyId) => request('/ai/analyze-deficiency', { method: 'POST', body: JSON.stringify({ deficiencyId }) }),
  generateNarrative: (walkthroughId) => request('/ai/generate-narrative', { method: 'POST', body: JSON.stringify({ walkthroughId }) }),
  analyzeItgc: (itgcId) => request('/ai/analyze-itgc', { method: 'POST', body: JSON.stringify({ itgcId }) }),
  analyzeFinancial: (reviewId) => request('/ai/analyze-financial', { method: 'POST', body: JSON.stringify({ reviewId }) }),
  analyzeSod: (sodId) => request('/ai/analyze-sod', { method: 'POST', body: JSON.stringify({ sodId }) }),
  generateReport: (reportId) => request('/ai/generate-report', { method: 'POST', body: JSON.stringify({ reportId }) }),
  analyzePolicy: (policyId) => request('/ai/analyze-policy', { method: 'POST', body: JSON.stringify({ policyId }) }),
  suggestPlan: (planId) => request('/ai/suggest-plan', { method: 'POST', body: JSON.stringify({ planId }) }),
  analyzeMateriality: (assessmentId) => request('/ai/analyze-materiality', { method: 'POST', body: JSON.stringify({ assessmentId }) }),
  analyzeIncident: (incidentId) => request('/ai/analyze-incident', { method: 'POST', body: JSON.stringify({ incidentId }) }),
  analyzeEvidence: (evidenceId) => request('/ai/analyze-evidence', { method: 'POST', body: JSON.stringify({ evidenceId }) }),
  analyzeCompliance: (complianceId) => request('/ai/analyze-compliance', { method: 'POST', body: JSON.stringify({ complianceId }) }),
  analyzeReview: (reviewId) => request('/ai/analyze-review', { method: 'POST', body: JSON.stringify({ reviewId }) }),
  analyzeAccess: (accessId) => request('/ai/analyze-access', { method: 'POST', body: JSON.stringify({ accessId }) }),
  analyzeChange: (changeId) => request('/ai/analyze-change', { method: 'POST', body: JSON.stringify({ changeId }) }),
  analyzeRemediation: (remediationId) => request('/ai/analyze-remediation', { method: 'POST', body: JSON.stringify({ remediationId }) }),
  dashboardSummary: () => request('/ai/dashboard-summary', { method: 'POST' }),

  // AI Sidebar tools
  askAI: (question) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }),
  generateScopeMemo: () => request('/ai/generate-scope-memo', { method: 'POST' }),
  regulatoryUpdate: () => request('/ai/regulatory-update', { method: 'POST' }),
  riskHeatmap: () => request('/ai/risk-heatmap', { method: 'POST' }),
  controlEnvironment: () => request('/ai/control-environment', { method: 'POST' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
};
