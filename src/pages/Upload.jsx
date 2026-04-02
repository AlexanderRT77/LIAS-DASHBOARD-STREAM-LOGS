import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { useAuth } from '../contexts/AuthContext'
import { useSupabaseData, useSupabaseInsert } from '../hooks/useSupabaseData'
import { isSupabaseConfigured } from '../lib/supabase'
import LoginModal from '../components/LoginModal'

const SUPPORTED_FORMATS = ['.CSV', '.TSV']
const TABLE_TARGETS = [
  { value: 'performance_metrics', label: 'Métricas de Performance', desc: 'Acurácia, latência, custo por modelo' },
  { value: 'diagnostic_records', label: 'Registros de Diagnóstico', desc: 'Histórico de diagnósticos clínicos' },
  { value: 'inference_logs', label: 'Logs de Inferência', desc: 'Registros de inferência em tempo real' },
]

const COLUMN_MAPPINGS = {
  performance_metrics: {
    required: ['model_id_or_name', 'category', 'accuracy'],
    optional: ['latency_ms', 'cost_per_1m_tokens', 'hallucination_rate', 'citation_rate', 'compliance_score', 'energy_rating'],
    example: 'model_name,category,accuracy,latency_ms,cost_per_1m_tokens\nGPT-4o Health,cardiologia,96.8,210,0.0150'
  },
  diagnostic_records: {
    required: ['record_id', 'model_name', 'specialty', 'confidence'],
    optional: ['status', 'notes', 'diagnosed_at'],
    example: 'record_id,model_name,specialty,confidence,status\nREC-3001,GPT-4o,Cardiologia,99.2,Concluído'
  },
  inference_logs: {
    required: ['inference_id', 'model_name', 'task'],
    optional: ['latency_ms', 'status', 'confidence'],
    example: 'inference_id,model_name,task,latency_ms,status,confidence\nINF-90001,Claude 3.5,Triagem,140,Active,98.8'
  },
}

export default function Upload() {
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedTable, setSelectedTable] = useState('performance_metrics')
  const [parsedData, setParsedData] = useState(null)
  const [parseError, setParseError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null) // null | 'uploading' | 'success' | 'error'
  const [uploadResult, setUploadResult] = useState(null)

  const { insert: insertData, loading: inserting } = useSupabaseInsert(selectedTable)
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
        const mapping = COLUMN_MAPPINGS[selectedTable]
        const missingRequired = mapping.required.filter(col => 
          !columns.some(c => c.toLowerCase().replace(/\s/g, '_') === col)
        )

        setParsedData({
          rows: results.data,
          columns,
          rowCount: results.data.length,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          missingRequired,
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

  const handleUpload = async () => {
    if (!user) {
      setShowLogin(true)
      return
    }

    if (!parsedData?.rows?.length) return

    setUploadStatus('uploading')

    try {
      // Normalizar nomes de colunas (lowercase + underscore)
      const normalizedRows = parsedData.rows.map(row => {
        const normalized = {}
        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          if (value !== null && value !== undefined && value !== '') {
            normalized[normalizedKey] = value
          }
        })
        // Adicionar created_by
        normalized.created_by = user.id
        return normalized
      })

      const { data, error } = await insertData(normalizedRows)

      if (error) {
        setUploadStatus('error')
        setUploadResult(`Erro: ${error}`)
        return
      }

      // Registrar upload
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
    } catch (err) {
      setUploadStatus('error')
      setUploadResult(`Erro inesperado: ${err.message}`)
    }
  }

  const mapping = COLUMN_MAPPINGS[selectedTable]

  return (
    <div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      <div className="page-header">
        <h2 className="page-title">Gestão de Dados</h2>
        <p className="page-description">
          Upload de datasets clínicos via CSV para alimentar os gráficos do dashboard. 
          Os dados são enviados diretamente para o Supabase e refletidos em tempo real.
        </p>
        {!user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            marginTop: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(251,191,36,0.08)', borderRadius: 'var(--radius-lg)',
            maxWidth: 'fit-content'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>lock</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--warning)' }}>
              <button onClick={() => setShowLogin(true)} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Faça login
              </button>{' '}para enviar planilhas e editar dados.
            </span>
          </div>
        )}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
            marginTop: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(74,222,128,0.08)', borderRadius: 'var(--radius-lg)',
            maxWidth: 'fit-content'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '1.2rem' }}>check_circle</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--success)' }}>
              Logado como <strong>{user.email}</strong>
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Left: Upload Zone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Table Selector */}
          <div className="card">
            <p className="label-sm" style={{ marginBottom: 'var(--space-3)' }}>Tabela de Destino</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {TABLE_TARGETS.map(t => (
                <label
                  key={t.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: selectedTable === t.value ? 'rgba(0,226,238,0.06)' : 'var(--surface-container-high)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    border: selectedTable === t.value ? '1px solid rgba(0,226,238,0.2)' : '1px solid transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="radio"
                    name="table-target"
                    value={t.value}
                    checked={selectedTable === t.value}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    style={{ accentColor: '#00e2ee' }}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.label}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{t.desc}</p>
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

        {/* Right: Column Mapping + Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Column Requirements */}
          <div className="card">
            <p className="label-sm" style={{ marginBottom: 'var(--space-3)' }}>Colunas Esperadas</p>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>Obrigatórias:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {mapping.required.map(col => (
                  <span key={col} className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                    {parsedData?.missingRequired?.includes(col) ? '❌' : '✓'} {col}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-2)' }}>Opcionais:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {mapping.optional.map(col => (
                  <span key={col} className="badge badge-tertiary" style={{ fontSize: '0.6875rem' }}>{col}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.6875rem', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>Exemplo CSV:</p>
              <pre style={{ fontSize: '0.6875rem', color: 'var(--primary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {mapping.example}
              </pre>
            </div>
          </div>

          {/* System Status */}
          {[
            { label: 'Supabase Connection', value: isSupabaseConfigured() ? 'Online' : 'Não configurado', color: isSupabaseConfigured() ? 'var(--success)' : 'var(--warning)', width: isSupabaseConfigured() ? 100 : 0 },
            { label: 'HIPAA Compliance', value: '100%', color: 'var(--success)', width: 100 },
            { label: 'Storage Used', value: '72%', color: 'var(--warning)', width: 72 },
          ].map((m, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <span className="label-sm">{m.label}</span>
                <span style={{ fontWeight: 700, color: m.color, fontSize: '0.875rem' }}>{m.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${m.width}%`, background: m.color }} />
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

      {/* Parsed Data Preview */}
      {parsedData && !parseError && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="section-header">
            <div>
              <h3 className="title-lg">Preview dos Dados</h3>
              <p className="chart-subtitle">
                {parsedData.rowCount} linhas · {parsedData.columns.length} colunas · {parsedData.fileSize}
                {parsedData.missingRequired?.length > 0 && (
                  <span style={{ color: 'var(--error)', marginLeft: '12px' }}>
                    ⚠️ Faltam colunas obrigatórias: {parsedData.missingRequired.join(', ')}
                  </span>
                )}
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={inserting || uploadStatus === 'uploading' || parsedData.missingRequired?.length > 0}
              style={{ minWidth: 180 }}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <span className="material-symbols-outlined spinning" style={{ fontSize: '1rem' }}>progress_activity</span>
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cloud_upload</span>
                  Enviar para Supabase
                </>
              )}
            </button>
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
                  {parsedData.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
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
