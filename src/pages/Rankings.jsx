const rankingsData = [
  { rank: '01', model: 'Med-PaLM 2.1', accuracy: 98.4, latency: '1.2s', trend: '+0.3%' },
  { rank: '02', model: 'GPT-4 Medical', accuracy: 96.8, latency: '2.4s', trend: '+0.1%' },
  { rank: '03', model: 'Claude Health v3', accuracy: 94.1, latency: '0.8s', trend: '+1.2%' },
]

const specialties = [
  {
    name: 'Cardiologia & Hemodinâmica',
    icon: 'cardiology',
    status: 'Líder',
    models: [
      { name: 'Med-PaLM 2.1', score: '95.8%' },
      { name: 'GPT-4o Health', score: '94.2%' },
    ]
  },
  {
    name: 'Oncologia',
    icon: 'biotech',
    status: 'Estável',
    models: [
      { name: 'IBM Watson Health', score: '92.4%' },
      { name: 'Llama 3 Med-Tuned', score: '90.1%' },
    ]
  },
  {
    name: 'Radiologia (Visão)',
    icon: 'visibility',
    status: '+12.8% ↑',
    models: [
      { name: 'Gemini 1.5 Pro Medical', score: '99.1%' },
    ]
  },
]

const metricsGlobais = [
  { label: 'Taxa de Alucinação', value: '0.02%', source: 'Med-PaLM', desc: 'Mínimo histórico atingido' },
  { label: 'Citação Direta (PubMed)', value: '94%', source: 'Claude 3', desc: 'Melhor fidelidade bibliográfica' },
  { label: 'Eficiência Energética', value: 'A+', source: 'Llama 3', desc: 'Inferência local otimizada' },
  { label: 'Casos Resolvidos / Dia', value: '1.2M+', source: 'Global IA', desc: 'Processamento escalável' },
]

export default function Rankings() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Performance Multimodal</h2>
        <p className="page-description">
          Ranking comparativo das principais arquiteturas de inteligência artificial aplicadas ao 
          diagnóstico clínico e análise de dados médicos de alta complexidade.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Main Rankings Table */}
        <div className="card animate-in animate-delay-1">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>cardiology</span>
            Cardiologia & Hemodinâmica
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Motor de IA</th>
                <th>Acurácia Diagnosticada</th>
                <th>Média de Resposta</th>
              </tr>
            </thead>
            <tbody>
              {rankingsData.map(r => (
                <tr key={r.rank}>
                  <td style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface-variant)' }}>{r.rank}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-dim)', fontSize: '1.25rem' }}>language</span>
                      <span style={{ fontWeight: 600 }}>{r.model}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="progress-bar" style={{ flex: 1, maxWidth: 160 }}>
                        <div className="progress-fill" style={{ width: `${r.accuracy}%` }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.accuracy}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--on-surface-variant)' }}>{r.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Specialty Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {specialties.map((spec, i) => (
            <div key={i} className={`card animate-in animate-delay-${i + 2}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{spec.icon}</span>
                  {spec.name}
                </h4>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{spec.status}</span>
              </div>
              {spec.models.map((m, j) => (
                <div key={j} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) 0',
                  borderBottom: j < spec.models.length - 1 ? '1px solid rgba(65,71,91,0.1)' : 'none',
                }}>
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>
                    {j + 1}. {m.name}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{m.score}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Global Metrics */}
      <div className="section-header">
        <div>
          <h3 className="section-title">Métricas Globais de Confiabilidade</h3>
          <p className="section-subtitle">Comparativo de alucinação e citação bibliográfica</p>
        </div>
        <button className="btn btn-outline">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>tune</span>
          Filtros Avançados
        </button>
      </div>
      <div className="kpi-grid">
        {metricsGlobais.map((m, i) => (
          <div key={i} className={`kpi-card animate-in animate-delay-${i + 1}`}>
            <p className="kpi-label">{m.label}</p>
            <p className="kpi-value">
              {m.value}
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)', marginLeft: '8px' }}>{m.source}</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
