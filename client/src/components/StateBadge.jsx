const STATE_STYLES = {
  WORK_SUBMITTED:       'bg-yellow-100 text-yellow-800',
  WORK_APPROVED:        'bg-green-100 text-green-800',
  WORK_REJECTED:        'bg-red-100 text-red-800',
  INVOICE_GENERATED:    'bg-blue-100 text-blue-800',
  INVOICE_APPROVED:     'bg-blue-200 text-blue-900',
  PAYMENT_PENDING:      'bg-orange-100 text-orange-800',
  PAYMENT_RECEIVED:     'bg-green-200 text-green-900',
  PAYROLL_PROCESSING:   'bg-purple-100 text-purple-800',
  PAYROLL_COMPLETED:    'bg-purple-200 text-purple-900',
  COMPLIANCE_SUBMITTED: 'bg-teal-100 text-teal-800',
  COMPLETED:            'bg-gray-100 text-gray-800',
}

export default function StateBadge({ state }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATE_STYLES[state] ?? 'bg-gray-100 text-gray-600'}`}>
      {state?.replace(/_/g, ' ')}
    </span>
  )
}