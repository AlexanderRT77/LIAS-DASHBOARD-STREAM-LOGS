import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { useAuth } from '../contexts/AuthContext'
import { useSupabaseData, useSupabaseInsert } from '../hooks/useSupabaseData'
import { isSupabaseConfigured } from '../lib/supabase'
import { useComparisonData } from '../contexts/ComparisonDataContext'
import { useEvaluation } from '../contexts/EvaluationContext'
import { analyzeCSV, CHART_DESCRIPTIONS } from '../utils/csvSmartMapper'
import { ModelLogo } from '../utils/modelLogos'
import LoginModal from '../components/LoginModal'

const SUPPORTED_FORMATS = ['.CSV', '.TSV']

// ═══════════════════════════════════════════════════
// Destination types with intelligent descriptions
// ═══════════════════════════════════════════════════
const TABLE_TARGETS = [
  {
    value: 'comparison_charts',
    label: 'Comparação de IAs',
    desc: 'Envia dados diretamente para os gráficos da aba "Comparação de IAs"',
    icon: 'compare_arrows',
    color: '#00e2ee',
    charts: ['Acurácia vs Latência', 'Wavechart de Latência', 'Radar de Atributos', 'Tabela de Desempenho'],
    isNew: true,
  },
  {
    value: 'performance_metrics',
    label: 'Banco de Dados (Supabase)',
    desc: 'Acurácia, latência, custo por modelo — direto ao Supabase',
    icon: 'database',
    color: '#4ade80',
    charts: [],
    isNew: false,
  },
]

const COLUMN_MAPPINGS = {
  performance_metrics: {
    required: ['model_id_or_name', 'category', 'accuracy'],
    optional: ['latency_ms', 'cost_per_1m_tokens', 'hallucination_rate', 'citation_rate', 'compliance_score', 'energy_rating'],
    example: 'model_name,category,accuracy,latency_ms,cost_per_1m_tokens\nGPT-4o Health,cardiologia,96.8,210,0.0150'
  },
  comparison_charts: {
    required: ['model_name'],
    optional: ['accuracy', 'latency', 'reasoning', 'extraction', 'cost', 'compliance', 'criatividade', 'confiabilidade', 'usabilidade', 'seguranca', 'potencial_saude', 'status'],
    example: 'model_name,accuracy,latency,reasoning,extraction,cost,compliance\nAntigravity,97.0,2.0,98,99,0.00,99.9'
  },
}

