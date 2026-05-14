import { useState } from 'react'
import { api } from '../services/api'
import { Loader, FileSearch, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export default function EvidenceQuality() {
  const [form, setForm] = useState({
    controlId: '',
    evidenceDescription: '',
    evidenceMetadata: '',
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
    try {
      let metadata = undefined
      if (form.evidenceMetadata.trim()) {
        try { metadata = JSON.parse(form.evidenceMetadata) }
        catch { metadata = { notes: form.evidenceMetadata } }
      }
      const payload = {
        ...(form.controlId ? { controlId: Number(form.controlId) } : {}),
        evidenceDescription: form.evidenceDescription,
        ...(metadata ? { evidenceMetadata: metadata } : {}),
      }
      const data = await api.evidenceQuality(payload)
      setResult(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const BoolBadge = ({ value }) => value ? (
    <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full text-xs font-medium">
      <CheckCircle2 className="w-3 h-3" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-xs font-medium">
      <XCircle className="w-3 h-3" /> No
    </span>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSearch className="w-7 h-7 text-indigo-600" /> Evidence Quality Assessment
        </h1>
        <p className="text-gray-500 mt-1">AI assesses sufficiency and appropriateness of audit evidence per PCAOB AS 1105.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Control ID (optional)</label>
          <input
            type="number"
            name="controlId"
            value={form.controlId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. 12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Description</label>
          <textarea
            name="evidenceDescription"
            value={form.evidenceDescription}
            onChange={handleChange}
            rows={4}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Describe the evidence you have collected..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Metadata (optional)</label>
          <textarea
            name="evidenceMetadata"
            value={form.evidenceMetadata}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            placeholder='JSON or notes, e.g. {"source":"GL","date":"2024-12-31"}'
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Assessing...</> : <><FileSearch className="w-4 h-4" /> Assess Evidence</>}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {result && typeof result === 'object' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sufficient</p>
              <BoolBadge value={!!result.sufficient} />
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Appropriate</p>
              <BoolBadge value={!!result.appropriate} />
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Relevance Score</p>
              <p className="text-xl font-bold text-indigo-600">{result.relevance_score ?? '—'}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Reliability Score</p>
              <p className="text-xl font-bold text-indigo-600">{result.reliability_score ?? '—'}</p>
            </div>
          </div>
          {result.gaps?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gaps</p>
              <ul className="space-y-1">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" /> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.additional_evidence_needed?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Additional Evidence Needed</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                {result.additional_evidence_needed.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
          {result.rationale && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rationale</p>
              <p className="text-sm text-gray-700">{result.rationale}</p>
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
