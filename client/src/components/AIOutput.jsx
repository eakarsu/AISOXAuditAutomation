import { Brain, Sparkles } from 'lucide-react'

export default function AIOutput({ content, loading, title = 'AI Analysis' }) {
  if (loading) {
    return (
      <div className="ai-output mt-4 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-primary-600 animate-spin" />
          <span className="text-primary-700 font-medium">AI is analyzing...</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-primary-100 rounded w-3/4"></div>
          <div className="h-4 bg-primary-100 rounded w-1/2"></div>
          <div className="h-4 bg-primary-100 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (!content) return null

  // Normalize any shape (object, JSON string, or markdown text) into clean sections
  const sections = buildSections(content)

  return (
    <div className="ai-output mt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">AI Generated</span>
      </div>
      <div className="space-y-3">
        {sections.map((section, i) => (
          <div key={i} className={section.type === 'heading' ? 'mt-4' : ''}>
            {section.type === 'heading' ? (
              <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide border-b border-primary-100 pb-1 mb-2">
                {section.content}
              </h4>
            ) : section.type === 'bullet' ? (
              <div className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
                <p className="text-gray-700 text-sm leading-relaxed">{section.content}</p>
              </div>
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed">{section.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function humanizeKey(key) {
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Turn whatever the AI returned into a flat list of professional sections.
// Never renders raw JSON braces to the user.
function buildSections(content) {
  let data = content

  if (typeof content === 'string') {
    const t = content.trim()
    // Strip code fences the model sometimes wraps JSON in
    const unfenced = t.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim()
    if ((unfenced.startsWith('{') && unfenced.endsWith('}')) ||
        (unfenced.startsWith('[') && unfenced.endsWith(']'))) {
      try { data = JSON.parse(unfenced) } catch { return parseMarkdown(content) }
    } else {
      return parseMarkdown(content)
    }
  }

  if (data && typeof data === 'object') return objectToSections(data)
  return parseMarkdown(String(data ?? ''))
}

function objectToSections(obj) {
  const out = []
  const entries = Array.isArray(obj)
    ? obj.map((v, i) => [String(i + 1), v])
    : Object.entries(obj)

  for (const [key, value] of entries) {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) continue

    if (Array.isArray(value)) {
      out.push({ type: 'heading', content: humanizeKey(key) })
      for (const v of value) {
        if (v && typeof v === 'object') {
          out.push({ type: 'bullet', content: Object.values(v).filter(Boolean).join(' — ') })
        } else {
          out.push({ type: 'bullet', content: String(v) })
        }
      }
    } else if (typeof value === 'object') {
      out.push({ type: 'heading', content: humanizeKey(key) })
      out.push(...objectToSections(value))
    } else {
      out.push({ type: 'heading', content: humanizeKey(key) })
      out.push({ type: 'paragraph', content: String(value) })
    }
  }
  return out
}

function parseMarkdown(content) {
  if (!content) return []
  const lines = content.split('\n').filter(l => l.trim())
  return lines.map(line => {
    const trimmed = line.trim()
    if (/^#{1,3}\s/.test(trimmed) || /^\*\*[^*]+\*\*\s*$/.test(trimmed) || /^\d+\.\s+\*\*/.test(trimmed)) {
      return { type: 'heading', content: trimmed.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '').replace(/^\d+\.\s+/, '') }
    }
    if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      return { type: 'bullet', content: trimmed.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '').replace(/\*\*/g, '') }
    }
    return { type: 'paragraph', content: trimmed.replace(/\*\*/g, '') }
  })
}
