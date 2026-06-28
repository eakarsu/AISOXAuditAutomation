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

async function uploadFile(url, formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Generic CRUD with pagination
  getAll: (resource, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/${resource}${qs ? '?' + qs : ''}`);
  },
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

  // New AI custom features
  cosoScoring: () => request('/ai/coso-scoring', { method: 'POST' }),
  scopeMemo: (data) => request('/ai/scope-memo', { method: 'POST', body: JSON.stringify(data) }),
  riskHeatmap: () => request('/ai/risk-heatmap', { method: 'POST' }),
  remediationAnalyzer: () => request('/ai/remediation-analyzer', { method: 'POST' }),
  workpaperReview: (planId) => request('/ai/workpaper-review', { method: 'POST', body: JSON.stringify({ planId }) }),
  controlsMonitor: () => request('/ai/controls-monitor', { method: 'POST' }),
  regulatoryUpdate: () => request('/ai/regulatory-update', { method: 'POST' }),
  workflowTransition: (entityType, entityId, newState) =>
    request('/ai/workflow/transition', { method: 'POST', body: JSON.stringify({ entityType, entityId, newState }) }),
  samplingRecommendation: (data) => request('/ai/sampling-recommendation', { method: 'POST', body: JSON.stringify(data) }),
  evidenceQuality: (data) => request('/ai/evidence-quality', { method: 'POST', body: JSON.stringify(data) }),
  anomalyDetection: (data) => request('/ai/anomaly-detection', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLog: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/ai/audit-log${qs ? '?' + qs : ''}`);
  },

  // Evidence vault
  uploadEvidence: (formData) => uploadFile('/evidence/upload', formData),
  getEvidenceFileUrl: (id) => `${API_BASE}/evidence/file/${id}`,

  // PDF reports
  getReportPdfUrl: (reportId) => `${API_BASE}/reports/pdf/${reportId}`,
  getDeficiencyPdfUrl: (deficiencyId) => `${API_BASE}/reports/pdf/deficiency/${deficiencyId}`,

  // Per-entity AI analysis (generic backend endpoint)
  analyzeEvidence: (id) => request('/ai/analyze-entity', { method: 'POST', body: JSON.stringify({ resource: 'evidence', id }) }),
  analyzeCompliance: (id) => request('/ai/analyze-entity', { method: 'POST', body: JSON.stringify({ resource: 'compliance', id }) }),
  analyzeReview: (id) => request('/ai/analyze-entity', { method: 'POST', body: JSON.stringify({ resource: 'management-reviews', id }) }),
  analyzeAccess: (id) => request('/ai/analyze-entity', { method: 'POST', body: JSON.stringify({ resource: 'access-reviews', id }) }),
  analyzeChange: (id) => request('/ai/analyze-entity', { method: 'POST', body: JSON.stringify({ resource: 'change-requests', id }) }),
  analyzeRemediation: (id) => request('/ai/analyze-entity', { method: 'POST', body: JSON.stringify({ resource: 'remediations', id }) }),

  // AI assistant + dashboard
  askAI: (question) => request('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }),
  controlEnvironment: async () => {
    const d = await request('/ai/coso-scoring', { method: 'POST' });
    return { analysis: d.scores || d.raw || d };
  },
  generateScopeMemo: () => request('/ai/scope-memo', { method: 'POST' }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
  dashboardSummary: () => request('/ai/dashboard-summary', { method: 'POST' }),

  // SOX Ops Center
  getSoxOpsSummary: () => request('/sox-ops/summary'),
  getSoxOpsModule: (moduleKey) => request(`/sox-ops/${moduleKey}`),
  runSoxOpsAction: (moduleKey, id) => request(`/sox-ops/${moduleKey}/${id}/run`, { method: 'POST' }),
  updateSoxOpsRow: (moduleKey, id, data) => request(`/sox-ops/${moduleKey}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSoxOpsRow: (moduleKey, id) => request(`/sox-ops/${moduleKey}/${id}`, { method: 'DELETE' }),

  // System Chat
  systemChat: (message, context = {}) => request('/system-chat/message', { method: 'POST', body: JSON.stringify({ message, context }) }),
};
