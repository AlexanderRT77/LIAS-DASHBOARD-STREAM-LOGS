import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts'
import { useArtificialAnalysis } from '../hooks/useArtificialAnalysis'
import '../styles/dashboard.css'

// ── Cores por modelo (consistente com o projeto inteiro) ──
const MODEL_COLORS = {
  Antigravity: '#ff00ff',
  Claude:      '#ac89ff',
  Gemini:      '#00e2ee',
  DeepSeek:    '#ff716c',
  Perplexity:  '#4ade80',
  Grok:        '#ff8c00',
  Manus:       '#8b8b8b',
  'Chat Z.Ai': '#f0f0f0',
}

const MODEL_ORDER = ['Antigravity', 'Claude', 'Gemini', 'DeepSeek', 'Perplexity', 'Grok', 'Manus', 'Chat Z.Ai']

// ── Eixos do Radar (benchmarks científicos) ──
const RADAR_AXES = [
  { key: 'gpqa', label: 'GPQA', fullName: 'GPQA Diamond — Questões de pós-graduação em física, biologia e química' },
  { key: 'hle', label: 'HLE', fullName: "Humanity's Last Exam — Perguntas extremamente difíceis criadas por especialistas" },
  { key: 'scicode', label: 'SciCode', fullName: 'SciCode — Resolução de problemas de código científico' },
  { key: 'ifbench', label: 'IFBench', fullName: 'IFBench — Seguimento de instruções complexas' },
  { key: 'lcr', label: 'LCR', fullName: 'AA-LCR — Raciocínio em cadeia longa' },
  { key: 'tau2', label: 'τ²-Bench', fullName: 'τ²-Bench Telecom — Resolução de problemas do mundo real' },
]

// ── Colunas do Heatmap ──
const HEATMAP_COLS = [
  { key: 'artificial_analysis_intelligence_index', label: 'Índice IA', scale: 1 },
  { key: 'artificial_analysis_coding_index', label: 'Coding', scale: 1 },
  { key: 'gpqa', label: 'GPQA', scale: 100 },
  { key: 'hle', label: 'HLE', scale: 100 },
  { key: 'scicode', label: 'SciCode', scale: 100 },
  { key: 'ifbench', label: 'IFBench', scale: 100 },
  { key: 'lcr', label: 'LCR', scale: 100 },
  { key: 'tau2', label: 'τ²-Bench', scale: 100 },
]

