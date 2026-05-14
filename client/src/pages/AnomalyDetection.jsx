import { useState } from 'react'
import { api } from '../services/api'
import { Loader, Activity, AlertTriangle } from 'lucide-react'

const SAMPLE_TX = `[
  {"row":1,"date":"2025-12-31","gl_account":"6100","vendor":"Acme Corp","amount":9999,"je_type":"manual","posted_by":"u1","approved_by":"u1"},
  {"row":2,"date":"2026-01-04","gl_account":"6100","vendor":"Acme Corp","amount":50000,"je_type":"auto","posted_by":"u2","approved_by":"u3"},
  {"row":3,"date":"2026-01-05","gl_account":"6100","vendor":"Acme Corp","amount":50000,"je_type":"auto","posted_by":"u2","approved_by":"u3"}
]`

export default function AnomalyDetection() {
  const [form, setForm] = useState({
    feed: 'GL',
    period: '',
    materialityThreshold: '',
    contextNotes: '',
    transactionsJson: SAMPLE_TX,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    let transactions
    try {
      transactions = JSON.parse(form.transactionsJson)
      if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error('Transactions must be a non-empty JSON array')
      }
    } catch (err) {
      setError(`Invalid transactions JSON: ${err.message}`)
      setLoading(false)
      return
    }
    try {
      const payload = {
        feed: form.feed,
        transactions,
        ...(form.period ? { period: form.period } : {}),
        ...(form.materialityThreshold ? { materialityThreshold: Number(form.materialityThreshold) } : {}),
        ...(form.contextNotes ? { contextNotes: form.contextNotes } : {}),
      }
      const data = await api.anomalyDetection(payload)
      setResult(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sevColor = (sev) => ({
    Critical: 'bg-red-100 text-red-800 border-red-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
  })[sev] || 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-indigo-600" /> Transaction Anomaly Detection
        </h1>
        <p className="text-gray-500 mt-1">AI flags anomalies (round numbers, weekend postings, just-below-threshold amounts, duplicate vendors, self-approved JEs, etc.) over a paste of GL/AP transactions.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feed</label>
            <select
              name="feed"
              value={form.feed}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="GL">GL</option>
              <option value="AP">AP</option>
              <option value="AR">AR</option>
              <option value="JE">JE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period (optional)</label>
            <input
              type="text"
              name="period"
              value={form.period}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Q4 2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materiality Threshold</label>
            <input
              type="number"
              name="materialityThreshold"
              value={form.materialityThreshold}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 100000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Context Notes (optional)</label>
          <input
            type="text"
            name="contextNotes"
            value={form.contextNotes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. recent system migration; new approver in week 3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transactions (JSON array, max 200 rows)</label>
          <textarea
            name="transactionsJson"
            value={form.transactionsJson}
            onChange={handleChange}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            placeholder='[{"row":1,"date":"...","gl_account":"...","vendor":"...","amount":0}, ...]'
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Activity className="w-4 h-4" /> Detect Anomalies</>}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {result && typeof result === 'object' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {result.summary_statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Examined</p>
                <p className="text-xl font-bold text-indigo-600">{result.summary_statistics.transactions_examined ?? '—'}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Flagged</p>
                <p className="text-xl font-bold text-orange-600">{result.summary_statistics.anomalies_flagged ?? '—'}</p>
              </div>
              {result.summary_statistics.by_severity && Object.entries(result.summary_statistics.by_severity).map(([sev, cnt]) => (
                <div key={sev} className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{sev}</p>
                  <p className="text-xl font-bold text-gray-800">{cnt}</p>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(result.anomalies) && result.anomalies.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Anomalies</h3>
              <div className="space-y-2">
                {result.anomalies.map((a, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded border ${sevColor(a.severity)}`}>{a.severity}</span>
                      <span className="text-xs text-gray-500">{a.anomaly_type}</span>
                      {Array.isArray(a.row_indices) && (
                        <span className="text-xs text-gray-500">rows: {a.row_indices.join(', ')}</span>
                      )}
                      {a.amount != null && (
                        <span className="text-xs text-gray-500">amount: {a.amount}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{a.description}</p>
                    {a.recommended_followup && (
                      <p className="text-xs text-gray-500 mt-1"><strong>Follow-up:</strong> {a.recommended_followup}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.concentration_risks) && result.concentration_risks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Concentration Risks</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {result.concentration_risks.map((r, i) => (<li key={i}>{r}</li>))}
              </ul>
            </div>
          )}

          {result.summary && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-gray-700">{result.summary}</p>
            </div>
          )}
        </div>
      )}

      {result && typeof result === 'string' && (
        <div className="bg-white rounded-xl shadow p-6 text-sm text-gray-700 whitespace-pre-wrap">{result}</div>
      )}
    </div>
  )
}
