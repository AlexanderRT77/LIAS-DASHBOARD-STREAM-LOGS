import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import { useAuth } from '../contexts/AuthContext'
import { useSupabaseData, useSupabaseInsert } from '../hooks/useSupabaseData'
import { isSupabaseConfigured } from '../lib/supabase'
import { useComparisonData } from '../contexts/ComparisonDataContext'
import { useEvaluation } from '../contexts/EvaluationContext'
import { analyzeCSV, CHART_DESCRIPTIONS } from '../utils/csvSmartMapper'
import { MODEL_ORDER } from '../utils/modelLogos'
import LoginModal from '../components/LoginModal'

const SUPPORTED_FORMATS = ['.CSV', '.TSV']
const DRAFTS_KEY = 'lias_upload_drafts'

// ═══════════════════════════════════════════════════
// Destination types with intelligent descriptions
// ═══════════════════════════════════════════════════
const TABLE_TARGETS = [
  {
    value: 'comparison_charts',
    label: 'Comparação Global de IAs',
    desc: 'Envia dados para os gráficos atualizando TODOS os modelos presentes na planilha',
    icon: 'compare_arrows',
    color: '#00e2ee',
    charts: ['Acurácia vs Latência', 'Wavechart de Latência', 'Radar de Atributos', 'Tabela de Desempenho'],
  },
  {
    value: 'comparison_single',
    label: 'Atualizar IA Específica',
    desc: 'Proteção de segurança: Atualiza apenas o modelo selecionado, ignorando ou rejeitando outros',
    icon: 'target',
    color: '#ff00cc',
    charts: ['Acurácia vs Latência', 'Wavechart de Latência', 'Radar de Atributos', 'Tabela de Desempenho'],
  },
  {
    value: 'performance_metrics',
    label: 'Banco de Dados (Supabase)',
    desc: 'Acurácia, latência, custo por modelo — histórico no Supabase',
    icon: 'database',
    color: '#4ade80',
    charts: [],
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
  comparison_single: {
    required: [],
    optional: ['model_name', 'accuracy', 'latency', 'reasoning', 'extraction', 'cost', 'compliance', 'criatividade', 'confiabilidade', 'usabilidade', 'seguranca', 'potencial_saude', 'status'],
    example: 'accuracy,latency,reasoning,extraction,cost,compliance\n97.0,2.0,98,99,0.00,99.9'
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--space-3)', alignItems: 'start', marginBottom: 'var(--space-4)' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 30 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--primary)' }}>arrow_forward</span>
        </div>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 'var(--space-3)', background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-md)' }}>
        {report.summary.map((line, i) => (
          <span key={i} style={{ fontSize: '0.8125rem', color: 'var(--on-surface)' }}>{line}</span>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// Editable Data Grid Component
// ═══════════════════════════════════════════════════
function EditableGrid({ data, onDataChange }) {
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')

  const startEditing = (rowIndex, colKey, currentValue) => {
    setEditingCell({ rowIndex, colKey })
    setEditValue(currentValue === null || currentValue === undefined ? '' : String(currentValue))
  }

  const commitEditing = () => {
    if (editingCell) {
      const { rowIndex, colKey } = editingCell
      const newRows = [...data.rows]
      // Use Papa logic or basic logic to preserve type if it was a number
      let finalValue = editValue
      if (editValue !== '' && !isNaN(Number(editValue)) && editValue.trim() !== '') {
         finalValue = Number(editValue)
      }
      newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: finalValue }
      onDataChange({ ...data, rows: newRows })
      setEditingCell(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitEditing()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const addRow = () => {
    const newRow = {}
    data.columns.forEach(c => newRow[c] = '')
    onDataChange({ ...data, rows: [newRow, ...data.rows], rowCount: data.rowCount + 1 })
  }

  const deleteRow = (index) => {
    const newRows = [...data.rows]
    newRows.splice(index, 1)
    onDataChange({ ...data, rows: newRows, rowCount: data.rowCount - 1 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
        <button className="btn" onClick={addRow} style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(0,226,238,0.1)', color: 'var(--primary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
          Adicionar Linha
        </button>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
             <tr>
               <th style={{ width: 40, textAlign: 'center' }}>#</th>
               {data.columns.map(col => <th key={col}>{col}</th>)}
               <th style={{ width: 40 }}>Ações</th>
             </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--outline)', fontSize: '0.75rem', textAlign: 'center' }}>{i + 1}</td>
                {data.columns.map(col => {
                  const isEditing = editingCell?.rowIndex === i && editingCell?.colKey === col
                  return (
                    <td 
                      key={col} 
                      onDoubleClick={() => startEditing(i, col, row[col])}
                      style={{ 
                        fontSize: '0.8125rem', 
                        cursor: 'cell', 
                        padding: isEditing ? 0 : '12px 16px',
                        background: isEditing ? 'var(--surface-container-high)' : 'transparent',
                        color: row[col] === '' || row[col] === null ? 'var(--outline)' : 'var(--on-surface)'
                      }}
                    >
                      {isEditing ? (
                        <input 
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEditing}
                          onKeyDown={handleKeyDown}
                          style={{
                            width: '100%', height: '100%', padding: '12px 16px',
                            background: 'transparent', border: '2px solid var(--primary)',
                            color: 'var(--on-surface)', outline: 'none', borderRadius: 4,
                            fontFamily: 'inherit', fontSize: '0.8125rem'
                          }}
                        />
                      ) : (
                        row[col] === '' || row[col] === null ? '—' : String(row[col])
                      )}
                    </td>
                  )
                })}
                <td style={{ textAlign: 'center' }}>
                  <button onClick={() => deleteRow(i)} title="Excluir" style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', textAlign: 'right' }}>
        💡 Dica: Dê um duplo clique numa célula para editar o valor.
      </p>
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
  const [targetModel, setTargetModel] = useState(MODEL_ORDER[0]) // Used if comparison_single is selected
  
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  
  const [localDrafts, setLocalDrafts] = useState([])

  const { insert: insertData, loading: inserting } = useSupabaseInsert('performance_metrics')
  const { insert: insertUploadLog } = useSupabaseInsert('file_uploads')
  const { data: recentUploads } = useSupabaseData('file_uploads', {
    mockData: [
      { id: 1, filename: 'dataset_cardio_2024.csv', file_size: '24.8 MB', status: 'Processado', created_at: new Date().toISOString() },
    ],
    limit: 5,
    realtime: true,
  })

  // Load drafts on mount
  useEffect(() => {
    try {
      const drafts = localStorage.getItem(DRAFTS_KEY)
      if (drafts) setLocalDrafts(JSON.parse(drafts))
    } catch { }
  }, [])

  // Auto-run analysis when data or target changes
  useEffect(() => {
    if (parsedData?.columns && (selectedTable === 'comparison_charts' || selectedTable === 'comparison_single')) {
      const activeModel = selectedTable === 'comparison_single' ? targetModel : null
      const result = analyzeCSV(parsedData.columns, parsedData.rows, { targetModel: activeModel })
      setAnalysis(result)
    } else {
      setAnalysis(null)
    }
  }, [parsedData, selectedTable, targetModel])

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
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleFileInput = (e) => {
    handleFile(e.target.files[0])
    e.target.value = null // reset input
  }

  const saveDraft = () => {
    if (!parsedData) return
    const newDraft = {
      id: crypto.randomUUID(),
      name: fileName || 'edicao_manual.csv',
      date: new Date().toISOString(),
      data: parsedData,
    }
    const updatedDrafts = [newDraft, ...localDrafts]
    setLocalDrafts(updatedDrafts)
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts))
    setUploadResult(`💾 Rascunho "${newDraft.name}" salvo no navegador.`)
    setUploadStatus('success')
  }

  const loadDraft = (draft) => {
    setFileName(draft.name)
    setParsedData(draft.data)
    setParseError(null)
    setUploadStatus(null)
    setUploadResult(null)
  }

  const deleteDraft = (id) => {
    const updated = localDrafts.filter(d => d.id !== id)
    setLocalDrafts(updated)
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated))
  }

  // ═══════ UPLOAD HANDLER ═══════
  const handleUpload = async () => {
    if (!parsedData?.rows?.length) return

    setUploadStatus('uploading')

    try {
      if (selectedTable.startsWith('comparison_')) {
        // Route to ComparisonDataContext
        if (!analysis || analysis.error) {
          setUploadStatus('error')
          setUploadResult('Erro de validação: ' + (analysis?.error || 'Verifique as colunas do CSV.'))
          return
        }

        const activeModel = selectedTable === 'comparison_single' ? targetModel : null
        const meta = updateFromCSV(analysis.processedData, analysis.report, activeModel)

        // Also update EvaluationContext radar
        if (analysis.processedData.radarUpdates) {
          for (const [attr, models] of Object.entries(analysis.processedData.radarUpdates)) {
            for (const [modelName, score] of Object.entries(models)) {
              updateModelScore(modelName, attr, score)
            }
          }
        }

        setUploadStatus('success')
        setUploadResult(`✅ Dados aplicados com sucesso! ${meta.chartsAffected.length} gráfico(s) atualizado(s).`)
      } else {
        // Route to Supabase
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
        setUploadResult(`✅ ${normalizedRows.length} registros importados com sucesso para o banco de dados Supabase!`)
      }
    } catch (err) {
      setUploadStatus('error')
      setUploadResult(`Erro inesperado: ${err.message}`)
    }
  }

  const mapping = COLUMN_MAPPINGS[selectedTable] || COLUMN_MAPPINGS.comparison_charts

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
        <h2 className="page-title">Gestão de Dados & Edição</h2>
        <p className="page-description">
          Importe ou edite planilhas CSV diretamente pelo navegador. O <strong>agente de roteamento</strong> garantirá 
          a aplicação inteligente dos dados na Compareção de IAs e criará checkpoints de salvamento local.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        
        {/* Left: Upload Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Destination Selector */}
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
                    onChange={(e) => setSelectedTable(e.target.value)}
                    style={{ accentColor: t.color, marginTop: 3 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: t.color }}>
                        {selectedTable === t.value && t.value === 'comparison_single' ? 'my_location' : t.icon}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.label}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2, marginBottom: 8 }}>{t.desc}</p>
                    
                    {/* Specific Model Dropdown Dropdown */}
                    {t.value === 'comparison_single' && selectedTable === 'comparison_single' && (
                      <div className="animate-in" style={{ 
                        marginTop: 4, padding: 'var(--space-2)', background: 'var(--surface)', 
                        border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-sm)' 
                      }}>
                        <select 
                          value={targetModel}
                          onChange={e => setTargetModel(e.target.value)}
                          style={{
                            width: '100%', padding: '6px', background: 'transparent', border: 'none',
                            color: 'var(--on-surface)', outline: 'none', fontWeight: 600,
                            fontFamily: 'inherit', fontSize: '0.875rem'
                          }}
                        >
                          {MODEL_ORDER.map(m => (
                            <option key={m} value={m} style={{ background: 'var(--surface)', color: 'var(--on-surface)' }}>
                              🎯 Atualizar: {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          {(!parsedData || parseError) && (
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
                Arraste uma planilha CSV aqui
              </p>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', marginBottom: 'var(--space-4)' }}>
                ou clique para selecionar do seu computador
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                {SUPPORTED_FORMATS.map(f => (
                  <span key={f} className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Setup Editor UI if data exists */}
          {parsedData && !parseError && (
             <div className="card animate-in">
                <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 className="title-lg" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>edit_document</span>
                      Planilha Ativa
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                      {fileName} · {parsedData.rowCount} linhas
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveDraft} className="btn" style={{ padding: '6px 16px', fontSize: '0.75rem', background: 'rgba(74,222,128,0.1)', color: 'var(--success)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>save</span> Salvar Edição
                    </button>
                    <button onClick={() => { setParsedData(null); setFileName('') }} className="btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                    </button>
                  </div>
                </div>

                {/* The Editable Grid component */}
                <EditableGrid data={parsedData} onDataChange={setParsedData} />
                
                {/* Apply Settings Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--outline-variant)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
                    Ao enviar, os gráficos serão recalibrados em tempo real.
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={inserting || uploadStatus === 'uploading' || (selectedTable.startsWith('comparison') && analysis?.error)}
                    style={{ minWidth: 200 }}
                  >
                    {uploadStatus === 'uploading' ? (
                      <>
                        <span className="material-symbols-outlined spinning" style={{ fontSize: '1rem' }}>progress_activity</span> Processando...
                      </>
                    ) : selectedTable.startsWith('comparison') ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>play_circle</span> Injetar nos Gráficos
                      </>
                    ) : (
                      <>
                         <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>database</span> Enviar ao Banco
                      </>
                    )}
                  </button>
                </div>
             </div>
          )}

          {/* Status Message */}
          {uploadResult && (
            <div className="animate-in" style={{
              padding: 'var(--space-3) var(--space-4)',
              background: uploadStatus === 'success' ? 'rgba(74,222,128,0.08)' : 'rgba(255,113,108,0.08)',
              border: `1px solid ${uploadStatus === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(255,113,108,0.2)'}`,
              borderRadius: 'var(--radius-md)',
              color: uploadStatus === 'success' ? 'var(--success)' : 'var(--error)',
              fontWeight: 500, fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: 8
            }}>
              <span className="material-symbols-outlined">{uploadStatus === 'success' ? 'task_alt' : 'error'}</span>
              <span style={{ flex: 1 }}>{uploadResult}</span>
              {uploadStatus === 'success' && selectedTable.startsWith('comparison') && (
                <button onClick={() => navigate('/comparacao')} className="btn" style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'transparent', color: 'currentcolor', textDecoration: 'underline' }}>
                  Ver Comparação
                </button>
              )}
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <div className="card" style={{ borderLeft: '3px solid var(--error)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
                <span style={{ color: 'var(--error)', fontWeight: 600 }}>{parseError}</span>
              </div>
            </div>
          )}

        </div>

        {/* Right: Info, Status & Drafts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Smart Mapping Report (Only for comparison target) */}
          {selectedTable.startsWith('comparison') && analysis && <MappingReport analysis={analysis} />}

          {/* Column Hints */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <p className="label-sm" style={{ margin: 0 }}>Colunas Esperadas</p>
              <a
                href="/templates/template_metricas_ia.csv"
                download="template_metricas_ia.csv"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none',
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(0,226,238,0.08)', border: '1px solid rgba(0,226,238,0.2)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>download</span> Template CSV
              </a>
            </div>
            
            <div style={{ marginBottom: 'var(--space-2)' }}>
              {mapping.required.map(col => (
                <span key={col} className="badge badge-primary" style={{ fontSize: '0.6875rem', marginRight: 4 }}>✓ {col}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {mapping.optional.map(col => (
                <span key={col} className="badge badge-tertiary" style={{ fontSize: '0.6rem' }}>{col}</span>
              ))}
            </div>

            {selectedTable.startsWith('comparison') && (
              <div style={{ marginTop: 'var(--space-3)', padding: '8px', background: 'rgba(251,191,36,0.05)', borderRadius: '4px', border: '1px solid rgba(251,191,36,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: '0.8rem' }}>🧠</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--warning)' }}>IA de Análise Semântica Ativa</span>
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                  Nomes de colunas são detectados automaticamente (ex: "acurácia", "precisao" ou "accuracy" são válidos).
                </p>
              </div>
            )}
          </div>

          {/* DRAFTS - Saved Local Edits */}
          <div className="card">
            <h3 className="title-lg" style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>folder_open</span>
              Planilhas Salvas (Rascunhos)
            </h3>
            {localDrafts.length === 0 ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontStyle: 'italic', textAlign: 'center', padding: '16px' }}>
                Nenhum rascunho salvo.<br/>Faça o upload de uma planilha e clique em "Salvar Edição".
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {localDrafts.map(draft => (
                  <div key={draft.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--surface-container)', 
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--on-surface)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {draft.name}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>
                        {new Date(draft.date).toLocaleString('pt-BR')} • {draft.data.rowCount} linhas
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => loadDraft(draft)} title="Carregar na tela" className="btn" style={{ padding: 4, background: 'rgba(0,226,238,0.1)', color: 'var(--primary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>upload_file</span>
                      </button>
                      <button onClick={() => deleteDraft(draft.id)} title="Excluir" className="btn" style={{ padding: 4, background: 'rgba(255,113,108,0.1)', color: 'var(--error)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="card">
            <h3 className="title-lg" style={{ marginBottom: 'var(--space-3)' }}>Integridade do Sistema</h3>
            {[
              { label: 'Supabase Database', value: isSupabaseConfigured() ? 'Online' : 'Desconectado', color: isSupabaseConfigured() ? 'var(--success)' : 'var(--warning)', width: isSupabaseConfigured() ? 100 : 0 },
              { label: 'Storage Clínico (Cloud)', value: `${totalUsedMB} / ${maxStorageMB}MB`, color: storagePercentage > 80 ? 'var(--error)' : 'var(--primary)', width: storagePercentage },
            ].map((m, i) => (
              <div key={i} style={{ marginBottom: i === 0 ? 'var(--space-3)' : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="label-sm" style={{ fontSize: '0.7rem' }}>{m.label}</span>
                  <span style={{ fontWeight: 600, color: m.color, fontSize: '0.75rem' }}>{m.value}</span>
                </div>
                <div className="progress-bar" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${m.width}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
