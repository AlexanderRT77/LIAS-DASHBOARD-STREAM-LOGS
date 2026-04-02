import { useSupabaseData } from '../hooks/useSupabaseData'

const mockRecords = [
  { record_id: 'REC-2931', specialty: 'Cardiologia', model_name: 'Antigravity', confidence: 99.2, status: 'Concluído', diagnosed_at: '2024-04-02T10:15:00' },
  { record_id: 'REC-2930', specialty: 'Neurologia', model_name: 'Claude', confidence: 98.7, status: 'Concluído', diagnosed_at: '2024-04-02T09:42:00' },
  { record_id: 'REC-2929', specialty: 'Oncologia', model_name: 'Gemini', confidence: 96.4, status: 'Concluído', diagnosed_at: '2024-04-01T18:20:00' },
  { record_id: 'REC-2928', specialty: 'Radiologia', model_name: 'Perplexity', confidence: 99.8, status: 'Concluído', diagnosed_at: '2024-04-01T16:15:00' },
  { record_id: 'REC-2927', specialty: 'Dermatologia', model_name: 'DeepSeek', confidence: 94.1, status: 'Concluído', diagnosed_at: '2024-04-01T14:05:00' },
  { record_id: 'REC-2926', specialty: 'Pneumologia', model_name: 'Manus', confidence: 97.6, status: 'Concluído', diagnosed_at: '2024-04-01T11:30:00' },
  { record_id: 'REC-2925', specialty: 'Endocrinologia', model_name: 'Grok', confidence: 95.3, status: 'Concluído', diagnosed_at: '2024-03-31T22:10:00' },
  { record_id: 'REC-2924', specialty: 'Cardiologia', model_name: 'Chat Z.Ai', confidence: 98.9, status: 'Concluído', diagnosed_at: '2024-03-31T19:45:00' },
]

const modelBadgeColor = {
  'Antigravity': 'badge-primary',
  'Claude': 'badge-tertiary',
  'Gemini': 'badge-warning',
  'DeepSeek': 'badge-success',
  'Perplexity': 'badge-primary',
  'Manus': 'badge-tertiary',
  'Grok': 'badge-warning',
  'Chat Z.Ai': 'badge-success',
}

export default function BaseHistorica() {
  const { data: records, loading } = useSupabaseData('diagnostic_records', {
    mockData: mockRecords,
    orderBy: 'diagnosed_at',
    ascending: false,
    realtime: true,
  })

  const exportToCSV = () => {
    if (!records || records.length === 0) return
    const headers = ['Data', 'ID_Registro', 'Especialidade', 'Modelo', 'Confianca', 'Status']
    const csvRows = []
    csvRows.push(headers.join(','))

    records.forEach((r, i) => {
      const date = r.diagnosed_at ? new Date(r.diagnosed_at).toLocaleString('pt-BR') : ''
      const recordId = r.record_id || r.id || `REC-${String(i).padStart(4, '0')}`
      const row = [
        `"${date}"`,
        `"${recordId}"`,
        `"${r.specialty || ''}"`,
        `"${r.model_name || ''}"`,
        r.confidence || '',
        `"${r.status || ''}"`
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' }) // \ufeff added for excel utf-8
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `relatorio_clinico_${new Date().toISOString().substring(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Base Histórica</h2>
        <p className="page-description">
          Repositório consolidado de todos os registros de diagnóstico processados pela plataforma.
          {records !== mockRecords && (
            <span style={{ color: 'var(--success)', fontWeight: 600, marginLeft: 8 }}>● Sincronizado com Supabase</span>
          )}
        </p>
      </div>

      {/* KPI Summary */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total de Registros', value: records.length > 8 ? `${(records.length / 1000).toFixed(1)}k` : `${records.length}`, icon: 'database' },
          { label: 'Relatórios Gerados', value: '842k', icon: 'assignment' },
          { label: 'Auditorias Limpas', value: '100%', icon: 'verified_user' },
          { label: 'Tempo de Retenção', value: '10 Anos', icon: 'schedule' },
        ].map((kpi, i) => (
          <div key={i} className={`kpi-card animate-in animate-delay-${i + 1}`}>
            <span className="kpi-icon material-symbols-outlined">{kpi.icon}</span>
            <p className="kpi-label">{kpi.label}</p>
            <p className="kpi-value">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Records Table */}
      <div className="card animate-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
        <div className="section-header">
          <h3 className="title-lg">Registros de Diagnóstico</h3>
          <button className="btn btn-outline" onClick={exportToCSV} disabled={loading || records.length === 0}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
            Exportar Lote
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined spinning" style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--space-3)' }}>progress_activity</span>
            Carregando registros...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>ID Registro</th>
                <th>Especialidade</th>
                <th>Modelo Utilizado</th>
                <th>Confiança</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r.record_id || r.id || i}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
                    {r.diagnosed_at ? new Date(r.diagnosed_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{r.record_id || `REC-${String(i).padStart(4, '0')}`}</td>
                  <td>{r.specialty}</td>
                  <td><span className={`badge ${modelBadgeColor[r.model_name] || 'badge-primary'}`}>{r.model_name}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${r.confidence}%` }} />
                      </div>
                      <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8125rem' }}>
                        {r.confidence}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 'var(--space-2)', marginTop: 'var(--space-6)',
        }}>
          {[1, 2, 3, '...', 12].map((p, i) => (
            <button
              key={i}
              style={{
                width: 32, height: 32, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8125rem', fontWeight: 600,
                background: p === 1 ? 'var(--primary)' : 'transparent',
                color: p === 1 ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                cursor: typeof p === 'number' ? 'pointer' : 'default',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
