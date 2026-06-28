import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Paperclip, Send, Sparkles, X } from 'lucide-react'
import { api } from '../services/api'
import AIOutput from './AIOutput'

const quick = [
  'Open Control Library',
  'List records here',
  'Create deficiency for missing approval evidence',
  'Run AI on this page',
  'Show dashboard counts',
  'Run regulatory digest',
  'Verify audit trail',
]

function titleize(s) {
  return String(s || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatPreviewValue(value) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'object' ? formatPreviewValue(item) : String(item))).join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .slice(0, 5)
      .map(([key, nested]) => `${titleize(key)}: ${formatPreviewValue(nested)}`)
      .join(' | ')
  }
  return String(value)
}

function DataPreview({ data }) {
  if (!data) return null
  if (data.analysis || data.result || data.summary || data.findings || data.recommendations) {
    return <AIOutput content={data.analysis || data.result || data} title="System Chat Result" />
  }
  const rows = Array.isArray(data) ? data : Array.isArray(data.rows) ? data.rows : null
  if (rows) {
    return (
      <div className="mt-3 bg-white border border-gray-100 rounded-lg overflow-hidden">
        <p className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">{rows.length} records</p>
        <div className="max-h-36 overflow-auto p-2 space-y-1">
          {rows.slice(0, 5).map((row, i) => (
            <div key={row.id || i} className="text-xs bg-gray-50 rounded p-2">
              {row.name || row.title || row.template_id || row.request_id || row.control_id || row.evidence_id || `Record ${row.id || i + 1}`}
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (typeof data === 'object') {
    return (
      <div className="mt-3 grid gap-2">
        {Object.entries(data).slice(0, 6).map(([k, v]) => (
          <div key={k} className="text-xs bg-white rounded p-2">
            <span className="font-semibold text-gray-500">{titleize(k)}: </span>{formatPreviewValue(v)}
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function SystemChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Ask me to operate SOX Audit AI: open pages, list records, create records, attach evidence, run AI, update workflow states, delete with explicit wording, or run SOX Ops actions.' },
  ])
  const bottom = useRef(null)
  const fileInput = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { if (open) bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const send = async (override) => {
    const text = (override || input).trim()
    if ((!text && !file) || loading) return
    setOpen(true)
    setInput('')
    setLoading(true)
    const selectedFile = file
    setFile(null)
    const userContent = selectedFile ? `${text || 'Upload evidence file'}\nAttached: ${selectedFile.name}` : text
    setMessages((m) => [...m, { id: Date.now(), role: 'user', content: userContent }])
    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', text || selectedFile.name)
        formData.append('description', text || 'Uploaded through System Chat')
        const result = await api.uploadEvidence(formData)
        navigate('/evidence-vault')
        setMessages((m) => [...m, {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Evidence uploaded successfully: ${result.evidence?.title || selectedFile.name}.`,
          action: 'upload_evidence',
          data: { evidence: result.evidence, hash: result.hash, file: result.file },
        }])
        return
      }
      const result = await api.systemChat(text, { route: window.location.pathname })
      if (result.route) navigate(result.route)
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', content: result.reply, action: result.action, data: result.data }])
    } catch (err) {
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', content: `Request failed: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-[420px] max-w-[calc(100vw-2rem)] h-[610px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div><h2 className="font-bold text-sm">System Chat</h2><p className="text-xs text-white/75">Controls app pages, APIs, and AI tools</p></div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-3 bg-gray-50 border-b flex flex-wrap gap-2">
            {quick.map((q) => <button key={q} onClick={() => send(q)} className="text-[11px] px-2 py-1 rounded-full bg-white border hover:bg-primary-50">{q}</button>)}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.action && <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-white text-primary-700">{titleize(msg.action)}</span>}
                  {msg.role !== 'user' && <DataPreview data={msg.data} />}
                </div>
              </div>
            ))}
            {loading && <div className="text-sm text-gray-500 bg-gray-100 rounded-2xl p-3 inline-block">Calling SOX APIs...</div>}
            <div ref={bottom} />
          </div>
          <div className="p-3 bg-gray-50 border-t flex gap-2">
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.docx,.doc,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={loading}
              className={`self-end h-[46px] px-3 rounded-lg border transition-colors ${file ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              title={file ? `Selected: ${file.name}` : 'Attach evidence file'}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={file ? `Ready to upload: ${file.name}` : 'Try: create deficiency..., move deficiency 9 to in remediation, attach evidence...'}
              className="input-field min-h-[46px] resize-none"
            />
            <button onClick={() => send()} disabled={(!input.trim() && !file) || loading} className="btn-primary px-3 self-end h-[46px]"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform">
        {open ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
      </button>
    </div>
  )
}
