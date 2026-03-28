import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import StateBadge from '../components/StateBadge'
import api from '../lib/api'

export default function ContractorDashboard() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ weekStarting: '', hoursWorked: '', notes: '' })

  const { data: workRecords = [], isLoading } = useQuery({
    queryKey: ['workRecords'],
    queryFn: () => api.get('/timesheets').then(r => r.data)
  })

  const submitMutation = useMutation({
    mutationFn: (data) => api.post('/timesheets', data),
    onSuccess: () => {
      toast.success('Timesheet submitted!')
      queryClient.invalidateQueries(['workRecords'])
      setShowForm(false)
      setForm({ weekStarting: '', hoursWorked: '', notes: '' })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to submit')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    submitMutation.mutate(form)
  }

  return (
    <Layout title="Contractor Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Submitted', value: workRecords.length, color: 'text-blue-600' },
          { label: 'Approved', value: workRecords.filter(w => ['WORK_APPROVED', 'INVOICE_GENERATED', 'PAYMENT_RECEIVED', 'PAYROLL_COMPLETED', 'COMPLETED'].includes(w.state)).length, color: 'text-green-600' },
          { label: 'Completed', value: workRecords.filter(w => w.state === 'COMPLETED').length, color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">My Timesheets</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {showForm ? 'Cancel' : '+ Submit Timesheet'}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
          <h3 className="font-medium text-gray-900">New Timesheet</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Week starting</label>
              <input
                type="date"
                value={form.weekStarting}
                onChange={e => setForm(f => ({ ...f, weekStarting: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hours worked</label>
              <input
                type="number"
                min="1"
                max="80"
                value={form.hoursWorked}
                onChange={e => setForm(f => ({ ...f, hoursWorked: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="Optional notes"
            />
          </div>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Timesheet'}
          </button>
        </form>
      )}

      {/* Work records list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : workRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No timesheets yet. Submit your first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {workRecords.map(record => (
            <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StateBadge state={record.state} />
                    <span className="text-xs text-gray-400">
                      {new Date(record.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  {record.timesheets?.[0] && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Week: {new Date(record.timesheets[0].weekStarting).toLocaleDateString('en-GB')}</p>
                      <p>Hours: {Number(record.timesheets[0].hoursWorked)}h
                        × £{Number(record.timesheets[0].hourlyRate)}/hr
                        = <span className="font-semibold text-gray-900">£{Number(record.timesheets[0].totalAmount).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-300 font-mono">{record.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}