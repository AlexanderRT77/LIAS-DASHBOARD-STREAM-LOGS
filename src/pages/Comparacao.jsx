import { useState } from 'react'
import Radar3D from '../components/Radar3D'
import { ModelLogo } from '../utils/modelLogos'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts'

import { useNavigate } from 'react-router-dom'
import { useEvaluation } from '../contexts/EvaluationContext'
import { useComparisonData } from '../contexts/ComparisonDataContext'

const availableModels = [
  { key: 'Antigravity', color: '#ff00cc' },
  { key: 'Claude', color: '#ac89ff' },
  { key: 'Gemini', color: '#99f7ff' },
  { key: 'DeepSeek', color: '#ff716c' },
  { key: 'Perplexity', color: '#00ffb2' },
  { key: 'Grok', color: '#ffa057' },
  { key: 'Manus', color: '#6f758b' },
  { key: 'Chat Z.Ai', color: '#f0f0f0' },
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
  const navigate = useNavigate();
  const { radarData } = useEvaluation();
  const { benchmarkData, latencyTimeline, comparisonTable, isCustomData, uploadMeta, resetToDefaults } = useComparisonData();
  const [activeModels, setActiveModels] = useState(['Antigravity', 'Claude']);
  const [viewMode, setViewMode] = useState('2D');
  const [hoveredData, setHoveredData] = useState(null);

  const toggleModel = (modelKey) => {
    setActiveModels(prev => 
      prev.includes(modelKey)
        ? prev.filter(m => m !== modelKey)
        : [...prev, modelKey]
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Comparação de IAs</h2>
        <p className="page-description">
          Análise comparativa detalhada entre os principais motores de IA em benchmarks clínicos.
        </p>
      </div>

      {/* Data Source Banner */}
      {isCustomData && (
        <div className="card animate-in" style={{
          marginBottom: 'var(--space-4)',
          borderLeft: '3px solid var(--primary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>cloud_done</span>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>
                Dados Personalizados Ativos
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>
                {uploadMeta?.summary?.join(' · ') || 'Upload via CSV'} — {uploadMeta?.uploadedAt ? new Date(uploadMeta.uploadedAt).toLocaleString('pt-BR') : ''}
              </p>
            </div>
          </div>
          <button
            onClick={resetToDefaults}
            style={{
              background: 'rgba(255,113,108,0.1)', color: 'var(--error)', border: '1px solid rgba(255,113,108,0.3)',
              padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>restart_alt</span>
            Resetar para Padrão
          </button>
        </div>
      )}

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
              <Line type="monotone" dataKey="Gemini" name="Gemini" stroke="#99f7ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Claude" name="Claude" stroke="#ac89ff" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Antigravity" name="Antigravity" stroke="#ff00cc" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Chat Z.Ai" name="Chat Z.Ai" stroke="#f0f0f0" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {[
              { name: 'Antigravity', detail: 'Agentic Flow (2.0s)', color: '#ff00cc' },
              { name: 'Claude', detail: 'Alta Perf. (1.1s)', color: '#ac89ff' },
              { name: 'Chat Z.Ai', detail: 'Ultra-Fast (0.4s)', color: '#f0f0f0' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ModelLogo name={l.name} size={18} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{l.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: l.color, fontWeight: 500 }}>{l.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Interativo */}
      <div className="card animate-in animate-delay-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h3 className="chart-title">Radar de Atributos Clínicos</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <p className="chart-subtitle" style={{ margin: 0 }}>Análise heurística multidimensional.</p>
              <div style={{ display: 'flex', background: 'rgba(65,71,91,0.2)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                <button 
                  onClick={() => setViewMode('2D')}
                  style={{
                    padding: '4px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: viewMode === '2D' ? 'var(--primary)' : 'transparent', color: viewMode === '2D' ? 'var(--on-primary)' : 'var(--on-surface-variant)'
                  }}>2D</button>
                <button 
                  onClick={() => setViewMode('3D')}
                  style={{
                    padding: '4px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: viewMode === '3D' ? 'var(--tertiary)' : 'transparent', color: viewMode === '3D' ? 'var(--on-primary)' : 'var(--on-surface-variant)'
                  }}>3D</button>
              </div>
            </div>
            
            {/* Exibição Didática Suspensa (Header) baseada no Hover do 2D */}
            <div style={{ minHeight: '32px', marginTop: '8px', display: 'flex', alignItems: 'center' }}>
              {hoveredData && viewMode === '2D' && (
                <div className="animate-in" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', background: 'rgba(28,37,62,0.6)', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(65,71,91,0.3)' }}>
                  <span style={{ fontWeight: 700, color: '#dfe4fe', fontSize: '0.875rem' }}>{hoveredData[0].payload.attribute}:</span>
                  {hoveredData.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}></span>
                      <span style={{ color: p.color, fontSize: '0.8125rem', fontWeight: 700 }}>
                        {p.name} <span style={{ color: '#a5aac2', fontWeight: 500 }}>{p.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {availableModels.map(m => {
              const isActive = activeModels.includes(m.key)
              return (
                <div
                  key={m.key}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? `${m.color}22` : 'var(--surface-container-high)',
                    border: `1px solid ${isActive ? m.color : 'transparent'}`,
                    color: isActive ? m.color : 'var(--on-surface-variant)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <div 
                    onClick={() => toggleModel(m.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <ModelLogo name={m.key} size={18} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? m.color : 'var(--on-surface-variant)' }}></span>
                    {m.key}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate('/avaliacao', { state: { selectedModel: m.key } }); }}
                    style={{
                      background: 'transparent', border: 'none', padding: 0,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      color: 'var(--primary)', marginLeft: '4px', opacity: isActive ? 1 : 0.5
                    }}
                    title="Aprofundamento Científico"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>science</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        
        {activeModels.length === 0 ? (
          <div style={{ width: '100%', height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
            Selecione ao menos um modelo acima para visualizar o radar.
          </div>
        ) : viewMode === '3D' ? (
          <Radar3D radarData={radarData} availableModels={availableModels} activeModels={activeModels} />
        ) : (
          <ResponsiveContainer width="100%" height={560}>
            <RadarChart 
              cx="50%" cy="50%" outerRadius="70%" data={radarData}
              onMouseMove={(e) => {
                if (e && e.activePayload) setHoveredData(e.activePayload)
              }}
              onMouseLeave={() => setHoveredData(null)}
            >
              <PolarGrid stroke="rgba(165,170,194,0.15)" gridType="polygon" />
              <PolarAngleAxis dataKey="attribute" tick={{ fill: '#dfe4fe', fontSize: 13, fontWeight: 700 }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[50, 100]} 
                tickCount={6} 
                tick={{ fill: 'rgba(165,170,194,0.7)', fontSize: 11, fontWeight: 'bold' }} 
                axisLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              {availableModels.filter(m => activeModels.includes(m.key)).map(m => (
                <Radar
                  key={m.key}
                  name={m.key}
                  dataKey={m.key}
                  stroke={m.color}
                  strokeWidth={2.5}
                  fill={m.color}
                  fillOpacity={0.15}
                  dot={{ r: 4, fill: m.color, strokeDasharray: '' }}
                  activeDot={{ r: 6, fill: '#fff', stroke: m.color, strokeWidth: 2 }}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        )}
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
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                  Análise de IA: Eficiência de Resposta
                </h4>
                <button
                  onClick={() => navigate('/avaliacao', { state: { selectedModel: 'Antigravity' } })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'rgba(0, 226, 238, 0.1)', color: 'var(--primary)',
                    border: '1px solid rgba(0, 226, 238, 0.3)', padding: '4px 12px',
                    borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', marginBottom: 'var(--space-2)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>science</span>
                  Ver Painel Avaliativo
                </button>
              </div>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              O modelo <strong style={{ color: 'var(--primary)' }}>Antigravity</strong> apresenta o melhor equilíbrio sistêmico entre 
              as 6 diretrizes clínicas, com segurança perfeita (99). O <strong style={{ color: '#ac89ff' }}>Claude</strong> domina na 
              relação custo-benefício para análises que não exigem loop agêntico contínuo.
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
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ModelLogo name={r.model} size={20} />
                    <span style={{ fontWeight: 600 }}>{r.model}</span>
                  </div>
                </td>
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
