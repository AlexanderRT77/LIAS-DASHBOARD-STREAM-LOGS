import { useState, useEffect } from 'react'

const hardwareMetrics = [
  { label: 'GPU Cluster', detail: '48x NVIDIA H100', value: 78 },
  { label: 'API Bandwidth', detail: '42.8 GB/s', value: 64 },
  { label: 'Memory Pool', detail: '1.2 TB / 2 TB', value: 60 },
  { label: 'CPU Utilization', detail: '32 vCPU', value: 45 },
]

const initialInferences = [
  { id: 'INF-89421', model: 'GPT-4o', task: 'Triagem Cardiológica', latency: '210ms', status: 'Active', confidence: 97.2 },
  { id: 'INF-89420', model: 'Claude 3.5', task: 'Análise de Laudo', latency: '140ms', status: 'Complete', confidence: 98.8 },
  { id: 'INF-89419', model: 'Med-PaLM', task: 'Diagnóstico Diferencial', latency: '320ms', status: 'Active', confidence: 99.1 },
  { id: 'INF-89418', model: 'Llama 3', task: 'Extração de Entidades', latency: '45ms', status: 'Complete', confidence: 91.4 },
  { id: 'INF-89417', model: 'Gemini Pro', task: 'Imagem Radiológica', latency: '180ms', status: 'Active', confidence: 96.7 },
  { id: 'INF-89416', model: 'Mistral Med', task: 'Resumo Clínico', latency: '95ms', status: 'Complete', confidence: 93.2 },
]

export default function MetricasLive() {
  const [inferences, setInferences] = useState(initialInferences)
  const [hwMetrics, setHwMetrics] = useState(hardwareMetrics)

  useEffect(() => {
    const interval = setInterval(() => {
      setHwMetrics(prev => prev.map(m => ({
        ...m,
        value: Math.max(20, Math.min(95, m.value + (Math.random() - 0.5) * 6))
      })))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Métricas em Tempo Real</h2>
        <p className="page-description">
          Monitoramento ao vivo da infraestrutura de IA e fluxo de inferências clínicas.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--success)',
            animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block'
          }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 600 }}>SISTEMA ONLINE</span>
        </div>
      </div>

      {/* Hardware Monitors */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {hwMetrics.map((hw, i) => (
          <div key={i} className={`card animate-in animate-delay-${i + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span className="label-sm">{hw.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.125rem' }}>
                {Math.round(hw.value)}%
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-3)' }}>{hw.detail}</p>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{
                width: `${hw.value}%`,
                background: hw.value > 80 ? 'var(--error)' : hw.value > 60 ? 'var(--warning)' : 'linear-gradient(90deg, var(--primary-dim), var(--primary))',
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Live Inference Stream */}
      <div className="card animate-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Stream de Inferências</h3>
            <p className="section-subtitle">Fluxo de atividades em tempo real dos motores de IA</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Live</span>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Modelo</th>
              <th>Tarefa Clínica</th>
              <th>Latência</th>
              <th>Status</th>
              <th>Confiança</th>
            </tr>
          </thead>
          <tbody>
            {inferences.map(inf => (
              <tr key={inf.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem' }}>{inf.id}</td>
                <td><span className="badge badge-primary">{inf.model}</span></td>
                <td>{inf.task}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--on-surface-variant)' }}>{inf.latency}</td>
                <td>
                  <span className={`badge ${inf.status === 'Active' ? 'badge-success' : 'badge-tertiary'}`}>
                    {inf.status === 'Active' ? '● Active' : '✓ Complete'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: 60 }}>
                      <div className="progress-fill" style={{ width: `${inf.confidence}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{inf.confidence}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
