const CONFIG = {
  not_contacted: {
    label: 'Not Contacted',
    dot: 'bg-gray-300',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  draft_created: {
    label: 'Draft Created',
    dot: 'bg-blue-400',
    className: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  sent: {
    label: 'Sent',
    dot: 'bg-amber-400',
    className: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  replied: {
    label: 'Replied',
    dot: 'bg-emerald-400',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  not_interested: {
    label: 'Not Interested',
    dot: 'bg-red-400',
    className: 'bg-red-50 text-red-500 border-red-100',
  },
}

export default function StatusBadge({ status }) {
  const { label, dot, className } = CONFIG[status] ?? CONFIG.not_contacted
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  )
}

export const STATUS_OPTIONS = Object.entries(CONFIG).map(([value, { label }]) => ({ value, label }))
