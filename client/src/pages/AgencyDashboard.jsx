import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import StateBadge from '../components/StateBadge'
import api from '../lib/api'

export default function AgencyDashboard() {
  const queryClient = useQueryClient()
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [payModal, setPayModal] = useState(null)
  const [payRef, setPayRef] = useState('')

  const { data: workRecords = [], isLoading } = useQuery({
    queryKey: ['workRecords'],
    queryFn: () => api.get('/timesheets').then(r => r.data)
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(r => r.data)
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/timesheets/${id}/approve`),
    onSuccess: () => {
      toast.success('Timesheet approved — invoice generated!')
      queryClient.invalidateQueries(['workRecords'])
      queryClient.invalidateQueries(['invoices'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/timesheets/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Timesheet rejected')
      queryClient.invalidateQueries(['workRecords'])
      setRejectModal(null)
      setRejectReason('')
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const approveInvoiceMutation = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/approve`),
    onSuccess: () => {
      toast.success('Invoice approved')
      queryClient.invalidateQueries(['invoices'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const payMutation = useMutation({
    mutationFn: ({ id, reference }) => api.post(`/invoices/${id}/pay`, {
      reference,
      fromAccount: 'GB29NWBK60161331926819'
    }),
    onSuccess: () => {
      toast.success('Payment initiated!')
      queryClient.invalidateQueries(['invoices'])
      setPayModal(null)
      setPayRef('')
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const webhookMutation = useMutation({
    mutationFn: ({ reference, amount }) =>
      api.post('/webhooks/payment', {
        reference,
        amount,
        fromAccount: 'GB29NWBK60161331926819'
      }),
    onSuccess: () => {
      toast.success('Bank payment confirmed! Payroll is now unlocked.')
      queryClient.invalidateQueries(['invoices'])
      queryClient.invalidateQueries(['workRecords'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Webhook failed')
  })

  const pendingTimesheets = workRecords.filter(w => w.state === 'WORK_SUBMITTED')
  const pendingInvoices = invoices.filter(i => ['INVOICE_GENERATED', 'INVOICE_APPROVED'].includes(i.state))

  return (
    <Layout title="Agency Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Approval', value: pendingTimesheets.length, color: 'text-yellow-600' },
          { label: 'Total Records', value: workRecords.length, color: 'text-blue-600' },
          { label: 'Pending Invoices', value: pendingInvoices.length, color: 'text-orange-600' },
          { label: 'Completed', value: workRecords.filter(w => w.state === 'COMPLETED').length, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending timesheets */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timesheets Awaiting Approval</h2>
        {pendingTimesheets.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            No timesheets pending approval
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTimesheets.map(record => (
              <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <StateBadge state={record.state} />
                      <span className="text-sm font-medium text-gray-900">
                        {record.contractor?.user?.name ?? 'Contractor'}
                      </span>
                    </div>
                    {record.timesheets?.[0] && (
                      <p className="text-sm text-gray-600">
                        {Number(record.timesheets[0].hoursWorked)}h ×
                        £{Number(record.timesheets[0].hourlyRate)} =
                        <span className="font-semibold"> £{Number(record.timesheets[0].totalAmount).toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(record.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal(record.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            No invoices yet
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </span>
                      <StateBadge state={invoice.state} />
                    </div>
                    <p className="text-sm text-gray-600">
                      Amount: <span className="font-semibold text-gray-900">
                        £{Number(invoice.amount).toFixed(2)}
                      </span>
                      <span className="ml-3 text-gray-400">
                        Due: {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {invoice.state === 'INVOICE_GENERATED' && (
                      <button
                        onClick={() => approveInvoiceMutation.mutate(invoice.id)}
                        disabled={approveInvoiceMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        Approve Invoice
                      </button>
                    )}
                    {invoice.state === 'INVOICE_APPROVED' && (
                      <button
                        onClick={() => setPayModal(invoice.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg transition"
                      >
                        Make Payment
                      </button>
                    )}
                    {invoice.state === 'PAYMENT_PENDING' && (
                      <button
                        onClick={() => webhookMutation.mutate({
                          reference: invoice.payments?.[0]?.reference,
                          amount: Number(invoice.amount)
                        })}
                        disabled={webhookMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        {webhookMutation.isPending ? 'Confirming...' : 'Confirm Bank Payment'}
                      </button>
                    )}
                    {invoice.state === 'PAYMENT_RECEIVED' && (
                      <span className="text-sm text-green-600 font-medium px-4 py-2">
                        ✓ Payment received
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Rejection reason</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={3}
              placeholder="Explain why this timesheet is being rejected..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectModal(null)}
                className="text-sm px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectModal, reason: rejectReason })}
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Initiate Payment</h3>
            <p className="text-sm text-gray-500 mb-3">
              Enter a unique payment reference for bank transfer tracking
            </p>
            <input
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              placeholder="e.g. PAY-REF-042"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPayModal(null)}
                className="text-sm px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => payMutation.mutate({ id: payModal, reference: payRef })}
                disabled={!payRef.trim() || payMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}