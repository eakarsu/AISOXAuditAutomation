import { useState } from 'react'
import { api } from '../services/api'
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Minus, Loader } from 'lucide-react'

export default function ControlsMonitor() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleMonitor = async () => {
    setLoading(true); setError(null)
    try {
      const data = await api.controlsMonitor()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const trendIcon = (t) => {
    if (t === 'Deteriorating') return <TrendingDown className="w-5 h-5 text-red-500" />
    if (t === 'Improving') return <TrendingUp className="w-5 h-5 text-green-500" />
    return <Minus className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-indigo-600" /> Continuous Controls Monitor
        </h1>
        <p className="text-gray-500 mt-1">Analyzes all controls, compares to previous analysis, flags drift and monitoring alerts.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <button
          onClick={handleMonitor}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Activity className="w-4 h-4" /> Run Controls Monitor</>}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}

      {result?.monitoring && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className={`rounded-xl shadow p-4 text-center ${result.drift_detected ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="text-gray-500 text-sm">Drift Detected</p>
              <p className={`text-2xl font-bold mt-1 ${result.drift_detected ? 'text-red-600' : 'text-green-600'}`}>
                {result.drift_detected ? 'YES' : 'NO'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-gray-500 text-sm">Trend</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {trendIcon(result.monitoring.trend)}
                <span className="font-semibold">{result.monitoring.trend}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-gray-500 text-sm">Monitoring Alerts</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{result.monitoring.monitoring_alerts?.length || 0}</p>
            </div>
          </div>

          {result.monitoring.drifted_controls?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Drifted Controls
              </h3>
              <div className="space-y-2">
                {result.monitoring.drifted_controls.map((d, i) => (
                  <div key={i} className="border border-orange-200 bg-orange-50 rounded-lg p-3">
                    <p className="font-medium text-sm text-orange-800">{d.control_id}</p>
                    <p className="text-sm text-gray-600">{d.issue}</p>
                    <p className="text-xs text-gray-500 mt-1">Change: {d.change}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.monitoring.monitoring_alerts?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Monitoring Alerts</h3>
              <div className="space-y-2">
                {result.monitoring.monitoring_alerts.map((a, i) => (
                  <div key={i} className={`border rounded-lg p-3 flex items-start gap-3 ${
                    a.severity === 'High' ? 'border-red-200 bg-red-50' :
                    a.severity === 'Medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                      a.severity === 'High' ? 'bg-red-200 text-red-800' :
                      a.severity === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>{a.severity}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.control_id}</p>
                      <p className="text-sm text-gray-600">{a.alert}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.monitoring.immediate_actions?.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Immediate Actions Required</h3>
              <ul className="space-y-1">
                {result.monitoring.immediate_actions.map((a, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-indigo-400 font-bold mt-0.5">{i + 1}.</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.monitoring.summary && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-800">{result.monitoring.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
