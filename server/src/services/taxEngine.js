// UK 2025/26 tax rates
const TAX_CONFIG = {
  personalAllowance:     12570,
  basicRateLimit:        50270,
  higherRateLimit:      125140,
  basicRate:              0.20,
  higherRate:             0.40,
  additionalRate:         0.45,

  // Employee NI thresholds (annual)
  niPrimaryThreshold:    12570,
  niUpperEarningsLimit:  50270,
  niEmployeeBasicRate:    0.08,
  niEmployeeUpperRate:    0.02,

  // Employer NI
  niSecondaryThreshold:   9100,
  niEmployerRate:         0.138,

  // Other
  umbrellaFeeWeekly:      25,    // flat weekly fee
  pensionRate:            0.05,  // 5% employee pension auto-enrolment
  studentLoanThreshold:  27295,  // Plan 2
  studentLoanRate:        0.09,
}

// annualise → calculate → de-annualise back to weekly/fortnightly
export function calculateGrossToNet(grossPay, hoursWorked, taxCode = '1257L', hasStudentLoan = false) {
  const gross = Number(grossPay)

  // annualise the gross (assume weekly pay × 52)
  const annualGross = gross * 52

  // ── Income Tax ──────────────────────────────────────────
  const { personalAllowance, basicRateLimit, higherRateLimit } = TAX_CONFIG

  let annualTax = 0
  const taxableIncome = Math.max(0, annualGross - personalAllowance)

  if (taxableIncome <= (basicRateLimit - personalAllowance)) {
    annualTax = taxableIncome * TAX_CONFIG.basicRate
  } else if (taxableIncome <= (higherRateLimit - personalAllowance)) {
    annualTax =
      (basicRateLimit - personalAllowance) * TAX_CONFIG.basicRate +
      (taxableIncome - (basicRateLimit - personalAllowance)) * TAX_CONFIG.higherRate
  } else {
    annualTax =
      (basicRateLimit - personalAllowance) * TAX_CONFIG.basicRate +
      (higherRateLimit - basicRateLimit) * TAX_CONFIG.higherRate +
      (taxableIncome - (higherRateLimit - personalAllowance)) * TAX_CONFIG.additionalRate
  }

  const weeklyTax = annualTax / 52

  // ── Employee National Insurance ──────────────────────────
  const { niPrimaryThreshold, niUpperEarningsLimit } = TAX_CONFIG
  const annualPrimaryThreshold = niPrimaryThreshold
  const annualUpperLimit = niUpperEarningsLimit

  let annualEmployeeNI = 0
  if (annualGross > annualPrimaryThreshold) {
    const basicNI = Math.min(annualGross, annualUpperLimit) - annualPrimaryThreshold
    annualEmployeeNI += basicNI * TAX_CONFIG.niEmployeeBasicRate
    if (annualGross > annualUpperLimit) {
      annualEmployeeNI += (annualGross - annualUpperLimit) * TAX_CONFIG.niEmployeeUpperRate
    }
  }
  const weeklyEmployeeNI = annualEmployeeNI / 52

  // ── Employer National Insurance ──────────────────────────
  let annualEmployerNI = 0
  if (annualGross > TAX_CONFIG.niSecondaryThreshold) {
    annualEmployerNI = (annualGross - TAX_CONFIG.niSecondaryThreshold) * TAX_CONFIG.niEmployerRate
  }
  const weeklyEmployerNI = annualEmployerNI / 52

  // ── Pension (auto-enrolment) ─────────────────────────────
  const weeklyPension = gross * TAX_CONFIG.pensionRate

  // ── Student Loan ─────────────────────────────────────────
  let weeklyStudentLoan = 0
  if (hasStudentLoan && annualGross > TAX_CONFIG.studentLoanThreshold) {
    weeklyStudentLoan = ((annualGross - TAX_CONFIG.studentLoanThreshold) * TAX_CONFIG.studentLoanRate) / 52
  }

  // ── Umbrella Fee ─────────────────────────────────────────
  const weeklyUmbrellaFee = TAX_CONFIG.umbrellaFeeWeekly

  // ── Net Pay ──────────────────────────────────────────────
  const totalDeductions =
    weeklyTax +
    weeklyEmployeeNI +
    weeklyPension +
    weeklyStudentLoan +
    weeklyUmbrellaFee

  const netPay = gross - totalDeductions

  return {
    grossPay:         round(gross),
    incomeTax:        round(weeklyTax),
    employeeNI:       round(weeklyEmployeeNI),
    employerNI:       round(weeklyEmployerNI),
    pensionEmployee:  round(weeklyPension),
    studentLoan:      round(weeklyStudentLoan),
    umbrellaFee:      round(weeklyUmbrellaFee),
    netPay:           round(netPay),
    taxCode,
    breakdown: {
      annualGross:    round(annualGross),
      annualTax:      round(annualTax),
      effectiveTaxRate: round((weeklyTax / gross) * 100) + '%'
    }
  }
}

function round(val) {
  return Math.round(val * 100) / 100
}