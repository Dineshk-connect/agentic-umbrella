import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import StateBadge from '../components/StateBadge'
import MetricCard from '../components/ui/MetricCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Timeline from '../components/ui/Timeline'
import api from '../lib/api'
import { generatePayslipPDF } from '../utils/generatePayslipPDF'

export default function ContractorDashboard() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ weekStarting: '', hoursWorked: '', notes: '' })
  const [downloadingId, setDownloadingId] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const { data: workRecords = [], isLoading } = useQuery({
    queryKey: ['workRecords'],
    queryFn: () => api.get('/timesheets').then(r => r.data)
  })

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', selectedRecord],
    queryFn: () => api.get(`/audit/work-record/${selectedRecord}`).then(r => r.data),
    enabled: !!selectedRecord
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

  const handleDownloadPayslip = async (workRecordId) => {
    setDownloadingId(workRecordId)
    try {
      const { data } = await api.get(`/payroll/${workRecordId}/payslip`)
      if (!data?.content) return toast.error('Payslip not available yet')
      generatePayslipPDF(data)
      toast.success('Payslip downloaded!')
    } catch {
      toast.error('Could not download payslip')
    } finally {
      setDownloadingId(null)
    }
  }

  const hasPayslip = (state) => ['PAYROLL_COMPLETED', 'COMPLIANCE_SUBMITTED', 'COMPLETED'].includes(state)

  const totalEarned = workRecords
    .filter(w => hasPayslip(w.state))
    .reduce((sum, w) => sum + Number(w.timesheets?.[0]?.totalAmount ?? 0), 0)

  const selected = workRecords.find(w => w.id === selectedRecord)

  return (
    <Layout
      title="Overview"
      actions={
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Submit timesheet'}
        </Button>
      }
    >
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <MetricCard label="Total submitted" value={workRecords.length} sub="All time" />
        <MetricCard
          label="Total gross earned"
          value={`£${totalEarned.toLocaleString()}`}
          sub="Payroll completed"
          subColor="#059669"
        />
        <MetricCard
          label="Completed"
          value={workRecords.filter(w => w.state === 'COMPLETED').length}
          sub="Full cycle done"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Submit form */}
          {showForm && (
            <Card title="New timesheet">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px' }}>Week starting</label>
                  <input
                    type="date"
                    value={form.weekStarting}
                    onChange={e => setForm(f => ({ ...f, weekStarting: e.target.value }))}
                    style={{
                      width: '100%', border: '0.5px solid #D1D5DB',
                      borderRadius: '7px', padding: '8px 10px',
                      fontSize: '13px', outline: 'none', color: '#111827'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px' }}>Hours worked</label>
                  <input
                    type="number"
                    min="1" max="80"
                    value={form.hoursWorked}
                    onChange={e => setForm(f => ({ ...f, hoursWorked: e.target.value }))}
                    style={{
                      width: '100%', border: '0.5px solid #D1D5DB',
                      borderRadius: '7px', padding: '8px 10px',
                      fontSize: '13px', outline: 'none', color: '#111827'
                    }}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px' }}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{
                    width: '100%', border: '0.5px solid #D1D5DB',
                    borderRadius: '7px', padding: '8px 10px',
                    fontSize: '13px', outline: 'none', resize: 'none',
                    fontFamily: 'inherit', color: '#111827'
                  }}
                  rows={2}
                  placeholder="Work description..."
                />
              </div>
              <Button
                onClick={() => submitMutation.mutate(form)}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit timesheet'}
              </Button>
            </Card>
          )}

          {/* Work records */}
          <Card title="My timesheets">
            {isLoading ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '24px 0' }}>Loading...</div>
            ) : workRecords.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '24px 0' }}>
                No timesheets yet. Submit your first one above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workRecords.map(record => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record.id === selectedRecord ? null : record.id)}
                    style={{
                      border: selectedRecord === record.id ? '0.5px solid #1A56DB' : '0.5px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      background: selectedRecord === record.id ? '#EFF6FF' : '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <StateBadge state={record.state} size="xs" />
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {new Date(record.createdAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        {record.timesheets?.[0] && (
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            Week of {new Date(record.timesheets[0].weekStarting).toLocaleDateString('en-GB')}
                            {' · '}
                            {Number(record.timesheets[0].hoursWorked)}h × £{Number(record.timesheets[0].hourlyRate)}/hr
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                            £{Number(record.timesheets?.[0]?.totalAmount ?? 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                            {record.id.slice(0, 8)}
                          </div>
                        </div>
                        {hasPayslip(record.state) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => { e.stopPropagation(); handleDownloadPayslip(record.id) }}
                            disabled={downloadingId === record.id}
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M8 2v8M4 7l4 4 4-4M2 13h12"/>
                            </svg>
                            {downloadingId === record.id ? 'Downloading...' : 'Payslip'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Timeline panel */}
        <div>
          <Card title="Work record timeline" style={{ position: 'sticky', top: '24px' }}>
            {!selectedRecord ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '12px', padding: '20px 0', lineHeight: 1.6 }}>
                Click any timesheet row to see its progress through the pipeline
              </div>
            ) : (
              <>
                <div style={{
                  background: '#F9FAFB',
                  border: '0.5px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>Current state</div>
                  <StateBadge state={selected?.state} />
                </div>
                <Timeline
                  currentState={selected?.state}
                  events={timelineData?.trail ?? []}
                />
              </>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  )
}