import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Eye, Brain, ChevronLeft, Search, ChevronDown, Zap, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import AIOutput from '../components/AIOutput'

const samplePrompts = {
  controls: [
    'Evaluate if this control is designed effectively to prevent material misstatements',
    'Assess this control against COSO framework requirements',
    'Identify gaps in this control and recommend improvements',
  ],
  'risk-assessments': [
    'Validate the risk score and suggest if it should be higher or lower',
    'Recommend additional mitigation strategies for this risk',
    'Analyze how this risk impacts financial statement assertions',
  ],
  evidence: [
    'Evaluate if this evidence is sufficient for SOX audit purposes',
    'Assess the reliability and appropriateness of this evidence',
    'Identify what additional evidence is needed for this control',
  ],
  compliance: [
    'Explain the specific SOX requirements for this compliance item',
    'Identify gaps and provide a roadmap to achieve full compliance',
    'Compare our compliance status against industry best practices',
  ],
  deficiencies: [
    'Classify this deficiency and justify the classification',
    'Assess the financial statement impact of this deficiency',
    'Recommend a remediation plan with timeline and milestones',
  ],
  walkthroughs: [
    'Generate a professional control narrative for this walkthrough',
    'Identify control gaps found during this walkthrough',
    'Suggest improvements to the process documented in this walkthrough',
  ],
  'management-reviews': [
    'Evaluate the quality and thoroughness of this management review',
    'Assess if this review provides sufficient audit evidence',
    'Recommend improvements to make this review control more effective',
  ],
  itgc: [
    'Evaluate this ITGC control against industry standards',
    'Assess the impact of this ITGC on dependent business controls',
    'Identify testing gaps and recommend additional procedures',
  ],
  'financial-reviews': [
    'Analyze the variance and identify potential causes',
    'Assess the risk of material misstatement for this account',
    'Recommend substantive testing procedures for this account',
  ],
  'sod-reviews': [
    'Assess the severity of this SoD conflict and potential fraud scenarios',
    'Recommend compensating controls to mitigate this SoD risk',
    'Evaluate if the current mitigation is sufficient',
  ],
  'access-reviews': [
    'Evaluate if this access level follows least privilege principle',
    'Identify potential SoD conflicts with this access combination',
    'Assess the risk of this user access pattern',
  ],
  'change-requests': [
    'Assess the SOX impact of this change on financial reporting controls',
    'Evaluate if the change management process was properly followed',
    'Identify risks introduced by this change and recommend testing',
  ],
  'audit-reports': [
    'Generate an executive summary for this audit report',
    'Summarize key findings and recommend management actions',
    'Assess the overall audit opinion based on findings',
  ],
  policies: [
    'Perform a gap analysis against current SOX requirements',
    'Assess if this policy aligns with COSO framework',
    'Recommend updates needed for regulatory compliance',
  ],
  remediations: [
    'Evaluate if this remediation plan addresses the root cause',
    'Assess the timeline feasibility and resource adequacy',
    'Recommend verification steps to confirm remediation effectiveness',
  ],
  'audit-plans': [
    'Suggest resource allocation improvements for this audit plan',
    'Recommend risk-based prioritization of audit areas',
    'Optimize the timeline and identify potential bottlenecks',
  ],
  materiality: [
    'Validate the materiality threshold against industry benchmarks',
    'Assess if the benchmark selection is appropriate',
    'Recommend qualitative factors to consider',
  ],
  incidents: [
    'Assess the SOX compliance impact of this incident',
    'Perform root cause analysis and identify control failures',
    'Recommend preventive measures and reporting obligations',
  ],
}

