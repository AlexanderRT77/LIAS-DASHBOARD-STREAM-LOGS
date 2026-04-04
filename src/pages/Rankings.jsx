import { useSupabaseData } from '../hooks/useSupabaseData'
import { ModelLogo } from '../utils/modelLogos'

const mockRankingsData = [
  { rank: '01', model: 'Antigravity', accuracy: 98.4, latency: '2.0s', trend: '+0.3%' },
  { rank: '02', model: 'Claude', accuracy: 96.0, latency: '1.1s', trend: '+0.1%' },
  { rank: '03', model: 'Gemini', accuracy: 93.0, latency: '0.7s', trend: '+1.2%' },
]

const mockSpecialties = [
  {
    name: 'Cardiologia & Hemodinâmica',
    icon: 'cardiology',
    status: 'Líder',
    models: [
      { name: 'Antigravity', score: '98.5%' },
      { name: 'Claude', score: '95.2%' },
    ]
  },
  {
    name: 'Oncologia',
    icon: 'biotech',
    status: 'Estável',
    models: [
      { name: 'Gemini', score: '96.4%' },
      { name: 'DeepSeek', score: '92.1%' },
    ]
  },
  {
    name: 'Radiologia (Visão)',
    icon: 'visibility',
    status: '+12.8% ↑',
    models: [
      { name: 'Perplexity', score: '99.1%' },
    ]
  },
]

const mockMetricsGlobais = [
  { label: 'Taxa de Alucinação', value: '0.01%', source: 'Antigravity', desc: 'Mínimo histórico atingido' },
  { label: 'Citação Direta (PubMed)', value: '98%', source: 'Claude', desc: 'Melhor fidelidade bibliográfica' },
  { label: 'Eficiência Energética', value: 'A+', source: 'DeepSeek', desc: 'Inferência ultra-otimizada' },
  { label: 'Casos Resolvidos / Dia', value: '1.5M+', source: 'Global IA', desc: 'Processamento autônomo escalável' },
]

export default function Rankings() {
  // Buscar métricas em tempo real e fazer o fallback para os mocks
  const { data: perfMetrics } = useSupabaseData('performance_metrics', {
    mockData: [],
    realtime: true,
  })

  // Se houvesse data mapeada do Supabase, nós a integraríamos aqui.
  // Por enquanto, caso não haja métricas estruturadas, injetamos nossas variáveis dinâmicas de Fallback
  const rankingsData = perfMetrics.length > 5 ? perfMetrics.slice(0,3).map((m, i) => ({
    rank: `0${i+1}`, model: m.model_name || 'Desconhecido', accuracy: m.accuracy, latency: `${m.latency_ms/1000}s`, trend: '+0.1%'
  })) : mockRankingsData

  const specialties = mockSpecialties
  const metricsGlobais = mockMetricsGlobais

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
                      <ModelLogo name={r.model} size={22} />
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
                  <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ModelLogo name={m.name} size={16} />
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
