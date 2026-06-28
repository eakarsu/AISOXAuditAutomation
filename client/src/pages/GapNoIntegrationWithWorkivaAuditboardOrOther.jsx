// // === Batch 08 Gaps & Frontend Mounts ===
// Feature: No integration with Workiva, AuditBoard, or other audit platforms
import { useState } from 'react'
import PresetButtons from '../components/PresetButtons'
import AIOutput from '../components/AIOutput'

const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || ''

function getHeaders() {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || ''
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

const PRESETS = [
  { label: "Workiva sync plan", values: { prompt: "Outline how to sync controls, deficiencies, and evidence between this app and Workiva, including field mappings and conflict handling." } },
  { label: "AuditBoard mapping", values: { prompt: "Recommend an integration approach with AuditBoard, listing the entities to sync and the API touchpoints needed." } },
]

export default function GapNoIntegrationWithWorkivaAuditboardOrOther() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/gap-no-integration-with-workiva-auditboard-or-other-audit/run`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ prompt: input, feature: 'gap-no-integration-with-workiva-auditboard-or-other-audit', project: 'AISOXAuditAutomation' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gap-no-integration-with-workiva-auditboard-or-other-audit/history`, { headers: getHeaders() })
      const data = await res.json()
      setHistory(Array.isArray(data.history) ? data.history : [])
    } catch (_) { setHistory([]) }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">No integration with Workiva, AuditBoard, or other audit platforms</h1>
        <p className="text-slate-500 text-sm mt-1">Batch 08 · gap_non_ai · AISOXAuditAutomation</p>
      </div>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <PresetButtons presets={PRESETS} onApply={(v) => setInput(v.prompt)} />
        <label className="block text-sm font-medium text-slate-700 mb-1">Input / Prompt</label>
        <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" rows={6}
          value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe the data or context for this feature..." />
        <div className="flex items-center gap-3 mt-3">
          <button type="submit" disabled={loading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Running...' : 'Run Feature'}
          </button>
          <button type="button" onClick={loadHistory} className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">View History</button>
        </div>
      </form>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <AIOutput content={result?.result || result} title="AI Analysis" />
        </div>
      )}
      {history.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-800 mb-2">History</h2>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="text-xs text-slate-600 border-b border-slate-100 pb-2">
                <div className="text-slate-400">{new Date(h.created_at).toLocaleString()}</div>
                <div className="truncate">AI analysis result saved</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
