import { prisma } from '../lib/prisma.js'

// UK tax code validation — basic format check
function isValidTaxCode(code) {
  if (!code) return false
  // standard codes: 1257L, BR, D0, D1, NT, 0T
  const standard = /^\d{1,4}[LMNPTY]$/.test(code.trim())
  const special = ['BR', 'D0', 'D1', 'NT', '0T', 'K'].some(c =>
    code.trim().startsWith(c)
  )
  return standard || special
}

// UK NI number format: two letters, six digits, one letter (A-D)
function isValidNINumber(ni) {
  if (!ni) return false
  return /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/i.test(ni.trim())
}

export async function runComplianceCheck(workRecordId, actorId) {
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    include: {
      contractor: true,
      payroll: true
    }
  })

  if (!workRecord) throw new Error('Work record not found')
  if (workRecord.state !== 'PAYROLL_COMPLETED') {
    throw new Error(`Compliance check requires PAYROLL_COMPLETED state. Current: ${workRecord.state}`)
  }

  const contractor = workRecord.contractor
  const failures = []

  // ── Run all checks ───────────────────────────────────────

  if (!isValidTaxCode(contractor.taxCode)) {
    failures.push({
      type: 'INVALID_TAX_CODE',
      description: `Tax code "${contractor.taxCode}" is invalid or missing`
    })
  }

  if (!isValidNINumber(contractor.niNumber)) {
    failures.push({
      type: 'MISSING_NI_NUMBER',
      description: `NI number "${contractor.niNumber}" is invalid or missing`
    })
  }

  // payroll anomaly check — flag if net pay is less than 50% of gross
  if (workRecord.payroll) {
    const gross = Number(workRecord.payroll.grossPay)
    const net = Number(workRecord.payroll.netPay)
    if (net < gross * 0.5) {
      failures.push({
        type: 'PAYROLL_ANOMALY',
        description: `Net pay £${net} is less than 50% of gross £${gross}. Manual review required.`
      })
    }
  }

  // ── If failures — raise exceptions and block ─────────────

  if (failures.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const failure of failures) {
        await tx.exception.create({
          data: {
            workRecordId,
            type: failure.type,
            status: 'OPEN',
            description: failure.description,
            metadata: { contractorId: contractor.id }
          }
        })
      }

      await tx.auditLog.create({
        data: {
          actorId,
          eventType: 'COMPLIANCE_FAILED',
          workRecordId,
          beforeState: workRecord.state,
          afterState: workRecord.state,
          metadata: { failures }
        }
      })
    })

    return {
      passed: false,
      failures,
      message: 'Compliance check failed. Exceptions raised. Resolve before filing.'
    }
  }

  // ── All checks passed — simulate RTI submission ───────────

  const rtiSubmission = {
    submissionType: 'FPS',  // Full Payment Submission
    taxYear: workRecord.payroll?.taxYear,
    payrollId: workRecord.payroll?.id,
    contractorNI: contractor.niNumber,
    taxCode: contractor.taxCode,
    grossPay: workRecord.payroll?.grossPay,
    taxPaid: workRecord.payroll?.incomeTax,
    niPaid: workRecord.payroll?.employeeNI,
    submittedAt: new Date().toISOString(),
    reference: `RTI-${workRecordId.slice(0, 8).toUpperCase()}`
  }

  await prisma.$transaction(async (tx) => {
    await tx.workRecord.update({
      where: { id: workRecordId },
      data: { state: 'COMPLIANCE_SUBMITTED', version: { increment: 1 } }
    })

    await tx.auditLog.create({
      data: {
        actorId,
        eventType: 'COMPLIANCE_VALIDATED',
        workRecordId,
        beforeState: 'PAYROLL_COMPLETED',
        afterState: 'COMPLIANCE_SUBMITTED',
        metadata: { rtiSubmission }
      }
    })
  })

  return {
    passed: true,
    rtiSubmission,
    message: 'Compliance checks passed. RTI submitted to HMRC.'
  }
}

// marks work record as fully COMPLETED
export async function completeWorkRecord(workRecordId, actorId) {
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId }
  })

  if (!workRecord) throw new Error('Work record not found')
  if (workRecord.state !== 'COMPLIANCE_SUBMITTED') {
    throw new Error(`Cannot complete. Current state: ${workRecord.state}`)
  }

  await prisma.$transaction(async (tx) => {
    await tx.workRecord.update({
      where: { id: workRecordId },
      data: { state: 'COMPLETED', version: { increment: 1 } }
    })

    await tx.auditLog.create({
      data: {
        actorId,
        eventType: 'COMPLIANCE_VALIDATED',
        workRecordId,
        beforeState: 'COMPLIANCE_SUBMITTED',
        afterState: 'COMPLETED',
        metadata: { completedAt: new Date().toISOString() }
      }
    })
  })

  return { message: 'Work record completed. All obligations fulfilled.' }
}