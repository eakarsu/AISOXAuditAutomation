import { Wand2 } from 'lucide-react'

/**
 * Renders a row of one-click "example" buttons that fill an AI feature's
 * input fields with realistic sample data.
 *
 * @param {{label:string, values:object}[]} presets - scenarios to offer
 * @param {(values:object)=>void} onApply - called with the chosen preset's values
 * @param {string} [title] - row label
 */
export default function PresetButtons({ presets = [], onApply, title = 'Quick fill' }) {
  if (!presets.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> {title}:
      </span>
      {presets.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onApply(p.values)}
          className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
