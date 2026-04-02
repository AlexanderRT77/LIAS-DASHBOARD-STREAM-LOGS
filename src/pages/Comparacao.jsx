import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts'

const benchmarkData = [
  { name: 'GPT-4o', accuracy: 96.8, latency: 2.1 },
  { name: 'Claude 3.5', accuracy: 95.2, latency: 1.4 },
  { name: 'Med-PaLM 2', accuracy: 98.4, latency: 3.2 },
  { name: 'Llama 3', accuracy: 91.5, latency: 0.45 },
]

const latencyTimeline = [
  { time: '04:00', gpt4o: 220, claude: 150, llama3: 50 },
  { time: '08:00', gpt4o: 200, claude: 135, llama3: 42 },
  { time: '12:00', gpt4o: 240, claude: 160, llama3: 55 },
  { time: '16:00', gpt4o: 210, claude: 140, llama3: 48 },
  { time: '20:00', gpt4o: 195, claude: 130, llama3: 40 },
]

const comparisonTable = [
  { model: 'GPT-4o', reasoning: 96.8, extraction: 94.2, cost: '$15.00', compliance: '99.1%', status: 'Ativo' },
  { model: 'Claude 3.5', reasoning: 95.2, extraction: 96.8, cost: '$8.00', compliance: '99.6%', status: 'Ativo' },
  { model: 'Med-PaLM 2', reasoning: 98.4, extraction: 92.1, cost: '$12.00', compliance: '99.8%', status: 'Ativo' },
  { model: 'Llama 3', reasoning: 91.5, extraction: 89.4, cost: '$0.50', compliance: '97.2%', status: 'Ativo' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1c253e', border: '1px solid rgba(65,71,91,0.3)',
      borderRadius: '8px', padding: '8px 12px', fontSize: '0.8125rem',
    }}>
      <p style={{ color: '#dfe4fe', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Comparacao() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Comparação de IAs</h2>
        <p className="page-description">
          Análise comparativa detalhada entre os principais motores de IA em benchmarks clínicos.
        </p>
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="chart-container animate-in animate-delay-1">
          <div className="chart-header">
            <h3 className="chart-title">Acurácia vs Latência</h3>
            <p className="chart-subtitle">Benchmark comparativo por modelo</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={benchmarkData}>
              <CartesianGrid stroke="rgba(65,71,91,0.12)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#a5aac2' }} />
              <Bar dataKey="accuracy" name="Acurácia %" fill="url(#cyanGrad)" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="latency" name="Latência (s)" fill="#ac89ff" radius={[4, 4, 0, 0]} barSize={32} />
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#99f7ff" />
                  <stop offset="100%" stopColor="#00e2ee" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container animate-in animate-delay-2">
          <div className="chart-header">
            <h3 className="chart-title">Wavechart de Latência (24h)</h3>
            <p className="chart-subtitle">Variação de tempo de resposta ao longo do dia</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={latencyTimeline}>
              <CartesianGrid stroke="rgba(65,71,91,0.12)" />
              <XAxis dataKey="time" tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="gpt4o" name="GPT-4o" stroke="#99f7ff" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="claude" name="Claude 3.5" stroke="#ac89ff" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="llama3" name="Llama 3" stroke="#6f758b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {[
              { name: 'GPT-4o', detail: 'Estável (210ms)', color: '#99f7ff' },
              { name: 'Claude 3.5', detail: 'Alta Performance (140ms)', color: '#ac89ff' },
              { name: 'Llama 3', detail: 'Ultra-Fast (45ms)', color: '#6f758b' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{l.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: l.color, fontWeight: 500 }}>{l.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="card animate-in animate-delay-3" style={{ marginBottom: 'var(--space-6)', borderLeft: '3px solid var(--tertiary)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-lg)',
            background: 'rgba(172,137,255,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>bolt</span>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Análise de IA: Eficiência de Resposta
            </h4>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              O modelo <strong style={{ color: 'var(--primary)' }}>Claude 3.5 Sonnet</strong> apresenta o melhor equilíbrio entre 
              precisão diagnóstica e tempo de resposta para triagem emergencial, superando o GPT-4o em 25% 
              na velocidade de inferência sem perda significativa de acurácia.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card animate-in animate-delay-4">
        <h3 className="title-lg" style={{ marginBottom: 'var(--space-5)' }}>Métricas de Desempenho Detalhadas</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Modelo</th>
              <th>Raciocínio Clínico</th>
              <th>Extração de Dados</th>
              <th>Custo / 1M Tokens</th>
              <th>Conformidade</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {comparisonTable.map(r => (
              <tr key={r.model}>
                <td style={{ fontWeight: 600 }}>{r.model}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${r.reasoning}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem' }}>{r.reasoning}%</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${r.extraction}%`, background: 'var(--tertiary)' }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem' }}>{r.extraction}%</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace' }}>{r.cost}</td>
                <td style={{ color: 'var(--success)', fontWeight: 600 }}>{r.compliance}</td>
                <td><span className="badge badge-success">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
