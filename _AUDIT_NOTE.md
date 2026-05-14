# Audit Note — AISOXAuditAutomation

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 2).

## Original Recommendations

### Missing AI Counterparts
- Sampling recommendation engine
- Evidence quality assessment

### Missing Non-AI Features
- Workiva/AuditBoard integration
- Workflow approvals/sign-offs
- Multi-year trend analysis & re-test scheduling

### Custom Feature Suggestions
- Regulatory change digest
- Anomaly detection in transaction logs
- Remediation tracking dashboard
- Audit plan optimization
- Evidence adequacy checker (RAG over PCAOB)

## Implemented (this round)
1. `POST /api/ai/sampling-recommendation` — sample size & methodology guidance.
2. `POST /api/ai/evidence-quality` — sufficient/appropriate assessment per AS 1105.

Pattern reused: `queryAI` + `parseAIJson` + `persistAIResult` with role-protected mutating endpoints elsewhere. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Anomaly detection endpoint over GL/AP feeds (requires schema decisions but flow is mechanical).
2. **NEEDS-CREDS** Workiva/AuditBoard integrations.
3. **NEEDS-PRODUCT-DECISION** Approvals/sign-offs workflow, multi-year re-test scheduling, remediation dashboard.
4. **NEEDS-PRODUCT-DECISION** RAG over PCAOB guidance corpus.

## Apply pass 3 (frontend)

LEFT-AS-IS. Both pass-2 endpoints are already wired:
- `client/src/pages/SamplingRecommendation.jsx` and `client/src/pages/EvidenceQuality.jsx` exist as full pages.
- Routes registered in `client/src/App.jsx` (`/sampling-recommendation`, `/evidence-quality`) inside `ProtectedRoute`.
- Nav entries present in `client/src/components/Layout.jsx`.
- API helpers `aiAPI.samplingRecommendation` and `aiAPI.evidenceQuality` defined in `client/src/services/api.js`, which attaches `Authorization: Bearer <token>` from `localStorage`.
Idempotent — no changes.
