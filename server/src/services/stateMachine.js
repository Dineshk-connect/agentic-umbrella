// Valid transitions — the ONLY moves allowed
const VALID_TRANSITIONS = {
  WORK_SUBMITTED:       ['WORK_APPROVED', 'WORK_REJECTED'],
  WORK_REJECTED:        ['WORK_SUBMITTED'],   // contractor can resubmit
  WORK_APPROVED:        ['INVOICE_GENERATED'],
  INVOICE_GENERATED:    ['INVOICE_APPROVED'],
  INVOICE_APPROVED:     ['PAYMENT_PENDING'],
  PAYMENT_PENDING:      ['PAYMENT_RECEIVED'],
  PAYMENT_RECEIVED:     ['PAYROLL_PROCESSING'],
  PAYROLL_PROCESSING:   ['PAYROLL_COMPLETED'],
  PAYROLL_COMPLETED:    ['COMPLIANCE_SUBMITTED'],
  COMPLIANCE_SUBMITTED: ['COMPLETED'],
  COMPLETED:            []
}

export function canTransition(currentState, nextState) {
  const allowed = VALID_TRANSITIONS[currentState] ?? []
  return allowed.includes(nextState)
}

export function transition(currentState, nextState) {
  if (!canTransition(currentState, nextState)) {
    throw new Error(
      `Invalid transition: ${currentState} → ${nextState}. ` +
      `Allowed: ${VALID_TRANSITIONS[currentState]?.join(', ') || 'none'}`
    )
  }
  return nextState
}