export default function FeaturePage({ config }) {
  const { title, resource, columns, formFields, aiAction, aiLabel, icon: Icon, idField } = config
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [loading, setLoading] = useState(true)
  // AI Panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiDropdownItem, setAiDropdownItem] = useState('')
  const [aiPanelResult, setAiPanelResult] = useState('')
  const [aiPanelLoading, setAiPanelLoading] = useState(false)

  useEffect(() => {
    loadItems()
    setAiPanelOpen(false)
    setAiPanelResult('')
    setAiDropdownItem('')
  }, [resource])

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await api.getAll(resource)
      setItems(Array.isArray(data) ? data : (data?.data ?? []))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleRowClick = (item) => {
    setSelectedItem(item)
    setAiResult(item[config.aiField] || '')
    setShowDetail(true)
  }

  const handleNew = () => {
    setEditItem(null)
    const initial = {}
    formFields.forEach(f => { initial[f.name] = f.default || '' })
    if (idField) {
      const prefix = idField.replace('_id', '').toUpperCase().slice(0, 3)
      initial[idField] = `${prefix}-${String(items.length + 1).padStart(3, '0')}`
    }
    setFormData(initial)
    setShowForm(true)
  }

  const handleEdit = (item) => {
    setEditItem(item)
    const data = {}
    formFields.forEach(f => { data[f.name] = item[f.name] || '' })
    setFormData(data)
    setShowForm(true)
    setShowDetail(false)
  }

  const handleDelete = async (item) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await api.delete(resource, item.id)
      setItems(items.filter(i => i.id !== item.id))
      setShowDetail(false)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editItem) {
        const updated = await api.update(resource, editItem.id, formData)
        setItems(items.map(i => i.id === editItem.id ? updated : i))
      } else {
        const created = await api.create(resource, formData)
        setItems([created, ...items])
      }
      setShowForm(false)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleAI = async (item) => {
    setAiLoading(true)
    setAiResult('')
    try {
      const result = await aiAction(item.id)
      const content = result.analysis || result.narrative || result.summary || result.suggestions || ''
      setAiResult(content)
      const updated = await api.getOne(resource, item.id)
      setItems(items.map(i => i.id === item.id ? updated : i))
      setSelectedItem(updated)
    } catch (err) {
      setAiResult('Error: ' + err.message)
    }
    setAiLoading(false)
  }

  // AI Panel: run analysis on dropdown-selected item
  const handleAIPanelRun = async () => {
    if (!aiDropdownItem || !aiAction) return
    setAiPanelLoading(true)
    setAiPanelResult('')
    try {
      const result = await aiAction(parseInt(aiDropdownItem))
      const content = result.analysis || result.narrative || result.summary || result.suggestions || ''
      setAiPanelResult(content)
      // refresh item in list
      const updated = await api.getOne(resource, parseInt(aiDropdownItem))
      setItems(items.map(i => i.id === parseInt(aiDropdownItem) ? updated : i))
    } catch (err) {
      setAiPanelResult('Error: ' + err.message)
    }
    setAiPanelLoading(false)
  }

  // Sample button: pick a random item and run AI
  const handleSampleRun = async (index) => {
    if (!aiAction || items.length === 0) return
    // Pick different items for different sample buttons
    const itemIndex = Math.min(index, items.length - 1)
    const item = items[itemIndex]
    setAiDropdownItem(String(item.id))
    setAiPanelLoading(true)
    setAiPanelResult('')
    try {
      const result = await aiAction(item.id)
      const content = result.analysis || result.narrative || result.summary || result.suggestions || ''
      setAiPanelResult(content)
      const updated = await api.getOne(resource, item.id)
      setItems(items.map(i => i.id === item.id ? updated : i))
    } catch (err) {
      setAiPanelResult('Error: ' + err.message)
    }
    setAiPanelLoading(false)
  }

  // Get display name for an item
  const getItemLabel = (item) => {
    const idVal = item[idField] || ''
    const nameVal = item.name || item.title || item.process_name || item.account_name || item.user_name || item.requirement || ''
    return `${idVal} — ${nameVal}`.slice(0, 80)
  }

  const prompts = samplePrompts[resource] || []

  const filtered = items.filter(item => {
    if (!search) return true
    return Object.values(item).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5 text-white" /></div>}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-500">{items.length} items</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiAction && (
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                aiPanelOpen
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-primary-50 to-purple-50 text-primary-700 border border-primary-200 hover:from-primary-100 hover:to-purple-100'
              }`}
            >
              <Brain className="w-4 h-4" />
              {aiLabel || 'AI Analyze'}
            </button>
          )}
          <button onClick={handleNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {aiPanelOpen && aiAction && (
        <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 border border-primary-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{aiLabel || 'AI Analysis'}</h3>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full ml-1">AI Powered</span>
          </div>

          {/* Dropdown to select item */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select item to analyze</label>
            <div className="flex gap-2">
              <select
                value={aiDropdownItem}
                onChange={e => setAiDropdownItem(e.target.value)}
                className="input-field flex-1"
              >
                <option value="">-- Select an item --</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{getItemLabel(item)}</option>
                ))}
              </select>
              <button
                onClick={handleAIPanelRun}
                disabled={!aiDropdownItem || aiPanelLoading}
                className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-5 py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2 disabled:opacity-40"
              >
                <Brain className="w-4 h-4" />
                {aiPanelLoading ? 'Analyzing...' : 'Run AI'}
              </button>
            </div>
          </div>

          {/* Sample buttons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick samples — click to auto-run AI on sample data</label>
            <div className="flex flex-wrap gap-2">
              {items.slice(0, 5).map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => handleSampleRun(i)}
                  disabled={aiPanelLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary-200 text-primary-700 text-xs font-medium rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-all disabled:opacity-40"
                >
                  <Zap className="w-3 h-3" />
                  {item[idField] || `Sample ${i + 1}`}: {(item.name || item.title || item.process_name || item.account_name || item.user_name || '').slice(0, 30)}
                </button>
              ))}
            </div>
          </div>

          {/* Sample prompts */}
          {prompts.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Example analysis prompts</label>
              <div className="space-y-1.5">
                {prompts.map((prompt, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-white/60 rounded-lg p-2.5 border border-gray-100">
                    <span className="w-5 h-5 bg-primary-100 text-primary-700 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold">{i + 1}</span>
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Result */}
          <AIOutput content={aiPanelResult} loading={aiPanelLoading} title={aiLabel || 'AI Analysis'} />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="input-field pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {columns.map(col => (
                    <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render ? col.render(item[col.key], item) :
                          col.badge ? <StatusBadge status={item[col.key]} /> :
                          <span className="text-gray-700">{item[col.key]}</span>
                        }
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {aiAction && (
                          <button onClick={() => { setSelectedItem(item); handleAI(item); setShowDetail(true) }} className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600" title="AI Analyze">
                            <Brain className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleRowClick(item)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-yellow-100 rounded-lg text-yellow-600" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => { setShowDetail(false); setAiResult('') }} title="Details" size="xl">
        {selectedItem && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {formFields.map(f => (
                <div key={f.name} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 min-h-[40px]">
                    {f.badge ? <StatusBadge status={selectedItem[f.name]} /> : (selectedItem[f.name] || '—')}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => handleEdit(selectedItem)} className="btn-primary flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => handleDelete(selectedItem)} className="btn-danger flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
              {aiAction && (
                <button onClick={() => handleAI(selectedItem)} disabled={aiLoading} className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" /> {aiLoading ? 'Analyzing...' : (aiLabel || 'AI Analyze')}
                </button>
              )}
            </div>

            <AIOutput content={aiResult} loading={aiLoading} title={aiLabel || 'AI Analysis'} />
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Item' : 'New Item'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {formFields.map(f => (
              <div key={f.name} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    className="input-field h-24"
                    required={f.required}
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    className="input-field"
                    required={f.required}
                  >
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={formData[f.name] || ''}
                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                    className="input-field"
                    required={f.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="btn-primary">{editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