// ═══════════════════════════════════════════════════
// Smart Mapping Report Component
// ═══════════════════════════════════════════════════
function MappingReport({ analysis }) {
  if (!analysis) return null
  const { mappings, unmapped, report, error } = analysis

  if (error) {
    return (
      <div className="card" style={{ borderLeft: '3px solid var(--error)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
          <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '0.875rem' }}>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card animate-in" style={{ borderLeft: '3px solid var(--primary)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>psychology</span>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Análise Inteligente do CSV</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
            {report.mappedColumns}/{report.totalColumns} colunas mapeadas · {report.modelsFound} modelo(s) · {report.fuzzyMatches > 0 ? `${report.fuzzyMatches} match semântico` : ''}
          </p>
        </div>
      </div>

      {/* Schema visual: columns → charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
        {/* Left: detected columns */}
        <div>
          <p className="label-sm" style={{ marginBottom: 'var(--space-2)' }}>Colunas Detectadas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mappings.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                background: m.fuzzy ? 'rgba(251,191,36,0.08)' : 'rgba(0,226,238,0.06)',
                border: `1px solid ${m.fuzzy ? 'rgba(251,191,36,0.2)' : 'rgba(0,226,238,0.15)'}`,
                fontSize: '0.75rem',
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--on-surface)' }}>{m.original}</span>
                <span style={{ color: 'var(--on-surface-variant)' }}>→</span>
                <span style={{ color: m.fuzzy ? 'var(--warning)' : 'var(--primary)', fontWeight: 500 }}>{m.label}</span>
                {m.fuzzy && <span title="Match semântico aproximado" style={{ fontSize: '0.65rem' }}>🧠</span>}
              </div>
            ))}
            {unmapped.map((u, i) => (
              <div key={`u${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,113,108,0.06)', border: '1px solid rgba(255,113,108,0.15)',
                fontSize: '0.75rem', color: 'var(--error)',
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.header}</span>
                <span>— ignorada</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 30 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--primary)' }}>arrow_forward</span>
        </div>

        {/* Right: targets */}
        <div>
          <p className="label-sm" style={{ marginBottom: 'var(--space-2)' }}>Gráficos de Destino</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {report.chartsAffected.map((chart, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)',
                fontSize: '0.8125rem', fontWeight: 500,
              }}>
                {CHART_DESCRIPTIONS[chart] || chart}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 'var(--space-3)', background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-md)' }}>
        {report.summary.map((line, i) => (
          <span key={i} style={{ fontSize: '0.8125rem', color: 'var(--on-surface)' }}>{line}</span>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Main Upload Component
// ═══════════════════════════════════════════════════
export default function Upload() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { updateFromCSV } = useComparisonData()
  const { updateModelScore } = useEvaluation()
  const [showLogin, setShowLogin] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedTable, setSelectedTable] = useState('comparison_charts')
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [analysis, setAnalysis] = useState(null) // Smart mapper result

  const { insert: insertData, loading: inserting } = useSupabaseInsert('performance_metrics')
  const { insert: insertUploadLog } = useSupabaseInsert('file_uploads')
  const { data: recentUploads } = useSupabaseData('file_uploads', {
    mockData: [
      { id: 1, filename: 'dataset_cardio_2024.csv', file_size: '24.8 MB', status: 'Processado', created_at: new Date().toISOString() },
      { id: 2, filename: 'exames_neuro_batch.csv', file_size: '156.2 MB', status: 'Em fila', created_at: new Date().toISOString() },
    ],
    limit: 10,
    realtime: true,
  })

  const handleFile = useCallback((file) => {
    if (!file) return

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (ext !== '.csv' && ext !== '.tsv') {
      setParseError(`Formato "${ext}" não suportado. Use CSV ou TSV.`)
      return
    }

    setFileName(file.name)
    setParseError(null)
    setParsedData(null)
    setUploadStatus(null)
    setAnalysis(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`Erro de parsing: ${results.errors[0].message} (linha ${results.errors[0].row})`)
          return
        }

        if (results.data.length === 0) {
          setParseError('Arquivo vazio ou sem dados válidos.')
          return
        }

        const columns = Object.keys(results.data[0])

        // Run smart analysis for comparison_charts target
        if (selectedTable === 'comparison_charts') {
          const result = analyzeCSV(columns, results.data)
          setAnalysis(result)
        }

        setParsedData({
          rows: results.data,
          columns,
          rowCount: results.data.length,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
        })
      },
      error: (err) => {
        setParseError(`Falha ao ler arquivo: ${err.message}`)
      }
    })
  }, [selectedTable])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleFileInput = (e) => {
    handleFile(e.target.files[0])
  }

  // ═══════ UPLOAD HANDLER ═══════
  const handleUpload = async () => {
    if (!parsedData?.rows?.length) return

    setUploadStatus('uploading')

    try {
      if (selectedTable === 'comparison_charts') {
        // Route to ComparisonDataContext (no auth required for local)
        if (!analysis || analysis.error) {
          setUploadStatus('error')
          setUploadResult('Erro: Análise inteligente falhou. Verifique as colunas do CSV.')
          return
        }

        const meta = updateFromCSV(analysis.processedData, analysis.report)

        // Also update EvaluationContext radar if radar data available
        if (analysis.processedData.radarUpdates) {
          for (const [attr, models] of Object.entries(analysis.processedData.radarUpdates)) {
            for (const [modelName, score] of Object.entries(models)) {
              updateModelScore(modelName, attr, score)
            }
          }
        }

        setUploadStatus('success')
        setUploadResult(`✅ Dados enviados com sucesso para a aba "Comparação de IAs"! ${meta.chartsAffected.length} gráfico(s) atualizado(s).`)
      } else {
        // Route to Supabase (requires auth)
        if (!user) {
          setShowLogin(true)
          setUploadStatus(null)
          return
        }

        const normalizedRows = parsedData.rows.map(row => {
          const normalized = {}
          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
            if (value !== null && value !== undefined && value !== '') {
              normalized[normalizedKey] = value
            }
          })
          normalized.created_by = user.id
          return normalized
        })

        const { error } = await insertData(normalizedRows)

        if (error) {
          setUploadStatus('error')
          setUploadResult(`Erro: ${error}`)
          return
        }

        await insertUploadLog([{
          filename: fileName,
          file_size: parsedData.fileSize,
          file_type: fileName.split('.').pop().toUpperCase(),
          status: 'Processado',
          rows_imported: normalizedRows.length,
          target_table: selectedTable,
          uploaded_by: user.id,
        }])

        setUploadStatus('success')
        setUploadResult(`✅ ${normalizedRows.length} registros importados com sucesso para "${selectedTable}"!`)
      }
    } catch (err) {
      setUploadStatus('error')
      setUploadResult(`Erro inesperado: ${err.message}`)
    }
  }

  const mapping = COLUMN_MAPPINGS[selectedTable]

  // Storage calc
  const baseStorageMB = 138.5
  const uploadedMB = recentUploads.reduce((acc, u) => {
    if (!u.file_size) return acc
    const mb = parseFloat(u.file_size.replace(/[^0-9.]/g, ''))
    return acc + (isNaN(mb) ? 0 : mb)
  }, 0)
  const totalUsedMB = (baseStorageMB + uploadedMB).toFixed(1)
  const maxStorageMB = 1000.0
  const storagePercentage = Math.min(((totalUsedMB / maxStorageMB) * 100), 100).toFixed(1)

  return (
    <div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <div className="page-header">
        <h2 className="page-title">Gestão de Dados</h2>
        <p className="page-description">
          Upload de datasets clínicos via CSV para alimentar os gráficos do dashboard.
          Os dados importados são processados por um <strong style={{ color: 'var(--primary)' }}>agente inteligente</strong> que distribui automaticamente cada métrica ao gráfico correto.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Left: Upload Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Destination Selector — Redesigned */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>route</span>
              <p className="label-sm" style={{ margin: 0 }}>Destino dos Dados</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {TABLE_TARGETS.map(t => (
                <label
                  key={t.value}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: selectedTable === t.value ? `${t.color}08` : 'var(--surface-container-high)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: selectedTable === t.value ? `1px solid ${t.color}33` : '1px solid transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="radio"
                    name="table-target"
                    value={t.value}
                    checked={selectedTable === t.value}
                    onChange={(e) => { setSelectedTable(e.target.value); setAnalysis(null); setParsedData(null); setFileName(''); setParseError(null) }}
                    style={{ accentColor: t.color, marginTop: 3 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: t.color }}>{t.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.label}</span>
                      {t.isNew && <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>NOVO</span>}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>{t.desc}</p>
                    {t.charts.length > 0 && selectedTable === t.value && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {t.charts.map(c => (
                          <span key={c} style={{
                            fontSize: '0.65rem', padding: '2px 8px',
                            background: `${t.color}15`, color: t.color,
                            borderRadius: 'var(--radius-full)', fontWeight: 500,
                          }}>{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div
            className="card"
            style={{
              border: `2px dashed ${dragActive ? 'var(--primary)' : parseError ? 'var(--error)' : 'var(--outline-variant)'}`,
              background: dragActive ? 'rgba(0,226,238,0.04)' : 'var(--surface-container-low)',
              textAlign: 'center',
              padding: 'var(--space-10) var(--space-6)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
            }}
            onDragOver={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".csv,.tsv"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <span className="material-symbols-outlined" style={{
              fontSize: '3rem',
              color: dragActive ? 'var(--primary)' : 'var(--outline)',
              marginBottom: 'var(--space-4)',
              display: 'block',
            }}>cloud_upload</span>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-2)' }}>
              {fileName || 'Arraste uma planilha CSV aqui'}
            </p>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', marginBottom: 'var(--space-4)' }}>
              ou clique para selecionar
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
              {SUPPORTED_FORMATS.map(f => (
                <span key={f} className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Column Mapping + Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Column Requirements */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <p className="label-sm" style={{ margin: 0 }}>Colunas Esperadas</p>
              <a
                href="/templates/template_metricas_ia.csv"
                download="template_metricas_ia.csv"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--primary)', textDecoration: 'none',
                  padding: '4px 12px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(0,226,238,0.08)', border: '1px solid rgba(0,226,238,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>download</span>
                Baixar Template CSV
              </a>
            </div>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>Obrigatória:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {mapping.required.map(col => (
                  <span key={col} className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>✓ {col}</span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>Opcionais (detectadas por IA):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {mapping.optional.map(col => (
                  <span key={col} className="badge badge-tertiary" style={{ fontSize: '0.6875rem' }}>{col}</span>
                ))}
              </div>
            </div>

            {/* Semantic hint */}
            {selectedTable === 'comparison_charts' && (
              <div style={{
                marginTop: 'var(--space-3)', padding: 'var(--space-3)',
                background: 'rgba(251,191,36,0.05)', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(251,191,36,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.875rem' }}>🧠</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)' }}>Análise Semântica Ativa</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                  O agente inteligente reconhece variações como <code style={{ color: 'var(--primary)' }}>acuracia</code>, <code style={{ color: 'var(--primary)' }}>precisão</code>, <code style={{ color: 'var(--primary)' }}>acc</code> → Acurácia.
                  Também aceita nomes em inglês e português. Colunas não reconhecidas serão ignoradas com aviso.
                </p>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Exemplo CSV:</p>
              <pre style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {mapping.example}
              </pre>
            </div>
          </div>

          {/* Info: Where data goes */}
          {selectedTable === 'comparison_charts' && (
            <div className="card" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-2)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>info</span>
                <span className="label-sm" style={{ margin: 0 }}>Para Onde Vão os Dados?</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--primary)' }}>accuracy + latency</span>
                  <span style={{ color: 'var(--outline)' }}>→</span>
                  <span>Gráfico Acurácia vs Latência + Wavechart</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--primary)' }}>reasoning + extraction + cost + compliance</span>
                  <span style={{ color: 'var(--outline)' }}>→</span>
                  <span>Tabela de Desempenho Detalhada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--primary)' }}>criatividade, seguranca, etc.</span>
                  <span style={{ color: 'var(--outline)' }}>→</span>
                  <span>Radar de Atributos Clínicos (6 eixos)</span>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: 8 }}>
                💾 Dados ficam salvos no navegador (localStorage). Para reverter, use o botão "Resetar" na aba Comparação.
              </p>
            </div>
          )}

          {/* System Status */}
          {[
            { label: 'Supabase Connection', value: isSupabaseConfigured() ? 'Online' : 'Não configurado', color: isSupabaseConfigured() ? 'var(--success)' : 'var(--warning)', width: isSupabaseConfigured() ? 100 : 0 },
            { label: 'HIPAA Compliance', value: '100%', color: 'var(--success)', width: 100 },
            { label: 'Storage Used', value: `${totalUsedMB}MB / ${maxStorageMB}MB`, color: storagePercentage > 80 ? 'var(--error)' : 'var(--warning)', width: storagePercentage, transition: true },
          ].map((m, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span className="label-sm">{m.label}</span>
                <span style={{ fontWeight: 700, color: m.color, fontSize: '0.875rem' }}>{m.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.width}%`, background: m.color, ...(m.transition ? { transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' } : {}) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="card" style={{ borderLeft: '3px solid var(--error)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
            <span style={{ color: 'var(--error)', fontWeight: 600 }}>{parseError}</span>
          </div>
        </div>
      )}

      {/* Smart Mapping Report */}
      {selectedTable === 'comparison_charts' && analysis && <MappingReport analysis={analysis} />}

      {/* Parsed Data Preview */}
      {parsedData && !parseError && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="section-header">
            <div>
              <h3 className="title-lg">Preview dos Dados</h3>
              <p className="chart-subtitle">
                {parsedData.rowCount} linhas · {parsedData.columns.length} colunas · {parsedData.fileSize}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {uploadStatus === 'success' && selectedTable === 'comparison_charts' && (
                <button
                  className="btn"
                  onClick={() => navigate('/comparacao')}
                  style={{
                    background: 'rgba(0,226,238,0.1)', color: 'var(--primary)',
                    border: '1px solid rgba(0,226,238,0.3)', minWidth: 160,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                  Ver na Comparação
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={inserting || uploadStatus === 'uploading' || (selectedTable === 'comparison_charts' && analysis?.error)}
                style={{ minWidth: 180 }}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <span className="material-symbols-outlined spinning" style={{ fontSize: '1rem' }}>progress_activity</span>
                    Processando...
                  </>
                ) : selectedTable === 'comparison_charts' ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>compare_arrows</span>
                    Enviar para Comparação
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cloud_upload</span>
                    Enviar para Supabase
                  </>
                )}
              </button>
            </div>
          </div>

          {uploadResult && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: uploadStatus === 'success' ? 'rgba(74,222,128,0.08)' : 'rgba(255,113,108,0.08)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
              color: uploadStatus === 'success' ? 'var(--success)' : 'var(--error)',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}>
              {uploadResult}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {parsedData.columns.map(col => {
                    const mapped = analysis?.mappings?.find(m => m.original === col)
                    return (
                      <th key={col} style={{ position: 'relative' }}>
                        {col}
                        {mapped && (
                          <span style={{
                            display: 'block', fontSize: '0.6rem', fontWeight: 400,
                            color: mapped.fuzzy ? 'var(--warning)' : 'var(--primary)',
                            marginTop: 2,
                          }}>
                            → {mapped.label}
                          </span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--outline)', fontSize: '0.75rem' }}>{i + 1}</td>
                    {parsedData.columns.map(col => (
                      <td key={col} style={{ fontSize: '0.8125rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row[col] ?? <span style={{ color: 'var(--outline)' }}>null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                {parsedData.rowCount > 10 && (
                  <tr>
                    <td colSpan={parsedData.columns.length + 1} style={{ textAlign: 'center', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                      ... e mais {parsedData.rowCount - 10} linhas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      <div className="card">
        <h3 className="title-lg" style={{ marginBottom: 'var(--space-5)' }}>Uploads Recentes</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Tamanho</th>
              <th>Registros</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {recentUploads.map((u, i) => (
              <tr key={u.id || i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>description</span>
                    <span style={{ fontWeight: 500 }}>{u.filename}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>{u.file_size}</td>
                <td style={{ fontFamily: 'monospace' }}>{u.rows_imported || '—'}</td>
                <td>
                  <span className={`badge ${
                    u.status === 'Processado' ? 'badge-success' :
                    u.status === 'Em fila' ? 'badge-warning' : 'badge-primary'
                  }`}>{u.status}</span>
                </td>
                <td style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
