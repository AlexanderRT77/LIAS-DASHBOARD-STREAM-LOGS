import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useSupabaseData } from '../hooks/useSupabaseData'

const mockAccuracyData = [
  { name: 'Gemini', value: 93.0 },
  { name: 'Claude', value: 95.0 },
  { name: 'DeepSeek', value: 88.0 },
  { name: 'Grok', value: 85.0 },
  { name: 'Perplexity', value: 88.0 },
  { name: 'Manus', value: 85.0 },
  { name: 'Antigravity', value: 97.0 },
  { name: 'Chat Z.Ai', value: 78.0 },
]

const mockScatterData = [
  { latency: 0.7, cost: 0.00125, name: 'Gemini' },
  { latency: 1.1, cost: 0.003, name: 'Claude' },
  { latency: 1.8, cost: 0.00014, name: 'DeepSeek' },
  { latency: 0.6, cost: 0.0015, name: 'Grok' },
  { latency: 3.5, cost: 0.002, name: 'Perplexity' },
  { latency: 4.5, cost: 0.005, name: 'Manus' },
  { latency: 2.0, cost: 0.00001, name: 'Antigravity' },
  { latency: 0.4, cost: 0.0005, name: 'Chat Z.Ai' },
]

const mockInsightsData = [
  { id: 'INS-4821', specialty: 'Cardiologia', model_name: 'Antigravity', status: 'Concluído', confidence: 99.2, diagnosed_at: '2024-04-02' },
  { id: 'INS-4820', specialty: 'Neurologia', model_name: 'Claude', status: 'Em análise', confidence: 97.8, diagnosed_at: '2024-04-02' },
  { id: 'INS-4819', specialty: 'Oncologia', model_name: 'Gemini', status: 'Concluído', confidence: 98.1, diagnosed_at: '2024-04-01' },
  { id: 'INS-4818', specialty: 'Radiologia', model_name: 'Perplexity', status: 'Concluído', confidence: 96.4, diagnosed_at: '2024-04-01' },
  { id: 'INS-4817', specialty: 'Dermatologia', model_name: 'DeepSeek', status: 'Pendente', confidence: 94.3, diagnosed_at: '2024-04-01' },
]

const mockKpis = [
  { metric_name: 'total_inferences', metric_value: '1.28M', change_value: '+12%', change_positive: true },
  { metric_name: 'global_accuracy', metric_value: '94.2%', change_value: '+0.5%', change_positive: true },
  { metric_name: 'total_cost', metric_value: '$14.2k', change_value: '-8%', change_positive: false },
  { metric_name: 'avg_latency', metric_value: '184ms', change_value: '-14ms', change_positive: false },
]

const kpiLabels = {
  total_inferences: { label: 'Total de Inferências', icon: 'analytics' },
  global_accuracy: { label: 'Acurácia Global', icon: 'verified' },
  total_cost: { label: 'Custo Total (USD)', icon: 'attach_money' },
  avg_latency: { label: 'Latência Média', icon: 'speed' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1c253e',
      border: '1px solid rgba(65,71,91,0.3)',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '0.8125rem',
    }}>
      <p style={{ color: '#dfe4fe', fontWeight: 600 }}>{payload[0].payload.name || payload[0].name}</p>
      <p style={{ color: '#99f7ff' }}>{payload[0].value}{typeof payload[0].value === 'number' && payload[0].value < 1 ? '¢' : '%'}</p>
    </div>
  )
}

