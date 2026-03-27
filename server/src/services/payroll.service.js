import { prisma } from '../lib/prisma.js'
import { calculateGrossToNet } from './taxEngine.js'

export async function runPayroll(workRecordId, actorId) {
  // ── HARD GATE — most important check in the entire platform ──
  const workRecord = await prisma.workRecord.findUnique({
    where: { id: workRecordId },
    include: {
      contractor:{
        include: { user: true } 
      },
      timesheets: { where: { isActive: true } }
    }
  })

  if (!workRecord) throw new Error('Work record not found')

  // reject immediately if not PAYMENT_RECEIVED — no exceptions
  if (workRecord.state !== 'PAYMENT_RECEIVED') {
    await prisma.auditLog.create({
      data: {
        actorId,
        eventType: 'PAYROLL_TRIGGERED',
        workRecordId,
        beforeState: workRecord.state,
        afterState: workRecord.state,  // state does NOT change
        metadata: {
          rejected: true,
          reason: `Payroll rejected — state is ${workRecord.state}, requires PAYMENT_RECEIVED`
        }
      }
    })
    throw new Error(
      `Payroll cannot run. Current state: ${workRecord.state}. Required: PAYMENT_RECEIVED`
    )
  }

  const timesheet = workRecord.timesheets[0]
  if (!timesheet) throw new Error('No active timesheet found')

  const contractor = workRecord.contractor
  const taxCode = contractor.taxCode || '1257L'

  // run the gross-to-net calculation
  const calculation = calculateGrossToNet(
    timesheet.totalAmount,
    timesheet.hoursWorked,
    taxCode
  )

  // get pay period dates from timesheet
  const payPeriodStart = timesheet.weekStarting
  const payPeriodEnd = new Date(timesheet.weekStarting)
  payPeriodEnd.setDate(payPeriodEnd.getDate() + 6)

  const taxYear = getTaxYear()

  const result = await prisma.$transaction(async (tx) => {
    // move to PAYROLL_PROCESSING
    await tx.workRecord.update({
      where: { id: workRecordId },
      data: { state: 'PAYROLL_PROCESSING', version: { increment: 1 } }
    })

    // create payroll record with full breakdown
    const payroll = await tx.payroll.create({
      data: {
        workRecordId,
        contractorId: contractor.id,
        umbrellaId: workRecord.umbrellaId,
        grossPay:        calculation.grossPay,
        hourlyRate:      timesheet.hourlyRate,
        hoursWorked:     timesheet.hoursWorked,
        incomeTax:       calculation.incomeTax,
        employeeNI:      calculation.employeeNI,
        employerNI:      calculation.employerNI,
        umbrellaFee:     calculation.umbrellaFee,
        pensionEmployee: calculation.pensionEmployee,
        studentLoan:     calculation.studentLoan,
        netPay:          calculation.netPay,
        taxCode,
        taxYear,
        payPeriodStart,
        payPeriodEnd,
        state: 'PAYROLL_PROCESSING'
      }
    })

    await tx.auditLog.create({
      data: {
        actorId,
        eventType: 'PAYROLL_TRIGGERED',
        workRecordId,
        beforeState: 'PAYMENT_RECEIVED',
        afterState: 'PAYROLL_PROCESSING',
        metadata: { grossPay: calculation.grossPay, netPay: calculation.netPay }
      }
    })

    // generate payslip
    const payslip = await tx.payslip.create({
      data: {
        payrollId: payroll.id,
        contractorId: contractor.id,
        content: {
          contractor: {
            name: contractor.user.name,     // we'll fix this properly in a moment
            niNumber: contractor.niNumber,
            taxCode
          },
          period: {
            start: payPeriodStart,
            end: payPeriodEnd,
            taxYear
          },
          earnings: {
            grossPay:    calculation.grossPay,
            hoursWorked: Number(timesheet.hoursWorked),
            hourlyRate:  Number(timesheet.hourlyRate)
          },
          deductions: {
            incomeTax:       calculation.incomeTax,
            employeeNI:      calculation.employeeNI,
            pensionEmployee: calculation.pensionEmployee,
            studentLoan:     calculation.studentLoan,
            umbrellaFee:     calculation.umbrellaFee,
            total: round(
              calculation.incomeTax +
              calculation.employeeNI +
              calculation.pensionEmployee +
              calculation.studentLoan +
              calculation.umbrellaFee
            )
          },
          employerCosts: {
            employerNI: calculation.employerNI
          },
          netPay: calculation.netPay,
          breakdown: calculation.breakdown,
          generatedAt: new Date().toISOString()
        }
      }
    })

    // move to PAYROLL_COMPLETED
    await tx.payroll.update({
      where: { id: payroll.id },
      data: { state: 'PAYROLL_COMPLETED', paymentDate: new Date() }
    })

    await tx.workRecord.update({
      where: { id: workRecordId },
      data: { state: 'PAYROLL_COMPLETED', version: { increment: 1 } }
    })

    await tx.auditLog.create({
      data: {
        actorId,
        eventType: 'PAYROLL_COMPLETED',
        workRecordId,
        beforeState: 'PAYROLL_PROCESSING',
        afterState: 'PAYROLL_COMPLETED',
        metadata: { netPay: calculation.netPay, payslipId: payslip.id }
      }
    })

    return { payroll, payslip }
  })

  return result
}

function getTaxYear() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  // UK tax year starts April 6
  return month >= 4 ? `${year}/${year + 1}` : `${year - 1}/${year}`
}

function round(val) {
  return Math.round(val * 100) / 100
}