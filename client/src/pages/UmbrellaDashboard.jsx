import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import StateBadge from '../components/StateBadge'
import MetricCard from '../components/ui/MetricCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ActivityFeed from '../components/ui/ActivityFeed'
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

  const { data: auditData } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => api.get('/audit?limit=15').then(r => r.data)
  })

  const payrollMutation = useMutation({
    mutationFn: (id) => api.post(`/payroll/${id}/run`),
    onSuccess: () => {
      toast.success('Payroll completed! Net salary disbursed.')
      queryClient.invalidateQueries(['workRecords'])
      queryClient.invalidateQueries(['auditLogs'])
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Payroll failed')
  })

  const complianceMutation = useMutation({
    mutationFn: (id) => api.post(`/compliance/${id}/validate`),
    onSuccess: (data) => {
      if (data.data.passed) toast.success('RTI submitted to HMRC!')
      else toast.error('Compliance failed — check exceptions.')
      queryClient.invalidateQueries(['workRecords'])
      queryClient.invalidateQueries(['exceptions'])
      queryClient.invalidateQueries(['auditLogs'])
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
  const pipeline = workRecords.filter(w => !['PAYMENT_RECEIVED','PAYROLL_COMPLETED','COMPLIANCE_SUBMITTED','COMPLETED'].includes(w.state))
  const totalNetPaid = workRecords.filter(w => w.state === 'COMPLETED').length
  const logs = auditData?.logs ?? []

  const QueueCard = ({ title, records, buttonLabel, buttonVariant, onAction, isPending }) => (
    <Card title={title}>
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '16px 0' }}>
          None at this stage
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {records.map(record => (
            <div key={record.id} style={{
              border: '0.5px solid #E5E7EB', borderRadius: '8px',
              padding: '12px 14px', background: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <StateBadge state={record.state} size="xs" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                  {record.contractor?.user?.name ?? 'Contractor'}
                </div>
                {record.timesheets?.[0] && (
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                    Gross £{Number(record.timesheets[0].totalAmount).toFixed(2)}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant={buttonVariant}
                onClick={() => onAction(record.id)}
                disabled={isPending}
              >
                {buttonLabel}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  return (
    <Layout title="Overview">
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <MetricCard label="Ready for payroll" value={readyForPayroll.length} sub="Payment received" subColor="#059669" />
        <MetricCard label="Awaiting compliance" value={readyForCompliance.length} sub="Payroll done" />
        <MetricCard label="Open exceptions" value={openExceptions.length} sub="Needs resolution" subColor={openExceptions.length > 0 ? '#DC2626' : '#059669'} />
        <MetricCard label="Fully completed" value={totalNetPaid} sub="All obligations met" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <QueueCard
            title="Ready for payroll"
            records={readyForPayroll}
            buttonLabel="Run payroll"
            buttonVariant="purple"
            onAction={(id) => payrollMutation.mutate(id)}
            isPending={payrollMutation.isPending}
          />

          <QueueCard
            title="Awaiting HMRC submission"
            records={readyForCompliance}
            buttonLabel="Submit to HMRC"
            buttonVariant="teal"
            onAction={(id) => complianceMutation.mutate(id)}
            isPending={complianceMutation.isPending}
          />

          <QueueCard
            title="Ready to complete"
            records={readyToComplete}
            buttonLabel="Mark complete"
            buttonVariant="secondary"
            onAction={(id) => completeMutation.mutate(id)}
            isPending={completeMutation.isPending}
          />

          {/* Pipeline read-only */}
          {pipeline.length > 0 && (
            <Card title="Pipeline — awaiting agency action">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pipeline.map(record => (
                  <div key={record.id} style={{
                    border: '0.5px solid #E5E7EB', borderRadius: '8px',
                    padding: '12px 14px', background: '#FAFAFA',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                        {record.contractor?.user?.name ?? 'Contractor'}
                      </div>
                      {record.timesheets?.[0] && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                          £{Number(record.timesheets[0].totalAmount).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <StateBadge state={record.state} size="xs" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Open exceptions */}
          {openExceptions.length > 0 && (
            <Card title={`Open exceptions (${openExceptions.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {openExceptions.map(ex => (
                  <div key={ex.id} style={{
                    background: '#FEF2F2',
                    border: '0.5px solid #FECACA',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#991B1B', marginBottom: '4px' }}>
                      {ex.type.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#B91C1C' }}>{ex.description}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Activity feed */}
        <Card title="Activity feed">
          <ActivityFeed logs={logs} />
        </Card>
      </div>
    </Layout>
  )
}