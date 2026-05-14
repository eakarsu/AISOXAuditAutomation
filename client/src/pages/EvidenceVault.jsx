import { useState, useRef } from 'react'
import { api } from '../services/api'
import { Upload, FileText, Hash, CheckCircle, AlertCircle, Download } from 'lucide-react'

export default function EvidenceVault() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', control_ref: '', evidence_id: '' })
  const fileRef = useRef(null)

  const handleUpload = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files[0]
    if (!file) { setError('Please select a file'); return }
    setUploading(true); setError(null); setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
      const data = await api.uploadEvidence(formData)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="w-7 h-7 text-indigo-600" /> Evidence Vault
        </h1>
        <p className="text-gray-500 mt-1">Upload evidence files with SHA-256 chain of custody. AI auto-classifies document types.</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Evidence File</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidence ID</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="Auto-generated if blank"
                value={form.evidence_id}
                onChange={e => setForm(f => ({ ...f, evidence_id: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Control Reference</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. CTRL-001"
                value={form.control_ref}
                onChange={e => setForm(f => ({ ...f, control_ref: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Evidence title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              rows={2}
              placeholder="Description of evidence"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
              <input ref={fileRef} type="file" className="hidden" id="evidence-file"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.docx,.doc,.txt" />
              <label htmlFor="evidence-file" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to select file (PDF, Excel, Word, CSV, images)</p>
                <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload Evidence</>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Evidence Uploaded Successfully</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Evidence ID</p>
              <p className="font-medium text-gray-900">{result.evidence?.evidence_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium text-gray-900">{result.evidence?.status}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 flex items-center gap-1"><Hash className="w-3 h-3" /> SHA-256 Hash (Chain of Custody)</p>
              <p className="font-mono text-xs text-gray-800 bg-gray-100 p-2 rounded mt-1 break-all">{result.hash}</p>
            </div>
            <div>
              <p className="text-gray-500">File Size</p>
              <p className="font-medium">{result.file?.size ? (result.file.size / 1024).toFixed(1) + ' KB' : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Doc Type (AI Classified)</p>
              <p className="font-medium text-indigo-700">{result.evidence?.doc_type || 'Classifying...'}</p>
            </div>
          </div>
          <a
            href={api.getEvidenceFileUrl(result.evidence?.id)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Download className="w-4 h-4" /> Download File
          </a>
        </div>
      )}
    </div>
  )
}