export default function Dashboard() {
  // Buscar KPIs do Supabase (com fallback mock e realtime)
  const { data: kpis } = useSupabaseData('global_kpis', {
    mockData: mockKpis,
    orderBy: 'metric_name',
    ascending: true,
    realtime: true,
  })

  // Buscar todos os diagnósticos (ordenados pelo mais recente) para Tabela e Gráfico de Rosca
  const { data: allDiagnostics } = useSupabaseData('diagnostic_records', {
    mockData: mockInsightsData,
    orderBy: 'diagnosed_at',
    ascending: false,
    realtime: true,
  })

  // Para a tabela, usamos apenas os últimos 5
  const recentDiagnostics = allDiagnostics.slice(0, 5)
  // Buscar métricas de performance para os gráficos
  const { data: perfMetrics } = useSupabaseData('performance_metrics', {
    mockData: [],
    orderBy: 'measured_at',
    ascending: false,
    realtime: true,
  })

  // Transformar dados do Supabase para gráficos ou usar mock
  const accuracyData = perfMetrics.length > 0
    ? perfMetrics.reduce((acc, m) => {
        const existing = acc.find(a => a.name === m.model_name)
        if (existing) {
          existing.value = Math.max(existing.value, m.accuracy)
        } else {
          acc.push({ name: m.model_name || 'Unknown', value: m.accuracy })
        }
        return acc
      }, [])
    : mockAccuracyData

  const scatterData = perfMetrics.length > 0
    ? perfMetrics
        .filter(m => m.latency_ms && m.cost_per_1m_tokens)
        .map(m => ({
          name: m.model_name || 'Unknown',
          latency: m.latency_ms,
          cost: m.cost_per_1m_tokens,
        }))
    : mockScatterData

  // Cálculo matemático do Gráfico de Rosca (Proporção por Status/Heurística)
  const statusGrouping = allDiagnostics.length > 0 ? allDiagnostics : mockInsightsData
  const pieDataMap = statusGrouping.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})
  const pieData = Object.keys(pieDataMap).map(key => ({ name: key, value: pieDataMap[key] }))
  const pieColors = ['#99f7ff', '#ac89ff', '#ff716c', '#6f758b', '#ffa057', '#00ffb2', '#ff00cc', '#f0f0f0']

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard Global</h2>
        <p className="page-description">
          Monitoramento em tempo real do ecossistema de inteligência artificial aplicada à saúde. 
          Dados consolidados de 8 modelos líderes.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button className="btn btn-outline">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>calendar_today</span>
            Últimas 24h
          </button>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>sync</span>
            Atualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => {
          const meta = kpiLabels[kpi.metric_name] || { label: kpi.metric_name, icon: 'info' }
          return (
            <div key={kpi.metric_name || i} className={`kpi-card animate-in animate-delay-${i + 1}`}>
              <span className="kpi-icon material-symbols-outlined">{meta.icon}</span>
              <p className="kpi-label">{meta.label}</p>
              <p className="kpi-value">
                {kpi.metric_value}
                <span className={`kpi-change ${kpi.change_positive ? 'positive' : 'negative'}`}>
                  {kpi.change_value}
                </span>
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container animate-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="chart-header">
            <h3 className="chart-title">Acurácia Atual por Modelo</h3>
            <p className="chart-subtitle">Benchmark comparativo entre os modelos ativos</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={accuracyData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[80, 100]} tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={18} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00e2ee" />
                  <stop offset="100%" stopColor="#99f7ff" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container animate-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <div className="chart-header">
            <h3 className="chart-title">Eficiência Operacional</h3>
            <p className="chart-subtitle">Dispersão: Latência (ms) x Custo (¢)</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ left: 10 }}>
              <CartesianGrid stroke="rgba(65,71,91,0.15)" />
              <XAxis type="number" dataKey="latency" name="Latência" tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} />
              <YAxis type="number" dataKey="cost" name="Custo" tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData} fill="#ac89ff" fillOpacity={0.85} strokeWidth={0} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid" style={{ marginTop: 'var(--space-6)' }}>
        <div className="chart-container animate-in" style={{ animationDelay: '0.45s', opacity: 0 }}>
          <div className="chart-header">
            <h3 className="chart-title">Status dos Diagnósticos</h3>
            <p className="chart-subtitle">Análise heurística da resolução clínica do modelo</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div style={{ background: '#1c253e', border: '1px solid rgba(65,71,91,0.3)', borderRadius: '8px', padding: '8px 12px' }}>
                      <p style={{ color: '#dfe4fe', fontWeight: 600, fontSize: '0.8125rem' }}>{payload[0].name}</p>
                      <p style={{ color: payload[0].payload.fill, fontWeight: 700, fontSize: '1rem' }}>{payload[0].value}</p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Diagnostics Table */}
      <div className="card animate-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Relatório de Insights Recentes</h3>
            <p className="section-subtitle">Últimas inferências processadas pelo ecossistema</p>
          </div>
          <button className="btn btn-outline">Ver Todos</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Especialidade</th>
              <th>Modelo</th>
              <th>Status</th>
              <th>Confiança</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {recentDiagnostics.map((row, i) => (
              <tr key={row.record_id || row.id || i}>
                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.record_id || row.id}</td>
                <td>{row.specialty}</td>
                <td><span className="badge badge-primary">{row.model_name}</span></td>
                <td>
                  <span className={`badge ${
                    row.status === 'Concluído' ? 'badge-success' :
                    row.status === 'Em análise' ? 'badge-warning' : 'badge-tertiary'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${row.confidence}%` }} />
                    </div>
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.8125rem' }}>
                      {row.confidence}%
                    </span>
                  </div>
                </td>
                <td style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>
                  {row.diagnosed_at ? new Date(row.diagnosed_at).toLocaleDateString('pt-BR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