// ── Custom Tooltip ──
function ChartTooltip({ active, payload, labelKey }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'rgba(28, 37, 62, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 226, 238, 0.2)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '0.8125rem',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: MODEL_COLORS[d.name] || '#99f7ff', fontWeight: 700, marginBottom: 4 }}>
        {d.name || d[labelKey] || payload[0].name}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#dfe4fe', fontSize: '0.75rem' }}>
          {p.dataKey}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Heatmap Color ──
function heatColor(value, maxVal) {
  if (value == null) return 'rgba(65,71,91,0.15)'
  const ratio = Math.min(value / (maxVal || 1), 1)
  if (ratio < 0.33) return `rgba(255, 113, 108, ${0.15 + ratio * 0.6})`
  if (ratio < 0.66) return `rgba(251, 191, 36, ${0.15 + ratio * 0.4})`
  return `rgba(0, 226, 238, ${0.15 + ratio * 0.55})`
}

export default function Dashboard() {
  const { data: models, loading, error, lastUpdated } = useArtificialAnalysis()

  // ── KPI Computations ──
  const kpis = useMemo(() => {
    if (!models || models.length === 0) return null
    const apiModels = models.filter(m => m._source === 'api')
    const allModels = models

    const avgIntelligence = allModels.reduce((s, m) => s + (m.evaluations?.artificial_analysis_intelligence_index || 0), 0) / allModels.length
    const avgSpeed = allModels.reduce((s, m) => s + (m.median_output_tokens_per_second || 0), 0) / allModels.length
    const avgCost = allModels.reduce((s, m) => s + (m.pricing?.price_1m_blended_3_to_1 || 0), 0) / allModels.length
    const avgLatency = allModels.reduce((s, m) => s + (m.median_time_to_first_token_seconds || 0), 0) / allModels.length

    const topModel = [...allModels].sort(
      (a, b) => (b.evaluations?.artificial_analysis_intelligence_index || 0) - (a.evaluations?.artificial_analysis_intelligence_index || 0)
    )[0]

    return {
      intelligence: { value: avgIntelligence.toFixed(1), topModel: topModel?.name },
      speed: { value: avgSpeed.toFixed(0) },
      cost: { value: `$${avgCost.toFixed(2)}` },
      latency: { value: `${avgLatency.toFixed(1)}s` },
      apiCount: apiModels.length,
      totalCount: allModels.length,
    }
  }, [models])

  // ── Bar Chart: Intelligence Index ──
  const barData = useMemo(() => {
    if (!models) return []
    return [...models]
      .sort((a, b) => (a.evaluations?.artificial_analysis_intelligence_index || 0) - (b.evaluations?.artificial_analysis_intelligence_index || 0))
      .map(m => ({
        name: m.name,
        value: m.evaluations?.artificial_analysis_intelligence_index || 0,
        fill: MODEL_COLORS[m.name] || '#6f758b',
      }))
  }, [models])

  // ── Scatter: Speed vs Cost ──
  const scatterData = useMemo(() => {
    if (!models) return []
    return models.map(m => ({
      name: m.name,
      speed: m.median_output_tokens_per_second || 0,
      cost: m.pricing?.price_1m_blended_3_to_1 || 0,
      fill: MODEL_COLORS[m.name] || '#6f758b',
    }))
  }, [models])

  // ── Radar: Multi-benchmark ──
  const radarData = useMemo(() => {
    if (!models) return []
    return RADAR_AXES.map(axis => {
      const row = { axis: axis.label }
      for (const m of models) {
        const rawVal = m.evaluations?.[axis.key]
        row[m.name] = rawVal != null ? +(rawVal * 100).toFixed(1) : 0
      }
      return row
    })
  }, [models])

  // ── Pie: Cost Distribution ──
  const pieData = useMemo(() => {
    if (!models) return []
    return models
      .filter(m => (m.pricing?.price_1m_blended_3_to_1 || 0) > 0)
      .map(m => ({
        name: m.name,
        value: m.pricing.price_1m_blended_3_to_1,
      }))
  }, [models])

  // ── Heatmap: max values per column ──
  const heatmapMaxes = useMemo(() => {
    if (!models) return {}
    const maxes = {}
    HEATMAP_COLS.forEach(col => {
      let max = 0
      models.forEach(m => {
        const v = (m.evaluations?.[col.key] || 0) * col.scale
        if (v > max) max = v
      })
      maxes[col.key] = max
    })
    return maxes
  }, [models])

  // ── Loading State ──
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Dashboard Global</h2>
          <p className="page-description">Carregando dados da Artificial Analysis...</p>
        </div>
        <div className="dash-kpi-grid">
          {[1,2,3,4].map(i => <div key={i} className="dash-skeleton dash-skeleton-kpi" />)}
        </div>
        <div className="dash-charts-2col">
          {[1,2].map(i => <div key={i} className="dash-skeleton dash-skeleton-chart" />)}
        </div>
      </div>
    )
  }

  const gridCols = HEATMAP_COLS.length + 1

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <h2 className="page-title">Dashboard Global</h2>
        <p className="page-description">
          Análise comparativa em tempo real de 8 modelos de IA com dados independentes.
          Benchmarks, performance de API e precificação via Artificial Analysis.
        </p>
      </div>

      {/* ── Source Banner ── */}
      <div className="aa-source-banner animate-in">
        <span>
          <span className="aa-live-dot" />
          Dados de <a href="https://artificialanalysis.ai" target="_blank" rel="noopener noreferrer">Artificial Analysis</a>
          {' '}— {kpis?.apiCount || 0} modelos via API + {(kpis?.totalCount || 0) - (kpis?.apiCount || 0)} mock
          {error && <span style={{ color: 'var(--warning)', marginLeft: 8 }}>⚠ Fallback ativo</span>}
        </span>
        <span className="aa-last-update">
          {lastUpdated ? `Atualizado: ${lastUpdated.toLocaleTimeString('pt-BR')}` : ''}
        </span>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi animate-in animate-delay-1">
          <span className="dash-kpi-icon material-symbols-outlined">psychology</span>
          <p className="dash-kpi-label">Índice de Inteligência Médio</p>
          <p className="dash-kpi-value">{kpis?.intelligence.value || '—'}</p>
          <p className="dash-kpi-sub">Top: {kpis?.intelligence.topModel || '—'}</p>
        </div>
        <div className="dash-kpi animate-in animate-delay-2">
          <span className="dash-kpi-icon material-symbols-outlined">speed</span>
          <p className="dash-kpi-label">Velocidade Média</p>
          <p className="dash-kpi-value">{kpis?.speed.value || '—'} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>tok/s</span></p>
          <p className="dash-kpi-sub">Tokens por segundo (output)</p>
        </div>
        <div className="dash-kpi animate-in animate-delay-3">
          <span className="dash-kpi-icon material-symbols-outlined">paid</span>
          <p className="dash-kpi-label">Custo Médio (1M tokens)</p>
          <p className="dash-kpi-value">{kpis?.cost.value || '—'}</p>
          <p className="dash-kpi-sub">Blend 3:1 (input:output)</p>
        </div>
        <div className="dash-kpi animate-in animate-delay-4">
          <span className="dash-kpi-icon material-symbols-outlined">timer</span>
          <p className="dash-kpi-label">Latência Média (TTFT)</p>
          <p className="dash-kpi-value">{kpis?.latency.value || '—'}</p>
          <p className="dash-kpi-sub">Time to First Token</p>
        </div>
      </div>

      {/* ── Row 1: Bar + Scatter ── */}
      <div className="dash-charts-2col">
        {/* Intelligence Index Bar */}
        <div className="dash-chart-card animate-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">
              <span className="material-symbols-outlined">leaderboard</span>
              Índice de Inteligência (AA v4.0)
            </h3>
            <p className="dash-chart-desc">
              Combina 10 avaliações independentes: GDPval-AA, τ²-Bench, Terminal-Bench Hard, SciCode,
              AA-LCR, AA-Omniscience, IFBench, HLE, GPQA Diamond e CritPt.
              Quanto maior, melhor.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Speed vs Cost Scatter */}
        <div className="dash-chart-card animate-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">
              <span className="material-symbols-outlined">scatter_plot</span>
              Eficiência: Velocidade × Custo
            </h3>
            <p className="dash-chart-desc">
              Posição ideal = canto inferior-direito (alta velocidade + baixo custo).
              Modelos no quadrante superior-esquerdo oferecem menor eficiência econômica.
              Custo em USD por 1M tokens (blend 3:1).
            </p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ left: 10, right: 20, bottom: 10 }}>
              <CartesianGrid stroke="rgba(65,71,91,0.15)" />
              <XAxis
                type="number" dataKey="speed" name="Velocidade"
                tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false}
                label={{ value: 'Tokens/s', position: 'bottom', fill: '#6f758b', fontSize: 10 }}
              />
              <YAxis
                type="number" dataKey="cost" name="Custo (USD)"
                tick={{ fill: '#a5aac2', fontSize: 11 }} axisLine={false}
                label={{ value: 'USD/1M tok', angle: -90, position: 'insideLeft', fill: '#6f758b', fontSize: 10 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Scatter data={scatterData} fillOpacity={0.9} strokeWidth={0}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} r={8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="dash-legend">
            {MODEL_ORDER.map(name => (
              <div key={name} className="dash-legend-item">
                <div className="dash-legend-dot" style={{ background: MODEL_COLORS[name] }} />
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Radar + Donut ── */}
      <div className="dash-charts-2col">
        {/* Radar Multi-Benchmark */}
        <div className="dash-chart-card animate-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">
              <span className="material-symbols-outlined">radar</span>
              Radar Multi-Benchmark (6 eixos)
            </h3>
            <p className="dash-chart-desc">
              Radar com 6 avaliações científicas independentes. Quanto maior a área do polígono,
              mais completo é o modelo nesse cluster de competências.
              Valores normalizados (0-100).
            </p>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(65,71,91,0.3)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#a5aac2', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#6f758b', fontSize: 9 }} domain={[0, 100]} />
              {models && models.map(m => (
                <Radar
                  key={m.name}
                  name={m.name}
                  dataKey={m.name}
                  stroke={MODEL_COLORS[m.name]}
                  fill={MODEL_COLORS[m.name]}
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              ))}
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="dash-legend">
            {MODEL_ORDER.map(name => (
              <div key={name} className="dash-legend-item">
                <div className="dash-legend-dot" style={{ background: MODEL_COLORS[name] }} />
                {name}
              </div>
            ))}
          </div>
          {/* Benchmark Legend */}
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-4)',
            background: 'rgba(0, 226, 238, 0.04)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(0, 226, 238, 0.08)',
          }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Glossário dos Benchmarks
            </p>
            {RADAR_AXES.map(axis => (
              <p key={axis.key} style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--on-surface)' }}>{axis.label}</strong> — {axis.fullName}
              </p>
            ))}
          </div>
        </div>

        {/* Donut: Cost Distribution */}
        <div className="dash-chart-card animate-in" style={{ animationDelay: '0.55s', opacity: 0 }}>
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">
              <span className="material-symbols-outlined">donut_large</span>
              Distribuição de Custos
            </h3>
            <p className="dash-chart-desc">
              Proporção do custo por modelo (USD/1M tokens, blend 3:1 input:output).
              Modelos open-source/free não aparecem nesta visualização.
              Fatias maiores indicam modelos mais caros.
            </p>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                labelLine={{ stroke: 'rgba(165,170,194,0.4)', strokeWidth: 1 }}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={MODEL_COLORS[entry.name] || '#6f758b'} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={{
                      background: 'rgba(28, 37, 62, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0, 226, 238, 0.2)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                    }}>
                      <p style={{ color: MODEL_COLORS[d.name], fontWeight: 700 }}>{d.name}</p>
                      <p style={{ color: '#dfe4fe', fontSize: '0.8125rem' }}>${d.value.toFixed(2)} / 1M tokens</p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Heatmap Full Width ── */}
      <div className="dash-charts-full">
        <div className="dash-chart-card animate-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
          <div className="dash-chart-header">
            <h3 className="dash-chart-title">
              <span className="material-symbols-outlined">grid_on</span>
              Mapa de Calor — Performance por Benchmark
            </h3>
            <p className="dash-chart-desc">
              Visualização detalhada da performance absoluta em cada benchmark individual.
              Cores mais quentes (ciano) indicam pontuações mais altas.
              Valores em percentual (0-100) quando aplicável, ou score absoluto para índices.
            </p>
          </div>

          <div
            className="heatmap-grid"
            style={{ gridTemplateColumns: `120px repeat(${HEATMAP_COLS.length}, 1fr)` }}
          >
            {/* Header row */}
            <div className="heatmap-corner" />
            {HEATMAP_COLS.map(col => (
              <div key={col.key} className="heatmap-col-header" title={col.key}>{col.label}</div>
            ))}

            {/* Data rows */}
            {models && MODEL_ORDER.map(modelName => {
              const m = models.find(x => x.name === modelName)
              if (!m) return null
              return [
                <div key={`${modelName}-label`} className="heatmap-row-label">
                  <div className="heatmap-row-dot" style={{ background: MODEL_COLORS[modelName] }} />
                  {modelName}
                </div>,
                ...HEATMAP_COLS.map(col => {
                  const raw = m.evaluations?.[col.key]
                  const displayVal = raw != null ? (raw * col.scale).toFixed(1) : '—'
                  const numVal = raw != null ? raw * col.scale : null
                  return (
                    <div
                      key={`${modelName}-${col.key}`}
                      className="heatmap-cell"
                      data-value={raw == null ? 'null' : 'set'}
                      style={{ background: heatColor(numVal, heatmapMaxes[col.key]) }}
                      title={`${modelName} • ${col.label}: ${displayVal}`}
                    >
                      {displayVal}
                    </div>
                  )
                })
              ]
            })}
          </div>

          {/* Heatmap Benchmark Legend */}
          <div style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-4)',
            background: 'rgba(0, 226, 238, 0.04)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(0, 226, 238, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-1) var(--space-6)',
          }}>
            <p style={{ gridColumn: '1 / -1', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Legenda das Colunas
            </p>
            {[
              { label: 'Índice IA', desc: 'Artificial Analysis Intelligence Index v4.0 — Combina 10 avaliações independentes num score geral (0-60+)' },
              { label: 'Coding', desc: 'AA Coding Index — Avalia capacidade de gerar, revisar e depurar código complexo' },
              { label: 'GPQA', desc: 'GPQA Diamond — Questões de pós-graduação em física, biologia e química' },
              { label: 'HLE', desc: "Humanity's Last Exam — Perguntas extremamente difíceis criadas por especialistas mundiais" },
              { label: 'SciCode', desc: 'SciCode — Resolução de problemas programáticos de nível científico/pesquisa' },
              { label: 'IFBench', desc: 'IFBench — Avalia o seguimento preciso de instruções complexas e multi-etapas' },
              { label: 'LCR', desc: 'AA-LCR — Long Chain Reasoning, mede raciocínio em sequências longas e interdependentes' },
              { label: 'τ²-Bench', desc: 'τ²-Bench Telecom — Resolução de problemas reais de telecomunicações e suporte técnico' },
            ].map(item => (
              <p key={item.label} style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--on-surface)' }}>{item.label}</strong> — {item.desc}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Ranking Table ── */}
      <div className="card animate-in" style={{ animationDelay: '0.65s', opacity: 0 }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Ranking Completo</h3>
            <p className="section-subtitle">Classificação geral por Índice de Inteligência, velocidade e custo</p>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Modelo</th>
              <th>Desenvolvedor</th>
              <th>Inteligência</th>
              <th>Velocidade (tok/s)</th>
              <th>Custo (USD/1M)</th>
              <th>Latência (TTFT)</th>
              <th>Fonte</th>
            </tr>
          </thead>
          <tbody>
            {models && [...models]
              .sort((a, b) =>
                (b.evaluations?.artificial_analysis_intelligence_index || 0) -
                (a.evaluations?.artificial_analysis_intelligence_index || 0)
              )
              .map((m, i) => (
                <tr key={m.name}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: MODEL_COLORS[m.name], flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--on-surface-variant)' }}>{m.model_creator?.name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min((m.evaluations?.artificial_analysis_intelligence_index || 0) / 60 * 100, 100)}%`,
                            background: `linear-gradient(90deg, ${MODEL_COLORS[m.name]}88, ${MODEL_COLORS[m.name]})`,
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {(m.evaluations?.artificial_analysis_intelligence_index || 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{(m.median_output_tokens_per_second || 0).toFixed(0)}</td>
                  <td style={{ fontWeight: 600 }}>${(m.pricing?.price_1m_blended_3_to_1 || 0).toFixed(2)}</td>
                  <td>{(m.median_time_to_first_token_seconds || 0).toFixed(2)}s</td>
                  <td>
                    <span className={`badge ${m._source === 'api' ? 'badge-success' : 'badge-tertiary'}`}>
                      {m._source === 'api' ? 'API' : 'Mock'}
                    </span>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Methodology Note ── */}
      <div style={{
        marginTop: 'var(--space-6)',
        padding: 'var(--space-4) var(--space-5)',
        background: 'rgba(0, 226, 238, 0.04)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(0, 226, 238, 0.08)',
        fontSize: '0.75rem',
        color: 'var(--on-surface-variant)',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--primary)' }}>ℹ Metodologia</strong> —
        Dados de inteligência baseados no Artificial Analysis Intelligence Index v4.0.
        Preços refletem a API de primeiro partido. Velocidade = mediana P50 das últimas 72h.
        Modelos internos (Antigravity, Manus, Chat Z.Ai) usam métricas estimadas.
        Fonte: <a href="https://artificialanalysis.ai/methodology" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
        artificialanalysis.ai/methodology</a>
      </div>
    </div>
  )
}
