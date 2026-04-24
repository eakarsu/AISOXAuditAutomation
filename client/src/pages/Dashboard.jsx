import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, FileCheck, Search, ClipboardList, Target, Brain, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { api } from '../services/api'
import AIOutput from '../components/AIOutput'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.getDashboard().then(setStats).catch(console.error)
  }, [])

  const handleAISummary = async () => {
    setAiLoading(true)
    try {
      const data = await api.dashboardSummary()
      setAiSummary(data.summary)
    } catch (err) {
      setAiSummary('Unable to generate summary: ' + err.message)
    }
    setAiLoading(false)
  }

  const cards = [
    { label: 'Control Testing', path: '/controls', icon: Shield, color: 'bg-blue-500', stat: stats?.controls?.total || 0, sub: `${stats?.controls?.effective || 0} effective` },
    { label: 'Risk Assessments', path: '/risk-assessments', icon: AlertTriangle, color: 'bg-red-500', stat: stats?.risks?.total || 0, sub: `${stats?.risks?.open || 0} open` },
    { label: 'Deficiencies', path: '/deficiencies', icon: FileCheck, color: 'bg-orange-500', stat: stats?.deficiencies?.total || 0, sub: `${stats?.deficiencies?.high || 0} high severity` },
    { label: 'Evidence', path: '/evidence', icon: Search, color: 'bg-green-500', stat: stats?.evidence?.total || 0, sub: `${stats?.evidence?.approved || 0} approved` },
    { label: 'Compliance Items', path: '/compliance', icon: ClipboardList, color: 'bg-purple-500', stat: stats?.compliance?.total || 0, sub: `${stats?.compliance?.completed || 0} completed` },
    { label: 'Remediations', path: '/remediations', icon: Target, color: 'bg-indigo-500', stat: stats?.remediations?.total || 0, sub: `${stats?.remediations?.completed || 0} completed` },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name || 'Auditor'}</h1>
        <p className="text-gray-500 mt-1">SOX Audit Automation Dashboard</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl border border-gray-200 p-6 card-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <Activity className="w-5 h-5 text-gray-300" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{card.stat}</h3>
              <p className="text-sm font-medium text-gray-600 mt-1">{card.label}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* AI Summary Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">AI Executive Summary</h2>
              <p className="text-xs text-gray-500">Powered by Claude AI via OpenRouter</p>
            </div>
          </div>
          <button onClick={handleAISummary} disabled={aiLoading} className="btn-primary flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {aiLoading ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>
        <AIOutput content={aiSummary} loading={aiLoading} title="Executive Summary" />
        {!aiSummary && !aiLoading && (
          <div className="text-center py-8 text-gray-400">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Generate Summary" to get an AI-powered analysis of your audit program</p>
          </div>
        )}
      </div>
    </div>
  )
}
