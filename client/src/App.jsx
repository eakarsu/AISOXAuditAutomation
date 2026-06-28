import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FeaturePage from './pages/FeaturePage'
import EvidenceVault from './pages/EvidenceVault'
import WorkpaperReview from './pages/WorkpaperReview'
import ControlsMonitor from './pages/ControlsMonitor'
import RegulatoryUpdate from './pages/RegulatoryUpdate'
import SamplingRecommendation from './pages/SamplingRecommendation'
import EvidenceQuality from './pages/EvidenceQuality'
import KeyReportCompleteness from './pages/KeyReportCompleteness'
import Layout from './components/Layout'
import { featureConfigs } from './pages/featureConfigs'
import MissingFeaturesHub from './pages/MissingFeaturesHub';
import ProductionReadiness from './pages/ProductionReadiness';
import SoxOpsCenter from './pages/SoxOpsCenter';
// === Batch 08 Gaps & Frontend Mounts ===
import CfRegulatoryChangeDigestIngestingSecPcaobUpdates from './pages/CfRegulatoryChangeDigestIngestingSecPcaobUpdates'
import CfAnomalyDetectionInGlPayrollApTransaction from './pages/CfAnomalyDetectionInGlPayrollApTransaction'
import CfRemediationTrackingDashboardWithTimelineViewAnd from './pages/CfRemediationTrackingDashboardWithTimelineViewAnd'
import CfMultiYearAuditPlanOptimizationWithRisk from './pages/CfMultiYearAuditPlanOptimizationWithRisk'
import CfEvidenceAdequacyCheckerViaRagOverPcaob from './pages/CfEvidenceAdequacyCheckerViaRagOverPcaob'
import CfContinuousControlsMonitoringWithRealTimeException from './pages/CfContinuousControlsMonitoringWithRealTimeException'
import GapNoSamplingRecommendationEngineTestSizeBased from './pages/GapNoSamplingRecommendationEngineTestSizeBased'
import GapNoEvidenceQualityAssessmentIsProvidedEvidence from './pages/GapNoEvidenceQualityAssessmentIsProvidedEvidence'
import GapNoAiDrivenControlToRiskAuto from './pages/GapNoAiDrivenControlToRiskAuto'
import GapNoIntegrationWithWorkivaAuditboardOrOther from './pages/GapNoIntegrationWithWorkivaAuditboardOrOther'
import GapNoWorkflowApprovalsSignOffsForFindings from './pages/GapNoWorkflowApprovalsSignOffsForFindings'
import GapNoMultiYearTrendAnalysisOrRe from './pages/GapNoMultiYearTrendAnalysisOrRe'
import GapNoWebhooksNotificationsForRemediationDeadlinesOr from './pages/GapNoWebhooksNotificationsForRemediationDeadlinesOr'
import GapNoDedicatedAuditTrailSubsystemDespiteDomain from './pages/GapNoDedicatedAuditTrailSubsystemDespiteDomain'
import GapNoDashboardsForExecutiveReportingBeyondPdf from './pages/GapNoDashboardsForExecutiveReportingBeyondPdf'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/evidence-vault" element={<ProtectedRoute><EvidenceVault /></ProtectedRoute>} />
      <Route path="/workpaper-review" element={<ProtectedRoute><WorkpaperReview /></ProtectedRoute>} />
      <Route path="/controls-monitor" element={<ProtectedRoute><ControlsMonitor /></ProtectedRoute>} />
      <Route path="/regulatory-update" element={<ProtectedRoute><RegulatoryUpdate /></ProtectedRoute>} />
      <Route path="/sampling-recommendation" element={<ProtectedRoute><SamplingRecommendation /></ProtectedRoute>} />
      <Route path="/evidence-quality" element={<ProtectedRoute><EvidenceQuality /></ProtectedRoute>} />
      <Route path="/key-report-completeness" element={<ProtectedRoute><KeyReportCompleteness /></ProtectedRoute>} />
      {Object.entries(featureConfigs).map(([key, config]) => (
        <Route
          key={key}
          path={`/${key}`}
          element={<ProtectedRoute><FeaturePage config={config} key={key} /></ProtectedRoute>}
        />
      ))}
      {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-regulatory-change-digest-ingesting-sec-pcaob-updates-flagging" element={<ProtectedRoute><CfRegulatoryChangeDigestIngestingSecPcaobUpdates /></ProtectedRoute>} />
      <Route path="/cf-anomaly-detection-in-gl-payroll-ap-transaction-feeds" element={<ProtectedRoute><CfAnomalyDetectionInGlPayrollApTransaction /></ProtectedRoute>} />
      <Route path="/cf-remediation-tracking-dashboard-with-timeline-view-and-predictive" element={<ProtectedRoute><CfRemediationTrackingDashboardWithTimelineViewAnd /></ProtectedRoute>} />
      <Route path="/cf-multi-year-audit-plan-optimization-with-risk-based-resource-allocation" element={<ProtectedRoute><CfMultiYearAuditPlanOptimizationWithRisk /></ProtectedRoute>} />
      <Route path="/cf-evidence-adequacy-checker-via-rag-over-pcaob-coso" element={<ProtectedRoute><CfEvidenceAdequacyCheckerViaRagOverPcaob /></ProtectedRoute>} />
      <Route path="/cf-continuous-controls-monitoring-with-real-time-exception-alerts" element={<ProtectedRoute><CfContinuousControlsMonitoringWithRealTimeException /></ProtectedRoute>} />
      <Route path="/gap-no-sampling-recommendation-engine-test-size-based-on" element={<ProtectedRoute><GapNoSamplingRecommendationEngineTestSizeBased /></ProtectedRoute>} />
      <Route path="/gap-no-evidence-quality-assessment-is-provided-evidence-sufficient" element={<ProtectedRoute><GapNoEvidenceQualityAssessmentIsProvidedEvidence /></ProtectedRoute>} />
      <Route path="/gap-no-ai-driven-control-to-risk-auto-mapping" element={<ProtectedRoute><GapNoAiDrivenControlToRiskAuto /></ProtectedRoute>} />
      <Route path="/gap-no-integration-with-workiva-auditboard-or-other-audit" element={<ProtectedRoute><GapNoIntegrationWithWorkivaAuditboardOrOther /></ProtectedRoute>} />
      <Route path="/gap-no-workflow-approvals-sign-offs-for-findings-no-approval" element={<ProtectedRoute><GapNoWorkflowApprovalsSignOffsForFindings /></ProtectedRoute>} />
      <Route path="/gap-no-multi-year-trend-analysis-or-re-test-scheduling" element={<ProtectedRoute><GapNoMultiYearTrendAnalysisOrRe /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks-notifications-for-remediation-deadlines-or-new" element={<ProtectedRoute><GapNoWebhooksNotificationsForRemediationDeadlinesOr /></ProtectedRoute>} />
      <Route path="/gap-no-dedicated-audit-trail-subsystem-despite-domain-requirement" element={<ProtectedRoute><GapNoDedicatedAuditTrailSubsystemDespiteDomain /></ProtectedRoute>} />
      <Route path="/gap-no-dashboards-for-executive-reporting-beyond-pdf-export" element={<ProtectedRoute><GapNoDashboardsForExecutiveReportingBeyondPdf /></ProtectedRoute>} />
        <Route path="/missing-features" element={<ProtectedRoute><MissingFeaturesHub /></ProtectedRoute>} />
        <Route path="/sox-ops/:moduleKey" element={<ProtectedRoute><SoxOpsCenter /></ProtectedRoute>} />
        <Route path="/sox-ops" element={<ProtectedRoute><SoxOpsCenter /></ProtectedRoute>} />
        <Route path="/production-readiness" element={<ProtectedRoute><ProductionReadiness /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
