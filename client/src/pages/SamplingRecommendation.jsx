import { useState } from 'react'
import { api } from '../services/api'
import { Loader, Calculator, AlertTriangle } from 'lucide-react'

export default function SamplingRecommendation() {
  const [form, setForm] = useState({
    controlId: '',
    populationSize: '',
    materialityThreshold: '',
    riskLevel: 'medium',
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
      const payload = {
        ...(form.controlId ? { controlId: Number(form.controlId) } : {}),
        ...(form.populationSize ? { populationSize: Number(form.populationSize) } : {}),
        ...(form.materialityThreshold ? { materialityThreshold: Number(form.materialityThreshold) } : {}),
        riskLevel: form.riskLevel,
      }
      const data = await api.samplingRecommendation(payload)
      setResult(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-7 h-7 text-indigo-600" /> Sampling Recommendation
        </h1>
        <p className="text-gray-500 mt-1">AI recommends sample size and methodology for control testing based on risk and materiality.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Population Size</label>
            <input
              type="number"
              name="populationSize"
              value={form.populationSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 5000"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              name="riskLevel"
              value={form.riskLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Calculator className="w-4 h-4" /> Get Recommendation</>}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {result && typeof result === 'object' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Recommendation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Sample Size</p>
              <p className="text-xl font-bold text-indigo-600">{result.recommended_sample_size ?? '—'}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Methodology</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{result.sampling_methodology || '—'}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Confidence</p>
              <p className="text-sm font-medium text-gray-800 mt-1">{result.confidence_level_pct ? `${result.confidence_level_pct}%` : '—'}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tolerable Deviation Rate</p>
              <p className="text-sm text-gray-800 mt-1">{result.tolerable_deviation_rate ?? '—'}</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Expected Deviation Rate</p>
              <p className="text-sm text-gray-800 mt-1">{result.expected_deviation_rate ?? '—'}</p>
            </div>
          </div>
          {result.rationale && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rationale</p>
              <p className="text-sm text-gray-700">{result.rationale}</p>
            </div>
          )}
          {result.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700">{result.notes}</p>
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
