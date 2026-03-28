import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import StateBadge from '../components/StateBadge'
import api from '../lib/api'

export default function UmbrellaDashboard() {
  const queryClient = useQueryClient()

  const { data: workRecords = [] } = useQuery({
    queryKey: ['workRecords'],
    queryFn: () => api.get('/timesheets').then(r => r.data)
  })

  const { data: exceptions = [] } = useQuery({
    queryKey: ['exceptions'],
    queryFn: () => api.get('/exceptions').then(r => r.data)
  })

  const payrollMutation = useMutation({
    mutationFn: (id) => api.post(`/payroll/${id}/run`),
    onSuccess: () => {
      toast.success('Payroll completed! Net salary disbursed.')
      queryClient.invalidateQueries(['workRecords'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Payroll failed')
  })

  const complianceMutation = useMutation({
    mutationFn: (id) => api.post(`/compliance/${id}/validate`),
    onSuccess: (data) => {
      if (data.data.passed) toast.success('Compliance passed! RTI submitted.')
      else toast.error('Compliance failed. Check exceptions.')
      queryClient.invalidateQueries(['workRecords'])
      queryClient.invalidateQueries(['exceptions'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const completeMutation = useMutation({
    mutationFn: (id) => api.post(`/compliance/${id}/complete`),
    onSuccess: () => {
      toast.success('Work record completed!')
      queryClient.invalidateQueries(['workRecords'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const readyForPayroll = workRecords.filter(w => w.state === 'PAYMENT_RECEIVED')
  const readyForCompliance = workRecords.filter(w => w.state === 'PAYROLL_COMPLETED')
  const readyToComplete = workRecords.filter(w => w.state === 'COMPLIANCE_SUBMITTED')
  const openExceptions = exceptions.filter(e => e.status === 'OPEN')

  // read-only pipeline view — all records grouped by state
  const pipeline = workRecords.filter(w =>
    !['PAYMENT_RECEIVED', 'PAYROLL_COMPLETED', 'COMPLIANCE_SUBMITTED', 'COMPLETED'].includes(w.state)
  )

  return (
    <Layout title="Umbrella Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ready for Payroll', value: readyForPayroll.length, color: 'text-green-600' },
          { label: 'Awaiting Compliance', value: readyForCompliance.length, color: 'text-purple-600' },
          { label: 'Open Exceptions', value: openExceptions.length, color: 'text-red-600' },
          { label: 'Completed', value: workRecords.filter(w => w.state === 'COMPLETED').length, color: 'text-gray-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline — read only, no action buttons */}
      {pipeline.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline — In Progress</h2>
          <div className="space-y-3">
            {pipeline.map(record => (
              <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <StateBadge state={record.state} />
                      <span className="text-sm font-medium text-gray-700">
                        {record.contractor?.user?.name ?? 'Contractor'}
                      </span>
                    </div>
                    {record.timesheets?.[0] && (
                      <p className="text-sm text-gray-500">
                        {Number(record.timesheets[0].hoursWorked)}h ×
                        £{Number(record.timesheets[0].hourlyRate)} =
                        £{Number(record.timesheets[0].totalAmount).toFixed(2)}
                      </p>
                    )}
                  </div>
                  {/* No action buttons — umbrella cannot approve timesheets */}
                  <span className="text-xs text-gray-400">Awaiting agency action</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready for payroll — umbrella action */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready for Payroll</h2>
        {readyForPayroll.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            No work records awaiting payroll
          </div>
        ) : (
          <div className="space-y-3">
            {readyForPayroll.map(record => (
              <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <StateBadge state={record.state} />
                      <span className="text-sm font-medium text-gray-900">
                        {record.contractor?.user?.name ?? 'Contractor'}
                      </span>
                    </div>
                    {record.timesheets?.[0] && (
                      <p className="text-sm text-gray-600">
                        Gross: <span className="font-semibold">
                          £{Number(record.timesheets[0].totalAmount).toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => payrollMutation.mutate(record.id)}
                    disabled={payrollMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    Run Payroll
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ready for compliance */}
      {readyForCompliance.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Awaiting Compliance Filing</h2>
          <div className="space-y-3">
            {readyForCompliance.map(record => (
              <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <StateBadge state={record.state} />
                    <span className="text-sm text-gray-600">
                      {record.contractor?.user?.name ?? record.id.slice(0, 8)}
                    </span>
                  </div>
                  <button
                    onClick={() => complianceMutation.mutate(record.id)}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Submit to HMRC
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready to complete */}
      {readyToComplete.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready to Complete</h2>
          <div className="space-y-3">
            {readyToComplete.map(record => (
              <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <StateBadge state={record.state} />
                    <span className="text-sm text-gray-600">
                      {record.contractor?.user?.name ?? record.id.slice(0, 8)}
                    </span>
                  </div>
                  <button
                    onClick={() => completeMutation.mutate(record.id)}
                    className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open exceptions */}
      {openExceptions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Open Exceptions
            <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {openExceptions.length}
            </span>
          </h2>
          <div className="space-y-3">
            {openExceptions.map(ex => (
              <div key={ex.id} className="bg-red-50 rounded-xl p-5 border border-red-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-red-800">
                      {ex.type.replace(/_/g, ' ')}
                    </span>
                    <p className="text-sm text-red-600 mt-1">{ex.description}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {ex.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}