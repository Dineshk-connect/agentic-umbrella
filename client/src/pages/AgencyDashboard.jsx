import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import StateBadge from '../components/StateBadge'
import MetricCard from '../components/ui/MetricCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Timeline from '../components/ui/Timeline'
import ActivityFeed from '../components/ui/ActivityFeed'
import api from '../lib/api'

export default function AgencyDashboard() {
  const queryClient = useQueryClient()
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [payModal, setPayModal] = useState(null)
  const [payRef, setPayRef] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const { data: workRecords = [] } = useQuery({
    queryKey: ['workRecords'],
    queryFn: () => api.get('/timesheets').then(r => r.data)
  })

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(r => r.data)
  })

  const { data: auditData } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => api.get('/audit?limit=10').then(r => r.data)
  })

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', selectedRecord],
    queryFn: () => api.get(`/audit/work-record/${selectedRecord}`).then(r => r.data),
    enabled: !!selectedRecord
  })

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`/timesheets/${id}/approve`),
    onSuccess: () => {
      toast.success('Timesheet approved — invoice generated!')
      queryClient.invalidateQueries(['workRecords'])
      queryClient.invalidateQueries(['invoices'])
      queryClient.invalidateQueries(['auditLogs'])
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
      queryClient.invalidateQueries(['auditLogs'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed')
  })

  const payMutation = useMutation({
    mutationFn: ({ id, reference }) => api.post(`/invoices/${id}/pay`, {
      reference, fromAccount: 'GB29NWBK60161331926819'
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
    mutationFn: ({ reference, amount }) => api.post('/webhooks/payment', {
      reference, amount, fromAccount: 'GB29NWBK60161331926819'
    }),
    onSuccess: () => {
      toast.success('Bank payment confirmed! Payroll is now unlocked.')
      queryClient.invalidateQueries(['invoices'])
      queryClient.invalidateQueries(['workRecords'])
      queryClient.invalidateQueries(['auditLogs'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Webhook failed')
  })

  const pendingTimesheets = workRecords.filter(w => w.state === 'WORK_SUBMITTED')
  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount), 0)
  const activeContractors = [...new Set(workRecords.map(w => w.contractorId))].length
  const completed = workRecords.filter(w => w.state === 'COMPLETED').length
  const logs = auditData?.logs ?? []

  return (
    <Layout
      title="Overview"
      pendingCount={pendingTimesheets.length}
      actions={<Button size="sm">+ New timesheet</Button>}
    >
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <MetricCard label="Pending approval" value={pendingTimesheets.length} sub="Timesheets awaiting review" />
        <MetricCard label="Total invoiced" value={`£${totalInvoiced.toLocaleString()}`} sub="This period" subColor="#059669" />
        <MetricCard label="Active contractors" value={activeContractors} sub="This period" />
        <MetricCard label="Completed" value={completed} sub="Full cycle done" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Pending timesheets */}
          <div id="timesheets" style={{ scrollMarginTop: '24px' }}>
            <Card title="Timesheets awaiting approval">
              {pendingTimesheets.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px 0' }}>
                  No timesheets pending
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pendingTimesheets.map(record => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record.id)}
                      style={{
                        border: selectedRecord === record.id ? '0.5px solid #1A56DB' : '0.5px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: selectedRecord === record.id ? '#EFF6FF' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', marginBottom: '3px' }}>
                            {record.contractor?.user?.name ?? 'Contractor'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            Week of {new Date(record.timesheets?.[0]?.weekStarting).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                            £{Number(record.timesheets?.[0]?.totalAmount ?? 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {Number(record.timesheets?.[0]?.hoursWorked)}h × £{Number(record.timesheets?.[0]?.hourlyRate)}/hr
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <StateBadge state={record.state} size="xs" />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={(e) => { e.stopPropagation(); approveMutation.mutate(record.id) }}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={(e) => { e.stopPropagation(); setRejectModal(record.id) }}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Invoices */}
          <div id="invoices" style={{ scrollMarginTop: '24px' }}>
            <Card title="Invoices">
              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px 0' }}>
                  No invoices yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {invoices.map(invoice => (
                    <div key={invoice.id} style={{
                      border: '0.5px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      background: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', fontFamily: 'monospace' }}>
                              {invoice.invoiceNumber}
                            </span>
                            <StateBadge state={invoice.state} size="xs" />
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            £{Number(invoice.amount).toFixed(2)} · Due {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {invoice.state === 'INVOICE_GENERATED' && (
                            <Button size="sm" onClick={() => approveInvoiceMutation.mutate(invoice.id)}>
                              Approve
                            </Button>
                          )}
                          {invoice.state === 'INVOICE_APPROVED' && (
                            <Button size="sm" variant="secondary" onClick={() => setPayModal(invoice.id)}>
                              Make payment
                            </Button>
                          )}
                          {invoice.state === 'PAYMENT_PENDING' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => webhookMutation.mutate({
                                reference: invoice.payments?.[0]?.reference,
                                amount: Number(invoice.amount)
                              })}
                              disabled={webhookMutation.isPending}
                            >
                              Confirm bank payment
                            </Button>
                          )}
                          {invoice.state === 'PAYMENT_RECEIVED' && (
                            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>✓ Paid</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Timeline */}
          <Card title={selectedRecord ? 'Work record timeline' : 'Timeline'}>
            {!selectedRecord ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', padding: '16px 0' }}>
                Click a timesheet to see its timeline
              </div>
            ) : (
              <Timeline
                currentState={workRecords.find(w => w.id === selectedRecord)?.state}
                events={timelineData?.trail ?? []}
              />
            )}
          </Card>

          {/* Activity feed */}
          <div id="payments" style={{ scrollMarginTop: '24px' }}>
            <Card title="Activity feed">
              <ActivityFeed logs={logs} />
            </Card>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '6px' }}>Reject timesheet</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>Provide a reason — this will be sent to the contractor and stored permanently.</div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{
                width: '100%', border: '0.5px solid #D1D5DB',
                borderRadius: '8px', padding: '10px 12px',
                fontSize: '13px', resize: 'none',
                outline: 'none', marginBottom: '16px',
                fontFamily: 'inherit', color: '#111827'
              }}
              rows={3}
              placeholder="e.g. Hours exceed agreed weekly limit. Please resubmit with correct hours."
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button
                variant="danger"
                style={{ background: '#DC2626', color: '#fff', border: 'none' }}
                onClick={() => rejectMutation.mutate({ id: rejectModal, reason: rejectReason })}
                disabled={!rejectReason.trim()}
              >
                Confirm rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#111827', marginBottom: '6px' }}>Initiate payment</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>Enter a unique bank transfer reference for reconciliation.</div>
            <input
              value={payRef}
              onChange={e => setPayRef(e.target.value)}
              style={{
                width: '100%', border: '0.5px solid #D1D5DB',
                borderRadius: '8px', padding: '10px 12px',
                fontSize: '13px', outline: 'none',
                marginBottom: '16px', fontFamily: 'monospace', color: '#111827'
              }}
              placeholder="e.g. PAY-REF-042"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button
                onClick={() => payMutation.mutate({ id: payModal, reference: payRef })}
                disabled={!payRef.trim() || payMutation.isPending}
              >
                {payMutation.isPending ? 'Processing...' : 'Confirm payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}