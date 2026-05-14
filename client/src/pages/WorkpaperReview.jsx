import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { FileSearch, CheckCircle, AlertTriangle, XCircle, Loader } from 'lucide-react'

export default function WorkpaperReview() {
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getAll('audit-plans').then(data => setPlans(data.data || [])).catch(() => {})
  }, [])

  const handleReview = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await api.workpaperReview(selectedPlan || null)
      setResult(data.review)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const severityIcon = (s) => {
    if (s === 'Critical') return <XCircle className="w-4 h-4 text-red-500" />
    if (s === 'Significant') return <AlertTriangle className="w-4 h-4 text-orange-500" />
    return <CheckCircle className="w-4 h-4 text-yellow-500" />
  }

  const conclusionColor = (c) => {
    if (c === 'Pass') return 'bg-green-100 text-green-800'
    if (c === 'Pass with Comments') return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileSearch className="w-7 h-7 text-indigo-600" /> PCAOB Workpaper Reviewer
        </h1>
        <p className="text-gray-500 mt-1">AI reviews audit workpapers against PCAOB AS standards and returns findings with severity ratings.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Audit Plan</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value)}
            >
              <option value="">All Plans</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <button
            onClick={handleReview}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Reviewing...</> : <><FileSearch className="w-4 h-4" /> Run PCAOB Review</>}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-gray-500 text-sm">Overall Conclusion</p>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${conclusionColor(result.overall_conclusion)}`}>
                {result.overall_conclusion}
              </span>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-gray-500 text-sm">Completeness Score</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{result.completeness_score}%</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-gray-500 text-sm">Findings Count</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{result.findings?.length || 0}</p>
            </div>
          </div>

          {result.findings?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">PCAOB Findings</h3>
              <div className="space-y-3">
                {result.findings.map((f, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{severityIcon(f.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{f.as_standard}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            f.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            f.severity === 'Significant' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{f.severity}</span>
                        </div>
                        <p className="text-sm text-gray-800 font-medium">{f.finding}</p>
                        <p className="text-sm text-gray-500 mt-1">{f.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.documentation_gaps?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Documentation Gaps</h3>
              <ul className="space-y-1">
                {result.documentation_gaps.map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.summary && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-800">{result.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
