import { useState, useEffect } from 'react'
import { Brain, Sparkles, MessageSquare, FileText, Shield, AlertTriangle, BarChart3, Send, X, ChevronRight, Loader2, Zap, Database, ChevronDown } from 'lucide-react'
import { api } from '../services/api'
import AIOutput from './AIOutput'

const globalTools = [
  {
    id: 'ask',
    label: 'Ask AI Auditor',
    description: 'Ask any SOX audit question',
    icon: MessageSquare,
    color: 'from-blue-500 to-indigo-600',
    type: 'freeform',
  },
  {
    id: 'dashboard-summary',
    label: 'Executive Summary',
    description: 'AI-generated program overview',
    icon: BarChart3,
    color: 'from-green-500 to-emerald-600',
    type: 'action',
    action: () => api.dashboardSummary(),
    resultKey: 'summary',
  },
  {
    id: 'scope-memo',
    label: 'Audit Scope Memo',
    description: 'Generate comprehensive scope memo',
    icon: FileText,
    color: 'from-purple-500 to-violet-600',
    type: 'action',
    action: () => api.generateScopeMemo(),
    resultKey: 'memo',
  },
  {
    id: 'risk-heatmap',
    label: 'Risk Heat Map Analysis',
    description: 'Analyze risk portfolio and priorities',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-600',
    type: 'action',
    action: () => api.riskHeatmap(),
    resultKey: 'analysis',
  },
  {
    id: 'control-env',
    label: 'Control Environment',
    description: 'COSO framework assessment',
    icon: Shield,
    color: 'from-cyan-500 to-blue-600',
    type: 'action',
    action: () => api.controlEnvironment(),
    resultKey: 'analysis',
  },
  {
    id: 'regulatory',
    label: 'Regulatory Updates',
    description: 'Latest compliance requirements',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    type: 'action',
    action: () => api.regulatoryUpdate(),
    resultKey: 'analysis',
  },
]

// All feature-specific AI tools with their data source
const featureAITools = [
  { id: 'controls', label: 'Analyze Control', resource: 'controls', idField: 'control_id', nameField: 'name', action: (id) => api.analyzeControl(id) },
  { id: 'risks', label: 'Analyze Risk', resource: 'risk-assessments', idField: 'risk_id', nameField: 'title', action: (id) => api.analyzeRisk(id) },
  { id: 'evidence', label: 'Assess Evidence', resource: 'evidence', idField: 'evidence_id', nameField: 'title', action: (id) => api.analyzeEvidence(id) },
  { id: 'compliance', label: 'Compliance Gap', resource: 'compliance', idField: 'item_id', nameField: 'requirement', action: (id) => api.analyzeCompliance(id) },
  { id: 'deficiencies', label: 'Classify Deficiency', resource: 'deficiencies', idField: 'deficiency_id', nameField: 'title', action: (id) => api.analyzeDeficiency(id) },
  { id: 'walkthroughs', label: 'Generate Narrative', resource: 'walkthroughs', idField: 'walkthrough_id', nameField: 'process_name', action: (id) => api.generateNarrative(id) },
  { id: 'reviews', label: 'Review Assessment', resource: 'management-reviews', idField: 'review_id', nameField: 'title', action: (id) => api.analyzeReview(id) },
  { id: 'itgc', label: 'Analyze ITGC', resource: 'itgc', idField: 'itgc_id', nameField: 'name', action: (id) => api.analyzeItgc(id) },
  { id: 'financial', label: 'Financial Analysis', resource: 'financial-reviews', idField: 'review_id', nameField: 'account_name', action: (id) => api.analyzeFinancial(id) },
  { id: 'sod', label: 'SoD Conflict Analysis', resource: 'sod-reviews', idField: 'sod_id', nameField: 'user_name', action: (id) => api.analyzeSod(id) },
  { id: 'access', label: 'Access Risk Analysis', resource: 'access-reviews', idField: 'review_id', nameField: 'user_name', action: (id) => api.analyzeAccess(id) },
  { id: 'changes', label: 'Change Risk Assessment', resource: 'change-requests', idField: 'change_id', nameField: 'title', action: (id) => api.analyzeChange(id) },
  { id: 'reports', label: 'Generate Report Summary', resource: 'audit-reports', idField: 'report_id', nameField: 'title', action: (id) => api.generateReport(id) },
  { id: 'policies', label: 'Policy Gap Analysis', resource: 'policies', idField: 'policy_id', nameField: 'title', action: (id) => api.analyzePolicy(id) },
  { id: 'remediations', label: 'Remediation Assessment', resource: 'remediations', idField: 'remediation_id', nameField: 'title', action: (id) => api.analyzeRemediation(id) },
  { id: 'plans', label: 'Audit Plan Suggestions', resource: 'audit-plans', idField: 'plan_id', nameField: 'title', action: (id) => api.suggestPlan(id) },
  { id: 'materiality', label: 'Materiality Analysis', resource: 'materiality', idField: 'assessment_id', nameField: 'title', action: (id) => api.analyzeMateriality(id) },
  { id: 'incidents', label: 'Incident Analysis', resource: 'incidents', idField: 'incident_id', nameField: 'title', action: (id) => api.analyzeIncident(id) },
]

