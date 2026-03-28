export const STATE_CONFIG = {
  WORK_SUBMITTED:       { label: 'Work submitted',        bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  WORK_APPROVED:        { label: 'Work approved',         bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  WORK_REJECTED:        { label: 'Work rejected',         bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  INVOICE_GENERATED:    { label: 'Invoice generated',     bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  INVOICE_APPROVED:     { label: 'Invoice approved',      bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  PAYMENT_PENDING:      { label: 'Payment pending',       bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  PAYMENT_RECEIVED:     { label: 'Payment received',      bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  PAYROLL_PROCESSING:   { label: 'Payroll processing',    bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  PAYROLL_COMPLETED:    { label: 'Payroll completed',     bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  COMPLIANCE_SUBMITTED: { label: 'Compliance submitted',  bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  COMPLETED:            { label: 'Completed',             bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
}

export const PIPELINE_STEPS = [
  'WORK_SUBMITTED',
  'WORK_APPROVED',
  'INVOICE_GENERATED',
  'INVOICE_APPROVED',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'PAYROLL_PROCESSING',
  'PAYROLL_COMPLETED',
  'COMPLIANCE_SUBMITTED',
  'COMPLETED',
]