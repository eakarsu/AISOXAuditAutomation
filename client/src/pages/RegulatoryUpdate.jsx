import { useState } from 'react'
import { api } from '../services/api'
import { Bell, Calendar, AlertTriangle, CheckSquare, Loader } from 'lucide-react'

export default function RegulatoryUpdate() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleFetch = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.regulatoryUpdate()
      setResult(data.briefing)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const impactBadge = (impact) => {
    const colors = { High: 'bg-red-100 text-red-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-green-100 text-green-800' }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[impact] || 'bg-gray-100 text-gray-700'}`}>{impact}</span>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-7 h-7 text-indigo-600" /> Regulatory Update Briefing
        </h1>
        <p className="text-gray-500 mt-1">AI generates a briefing on regulatory changes affecting your SOX compliance items and policies.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <button
          onClick={handleFetch}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Generating Briefing...</> : <><Bell className="w-4 h-4" /> Generate Regulatory Briefing</>}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Regulatory Briefing</h3>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {result.date}
              </span>
            </div>

            {result.key_updates?.length > 0 && (
              <div className="space-y-3">
                {result.key_updates.map((u, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800 text-sm">{u.regulation}</h4>
                      {impactBadge(u.impact)}
                    </div>
                    <p className="text-sm text-gray-600">{u.change}</p>
                    {u.effective_date && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Effective: {u.effective_date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {result.action_items?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" /> Action Items
              </h3>
              <div className="space-y-2">
                {result.action_items.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                      a.priority === 'High' ? 'bg-red-100 text-red-700' :
                      a.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>{a.priority}</span>
                    <div>
                      <p className="text-sm text-gray-800">{a.item}</p>
                      {a.deadline && <p className="text-xs text-gray-400 mt-0.5">Deadline: {a.deadline}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.affected_policies?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Affected Policies</h3>
              <ul className="space-y-1">
                {result.affected_policies.map((p, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.upcoming_deadlines?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Upcoming Deadlines
              </h3>
              <ul className="space-y-1">
                {result.upcoming_deadlines.map((d, i) => (
                  <li key={i} className="text-sm text-amber-700">{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
