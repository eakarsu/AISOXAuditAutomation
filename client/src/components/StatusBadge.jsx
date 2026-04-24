const statusColors = {
  'Effective': 'bg-green-100 text-green-700',
  'Partially Effective': 'bg-yellow-100 text-yellow-700',
  'Ineffective': 'bg-red-100 text-red-700',
  'Not Tested': 'bg-gray-100 text-gray-600',
  'Open': 'bg-red-100 text-red-700',
  'Closed': 'bg-green-100 text-green-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Pending Review': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Completed': 'bg-green-100 text-green-700',
  'Not Started': 'bg-gray-100 text-gray-600',
  'Draft': 'bg-gray-100 text-gray-600',
  'Active': 'bg-green-100 text-green-700',
  'Inactive': 'bg-gray-100 text-gray-600',
  'Scheduled': 'bg-blue-100 text-blue-700',
  'Planning': 'bg-blue-100 text-blue-700',
  'Executing': 'bg-indigo-100 text-indigo-700',
  'High': 'bg-red-100 text-red-700',
  'Critical': 'bg-red-200 text-red-800',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'Low': 'bg-green-100 text-green-700',
  'Pass': 'bg-green-100 text-green-700',
  'Fail': 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}