export default function AISidebar({ isOpen, onClose }) {
  const [activeTool, setActiveTool] = useState(null)
  const [activeFeatureTool, setActiveFeatureTool] = useState(null)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [history, setHistory] = useState([])
  // Feature tool state
  const [featureData, setFeatureData] = useState([])
  const [featureDataLoading, setFeatureDataLoading] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [showFeatureTools, setShowFeatureTools] = useState(false)

  // Load data when a feature tool is selected
  useEffect(() => {
    if (activeFeatureTool) {
      loadFeatureData(activeFeatureTool.resource)
    }
  }, [activeFeatureTool])

  const loadFeatureData = async (resource) => {
    setFeatureDataLoading(true)
    try {
      const data = await api.getAll(resource)
      setFeatureData(data)
    } catch (err) {
      setFeatureData([])
    }
    setFeatureDataLoading(false)
  }

  // Robustly pull the AI payload out of a response regardless of which key
  // the backend used. Falls back to the first meaningful value so a key
  // mismatch can never blank the panel.
  const extractAIContent = (data, resultKey) => {
    if (data == null) return ''
    if (typeof data !== 'object') return data
    const preferred = [resultKey, 'analysis', 'narrative', 'summary', 'suggestions',
      'memo', 'answer', 'scores', 'heatmap', 'briefing', 'assessment', 'result']
    for (const k of preferred) {
      if (k && data[k] != null && data[k] !== '') return data[k]
    }
    const vals = Object.values(data).filter(v => v != null && v !== '')
    return vals[0] ?? ''
  }

  const handleToolClick = async (tool) => {
    setActiveTool(tool)
    setActiveFeatureTool(null)
    setResult('')

    if (tool.type === 'action') {
      setLoading(true)
      try {
        const data = await tool.action()
        const content = extractAIContent(data, tool.resultKey)
        setResult(content)
        setHistory(prev => [{ tool: tool.label, content, time: new Date() }, ...prev].slice(0, 20))
      } catch (err) {
        setResult('Error: ' + err.message)
      }
      setLoading(false)
    }
  }

  const handleFeatureToolClick = (tool) => {
    setActiveFeatureTool(tool)
    setActiveTool(null)
    setResult('')
    setSelectedItemId('')
    setFeatureData([])
  }

  const handleFeatureAnalyze = async () => {
    if (!selectedItemId || !activeFeatureTool) return
    setLoading(true)
    setResult('')
    try {
      const data = await activeFeatureTool.action(parseInt(selectedItemId))
      const content = extractAIContent(data, activeFeatureTool.resultKey)
      setResult(content)
      setHistory(prev => [{ tool: activeFeatureTool.label, content, time: new Date() }, ...prev].slice(0, 20))
    } catch (err) {
      setResult('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleSampleClick = async (item) => {
    if (!activeFeatureTool) return
    setSelectedItemId(String(item.id))
    setLoading(true)
    setResult('')
    try {
      const data = await activeFeatureTool.action(item.id)
      const content = extractAIContent(data, activeFeatureTool.resultKey)
      setResult(content)
      setHistory(prev => [{ tool: activeFeatureTool.label, content, time: new Date() }, ...prev].slice(0, 20))
    } catch (err) {
      setResult('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setResult('')
    try {
      const data = await api.askAI(question)
      setResult(data.answer)
      setHistory(prev => [{ tool: 'Ask AI', content: data.answer, question, time: new Date() }, ...prev].slice(0, 20))
    } catch (err) {
      setResult('Error: ' + err.message)
    }
    setLoading(false)
  }

  const handleBack = () => {
    setActiveTool(null)
    setActiveFeatureTool(null)
    setResult('')
    setQuestion('')
    setSelectedItemId('')
  }

  if (!isOpen) return null

  const isInToolView = activeTool || activeFeatureTool

  return (
    <div className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">AI Audit Assistant</h2>
            <p className="text-white/70 text-xs">Powered by Claude AI · 18 AI Features</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!isInToolView ? (
          /* Tool Selection */
          <div className="p-4">
            {/* Global Tools */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Global AI Tools</p>
            <div className="space-y-2 mb-5">
              {globalTools.map(tool => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolClick(tool)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all group text-left"
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${tool.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{tool.label}</p>
                      <p className="text-xs text-gray-500">{tool.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </button>
                )
              })}
            </div>

            {/* Feature-specific AI Tools */}
            <button
              onClick={() => setShowFeatureTools(!showFeatureTools)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 hover:text-gray-700"
            >
              <span className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                Feature AI Tools ({featureAITools.length})
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFeatureTools ? 'rotate-180' : ''}`} />
            </button>
            {showFeatureTools && (
              <div className="space-y-1 mb-5">
                {featureAITools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleFeatureToolClick(tool)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-50 hover:border-primary-200 hover:bg-primary-50/50 transition-all group text-left"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{tool.label}</p>
                      <p className="text-[10px] text-gray-400">from {tool.resource}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Analyses</p>
                <div className="space-y-2">
                  {history.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveTool({ id: 'history', label: item.tool, type: 'history' })
                        setResult(item.content)
                        if (item.question) setQuestion(item.question)
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700">{item.tool}</p>
                        <p className="text-[10px] text-gray-400">{new Date(item.time).toLocaleTimeString()}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content.slice(0, 100)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Active Tool View */
          <div className="p-4">
            <button onClick={handleBack} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-4 font-medium">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to tools
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-gray-800">{activeTool?.label || activeFeatureTool?.label}</h3>
            </div>

            {/* Freeform input for Ask AI */}
            {activeTool?.type === 'freeform' && (
              <form onSubmit={handleAsk} className="mb-4">
                <div className="relative">
                  <textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Ask any SOX audit question...&#10;&#10;Examples:&#10;• What are the key risks in our current audit?&#10;• How should we prioritize our deficiencies?&#10;• What controls need immediate attention?&#10;• Explain the COSO framework components"
                    className="w-full p-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none"
                    rows={5}
                  />
                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            )}

            {/* Feature-specific tool: Dropdown + samples */}
            {activeFeatureTool && (
              <div className="space-y-4 mb-4">
                {/* Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Data</label>
                  {featureDataLoading ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading data...
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={selectedItemId}
                        onChange={e => setSelectedItemId(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        <option value="">-- Select an item --</option>
                        {featureData.map(item => (
                          <option key={item.id} value={item.id}>
                            {item[activeFeatureTool.idField] || ''} — {(item[activeFeatureTool.nameField] || '').slice(0, 50)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleFeatureAnalyze}
                        disabled={!selectedItemId || loading}
                        className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 font-medium text-sm flex items-center gap-1.5 disabled:opacity-40 transition-all"
                      >
                        <Brain className="w-4 h-4" />
                        {loading ? '...' : 'Run'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Sample buttons */}
                {featureData.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quick Samples</label>
                    <div className="flex flex-wrap gap-1.5">
                      {featureData.slice(0, 6).map((item, i) => (
                        <button
                          key={item.id}
                          onClick={() => handleSampleClick(item)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-[11px] font-medium rounded-lg hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-all disabled:opacity-40"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          {item[activeFeatureTool.idField] || `#${i + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading for action tools */}
            {loading && !activeTool?.type?.includes('freeform') && !activeFeatureTool && (
              <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl mb-4">
                <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                <span className="text-sm text-primary-700 font-medium">AI is analyzing your data...</span>
              </div>
            )}

            {/* Result */}
            <AIOutput content={result} loading={loading && (activeTool?.type === 'freeform' || activeFeatureTool)} title={activeTool?.label || activeFeatureTool?.label || 'AI Analysis'} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
        <p className="text-[10px] text-gray-400 text-center">AI responses are advisory. Always apply professional judgment.</p>
      </div>
    </div>
  )
}
