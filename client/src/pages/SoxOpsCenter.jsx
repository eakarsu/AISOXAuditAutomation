import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Bell, BookOpen, CheckCircle, FileCheck, FileText, GitBranch, Link as LinkIcon, Pencil, Send, Shield, Trash2, X, Zap } from 'lucide-react'
import { api } from '../services/api'
import AIOutput from '../components/AIOutput'
import StatusBadge from '../components/StatusBadge'

const icons = {
  'control-library': Shield,
  'evidence-requests': Send,
  'policy-mapping': LinkIcon,
  'audit-workflows': GitBranch,
  'risk-dashboard': Activity,
  'remediation-retests': CheckCircle,
  'audit-trail': FileText,
  'report-exports': FileCheck,
  integrations: LinkIcon,
  notifications: Bell,
  'trends-retests': Activity,
  'executive-dashboards': BookOpen,
}

function titleize(key) {
  return String(key || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
  if (typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value))) return new Date(value).toLocaleString()
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nested]) => `${titleize(key)}: ${formatValue(nested)}`)
      .join(' | ')
  }
  return String(value)
}

function DetailModal({ module, row, onClose, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(row || {})
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [actionError, setActionError] = useState('')
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const analysisRef = useRef(null)
  const rowId = row?.id

  useEffect(() => {
    setForm(row || {})
    setEditing(false)
    setAnalysis(null)
    setActionError('')
    setShowAnalysisModal(false)
  }, [rowId])

  useEffect(() => {
    if (running || analysis || actionError) {
      analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [running, analysis, actionError])

  if (!module || !row) return null

  const entries = Object.entries(form).filter(([key]) => !['id', 'ai_summary', 'ai_analysis', 'last_action_at'].includes(key))

  const runAction = async () => {
    setShowAnalysisModal(true)
    setRunning(true)
    setAnalysis(null)
    setActionError('')
    try {
      const result = await api.runSoxOpsAction(module.key, row.id)
      setForm(result.row)
      setAnalysis(result.analysis)
      onUpdated(result.row)
    } catch (err) {
      setActionError(err.message || 'Action failed')
      setAnalysis({ summary: `Action failed: ${err.message}` })
    } finally {
      setRunning(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'id'))
      const result = await api.updateSoxOpsRow(module.key, row.id, payload)
      setForm(result.row)
      onUpdated(result.row)
      setEditing(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this SOX Ops record?')) return
    try {
      await api.deleteSoxOpsRow(module.key, row.id)
      onDeleted(row.id)
      onClose()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">{module.title}</p>
            <h2 className="text-xl font-bold text-gray-800 mt-1">{row.name || row.title || row.template_id || row.request_id || row.workflow_id || row.dashboard_id || `Record ${row.id}`}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[62vh]">
          <div ref={analysisRef}>
            {(running || analysis || actionError) && (
              <div className="mb-6 rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
                {running ? (
                  <AIOutput content={null} loading title={`${module.primaryAction} Analysis`} />
                ) : actionError ? (
                  <AIOutput content={{ summary: `Action failed: ${actionError}`, recommendations: ['Check that the backend is running and restart ./start.sh if this route was just added.'] }} title={`${module.primaryAction} Analysis`} />
                ) : (
                  <AIOutput content={analysis} title={`${module.primaryAction} Analysis`} />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entries.map(([key, value]) => (
              <div key={key} className="border border-gray-100 bg-gray-50 rounded-xl p-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{titleize(key)}</label>
                {editing ? (
                  <textarea
                    value={formatValue(value)}
                    onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                    className="mt-1 input-field min-h-[64px]"
                  />
                ) : /status|risk|priority|severity|coverage/i.test(key) ? (
                  <div className="mt-2"><StatusBadge status={formatValue(value)} /></div>
                ) : (
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{formatValue(value)}</p>
                )}
              </div>
            ))}
          </div>

        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-end gap-2">
          <div className="mr-auto text-sm">
            {running && <span className="text-primary-700 font-medium">Running {module.primaryAction}...</span>}
            {!running && analysis && <span className="text-green-700 font-medium">Analysis ready. See report above.</span>}
            {!running && actionError && <span className="text-red-700 font-medium">Action failed. See message above.</span>}
          </div>
          <button type="button" onClick={runAction} disabled={running} className="btn-secondary flex items-center gap-2">
            <Zap className="w-4 h-4" /> {running ? 'Running AI...' : module.primaryAction}
          </button>
          {editing ? (
            <button type="button" onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          <button type="button" onClick={remove} className="btn-danger flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>

      {showAnalysisModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[82vh] overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">{module.title}</p>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{module.primaryAction} Result</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {running ? 'Running AI analysis now...' : actionError ? 'The action returned an error.' : 'Analysis completed.'}
                </p>
              </div>
              <button type="button" onClick={() => setShowAnalysisModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(82vh-96px)]">
              {running ? (
                <AIOutput content={null} loading title={`${module.primaryAction} Analysis`} />
              ) : actionError ? (
                <AIOutput content={{ summary: `Action failed: ${actionError}`, recommendations: ['Confirm the backend is running, refresh the browser, then try again.'] }} title={`${module.primaryAction} Analysis`} />
              ) : (
                <AIOutput content={analysis} title={`${module.primaryAction} Analysis`} />
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button type="button" onClick={() => setShowAnalysisModal(false)} className="btn-primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SoxOpsCenter({ initialModuleKey = 'control-library' }) {
  const { moduleKey: routeModuleKey } = useParams()
  const [summary, setSummary] = useState(null)
  const lockedModuleKey = routeModuleKey || initialModuleKey
  const [moduleKey, setModuleKey] = useState(lockedModuleKey)
  const [module, setModule] = useState(null)
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const selectedMeta = useMemo(() => summary?.modules?.find((m) => m.key === moduleKey), [summary, moduleKey])

  useEffect(() => {
    setModuleKey(lockedModuleKey)
    setSelected(null)
  }, [lockedModuleKey])

  useEffect(() => {
    api.getSoxOpsSummary().then(setSummary).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    api.getSoxOpsModule(moduleKey)
      .then((data) => {
        setModule(data)
        setRows(data.rows || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [moduleKey])

  const updateRow = (updated) => {
    setRows((current) => current.map((row) => row.id === updated.id ? updated : row))
    setSelected(updated)
  }

  const deleteRow = (id) => {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">SOX Ops Center</p>
          <h1 className="text-3xl font-bold text-gray-800 mt-1">Missing Feature Operations</h1>
          <p className="text-gray-500 mt-2 max-w-3xl">
            Full workflow surfaces for control templates, evidence requests, policy mapping, signoffs, audit trail, integrations, notifications, trends, dashboards, and reports.
          </p>
        </div>
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center min-w-[110px]"><p className="text-2xl font-bold text-primary-600">{summary.module_count}</p><p className="text-xs text-gray-500">Modules</p></div>
            <div className="card text-center min-w-[110px]"><p className="text-2xl font-bold text-green-600">{summary.record_count}</p><p className="text-xs text-gray-500">Records</p></div>
            <div className="card text-center min-w-[110px]"><p className="text-2xl font-bold text-amber-600">{summary.attention_count}</p><p className="text-xs text-gray-500">Attention</p></div>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${routeModuleKey ? '' : 'xl:grid-cols-[330px_1fr]'} gap-5`}>
        {!routeModuleKey && (
          <aside className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Feature modules</h2>
            <div className="space-y-2">
              {(summary?.modules || []).map((m) => {
                const Icon = icons[m.key] || Shield
                const active = moduleKey === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => setModuleKey(m.key)}
                    className={`w-full text-left rounded-xl border p-3 transition ${active ? 'border-primary-300 bg-primary-50' : 'border-gray-100 bg-gray-50 hover:bg-white'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-primary-600 text-white' : 'bg-white text-primary-600'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{m.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.count} records · {m.attention} attention</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{module?.title || selectedMeta?.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{module?.description || selectedMeta?.description}</p>
            </div>
            {module && <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">{rows.length} records</span>}
          </div>

          {loading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {module.columns.map((c) => <th key={c} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{titleize(c)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={row.id} onClick={() => setSelected(row)} className="hover:bg-primary-50/50 cursor-pointer">
                      {module.columns.map((c) => (
                        <td key={c} className="px-4 py-3 text-sm text-gray-700 max-w-[240px] truncate">
                          {/status|risk|priority|severity|coverage/i.test(c) ? <StatusBadge status={formatValue(row[c])} /> : formatValue(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <DetailModal module={module} row={selected} onClose={() => setSelected(null)} onUpdated={updateRow} onDeleted={deleteRow} />
    </div>
  )
}
