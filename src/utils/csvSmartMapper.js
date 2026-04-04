// ═══════════════════════════════════════════════════════════════
// CSV Smart Mapper — Agente Inteligente de Mapeamento Semântico
// ═══════════════════════════════════════════════════════════════
// Detecta, normaliza e distribui colunas CSV para os gráficos
// corretos da aba "Comparação de IAs" usando heurísticas semânticas.

const MODEL_ALIASES = {
  antigravity: 'Antigravity', anti: 'Antigravity', ag: 'Antigravity',
  claude: 'Claude', anthropic: 'Claude',
  gemini: 'Gemini', google: 'Gemini',
  deepseek: 'DeepSeek', deep_seek: 'DeepSeek',
  perplexity: 'Perplexity', pplx: 'Perplexity',
  grok: 'Grok', xai: 'Grok',
  manus: 'Manus',
  'chat z.ai': 'Chat Z.Ai', 'chat_z': 'Chat Z.Ai', chatzai: 'Chat Z.Ai',
  zai: 'Chat Z.Ai', 'z.ai': 'Chat Z.Ai', chatZ: 'Chat Z.Ai',
}

// Semantic aliases: maps user-friendly column names → canonical keys
const COLUMN_SEMANTICS = {
  // → accuracy (0-100)
  accuracy:     { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },
  acuracia:     { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },
  precisao:     { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },
  precisão:     { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },
  acc:          { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },
  acuracy:      { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },
  score:        { canonical: 'accuracy', chart: 'benchmark', label: 'Acurácia (%)' },

  // → latency (seconds)
  latency:      { canonical: 'latency', chart: 'benchmark', label: 'Latência (s)' },
  latencia:     { canonical: 'latency', chart: 'benchmark', label: 'Latência (s)' },
  latência:     { canonical: 'latency', chart: 'benchmark', label: 'Latência (s)' },
  latency_s:    { canonical: 'latency', chart: 'benchmark', label: 'Latência (s)' },
  latency_ms:   { canonical: 'latency_ms', chart: 'benchmark', label: 'Latência (ms)' },
  response_time:{ canonical: 'latency', chart: 'benchmark', label: 'Latência (s)' },
  tempo_resposta:{ canonical: 'latency', chart: 'benchmark', label: 'Latência (s)' },

  // → reasoning (0-100)
  reasoning:     { canonical: 'reasoning', chart: 'table', label: 'Raciocínio Clínico (%)' },
  raciocinio:    { canonical: 'reasoning', chart: 'table', label: 'Raciocínio Clínico (%)' },
  raciocínio:    { canonical: 'reasoning', chart: 'table', label: 'Raciocínio Clínico (%)' },
  logic:         { canonical: 'reasoning', chart: 'table', label: 'Raciocínio Clínico (%)' },

  // → extraction (0-100)
  extraction:    { canonical: 'extraction', chart: 'table', label: 'Extração de Dados (%)' },
  extracao:      { canonical: 'extraction', chart: 'table', label: 'Extração de Dados (%)' },
  extração:      { canonical: 'extraction', chart: 'table', label: 'Extração de Dados (%)' },
  data_extraction: { canonical: 'extraction', chart: 'table', label: 'Extração de Dados (%)' },

  // → cost (USD string)
  cost:          { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },
  custo:         { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },
  price:         { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },
  preco:         { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },
  preço:         { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },
  cost_per_1m_tokens: { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },
  valor:         { canonical: 'cost', chart: 'table', label: 'Custo por 1M tokens (USD)' },

  // → compliance (string %)
  compliance:    { canonical: 'compliance', chart: 'table', label: 'Conformidade (%)' },
  conformidade:  { canonical: 'compliance', chart: 'table', label: 'Conformidade (%)' },
  compliance_score: { canonical: 'compliance', chart: 'table', label: 'Conformidade (%)' },

  // → Radar attributes (0-100)
  criatividade:  { canonical: 'Criatividade', chart: 'radar', label: 'Criatividade (0-100)' },
  creativity:    { canonical: 'Criatividade', chart: 'radar', label: 'Criatividade (0-100)' },
  confiabilidade:{ canonical: 'Confiabilidade', chart: 'radar', label: 'Confiabilidade (0-100)' },
  reliability:   { canonical: 'Confiabilidade', chart: 'radar', label: 'Confiabilidade (0-100)' },
  usabilidade:   { canonical: 'Usabilidade', chart: 'radar', label: 'Usabilidade (0-100)' },
  usability:     { canonical: 'Usabilidade', chart: 'radar', label: 'Usabilidade (0-100)' },
  seguranca:     { canonical: 'Segurança', chart: 'radar', label: 'Segurança (0-100)' },
  segurança:     { canonical: 'Segurança', chart: 'radar', label: 'Segurança (0-100)' },
  security:      { canonical: 'Segurança', chart: 'radar', label: 'Segurança (0-100)' },
  safety:        { canonical: 'Segurança', chart: 'radar', label: 'Segurança (0-100)' },
  potencial_saude: { canonical: 'Potencial Saúde', chart: 'radar', label: 'Potencial na Saúde (0-100)' },
  health:        { canonical: 'Potencial Saúde', chart: 'radar', label: 'Potencial na Saúde (0-100)' },
  saude:         { canonical: 'Potencial Saúde', chart: 'radar', label: 'Potencial na Saúde (0-100)' },
  saúde:         { canonical: 'Potencial Saúde', chart: 'radar', label: 'Potencial na Saúde (0-100)' },
  health_potential: { canonical: 'Potencial Saúde', chart: 'radar', label: 'Potencial na Saúde (0-100)' },

  // → model name (identifier)
  model_name:     { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },
  model:          { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },
  modelo:         { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },
  nome:           { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },
  name:           { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },
  ia:             { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },
  model_id_or_name: { canonical: 'model_name', chart: 'identifier', label: 'Nome do modelo' },

  // → status
  status:        { canonical: 'status', chart: 'table', label: 'Status' },
}

const CHART_DESCRIPTIONS = {
  benchmark: '📊 Acurácia vs Latência (gráfico de barras)',
  table: '📋 Tabela de Métricas Detalhadas',
  radar: '🎯 Radar de Atributos Clínicos (6 eixos)',
  identifier: '🏷️ Identificação do modelo',
}

/**
 * Normalize a column header for semantic matching
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Resolve model name from user input using aliases
 */
function resolveModelName(raw) {
  if (!raw) return null
  const key = String(raw).toLowerCase().trim()
  if (MODEL_ALIASES[key]) return MODEL_ALIASES[key]
  // Fuzzy: check if any alias is contained
  for (const [alias, canonical] of Object.entries(MODEL_ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) return canonical
  }
  // Capitalize if unknown model
  return String(raw).trim()
}

/**
 * Main analysis function — the "intelligent agent"
 * @param {string[]} headers - CSV column headers
 * @param {object[]} rows - Parsed CSV rows
 * @param {object} options - Options { targetModel?: string }
 * @returns {{ mappings, unmapped, chartTargets, processedData, report, error }}
 */
export function analyzeCSV(headers, rows, options = {}) {
  const { targetModel } = options;
  const mappings = []       // { original, canonical, chart, label }
  const unmapped = []       // { header, reason }
  const chartTargets = new Set()

  // Phase 1: Map each header
  for (const header of headers) {
    const normalized = normalizeHeader(header)
    const match = COLUMN_SEMANTICS[normalized]

    if (match) {
      mappings.push({ original: header, ...match })
      chartTargets.add(match.chart)
    } else {
      // Phase 2: Fuzzy semantic matching (check substrings)
      let found = false
      for (const [key, value] of Object.entries(COLUMN_SEMANTICS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          mappings.push({ original: header, ...value, fuzzy: true })
          chartTargets.add(value.chart)
          found = true
          break
        }
      }
      if (!found) {
        unmapped.push({ header, reason: 'Coluna não reconhecida pelo mapeador semântico' })
      }
    }
  }

  // Phase 3: Process data
  const hasModelCol = mappings.find(m => m.canonical === 'model_name')
  if (!hasModelCol && !targetModel) {
    return {
      mappings, unmapped, chartTargets: [...chartTargets],
      processedData: null,
      error: 'Nenhuma coluna de nome do modelo encontrada. O CSV precisa ter uma coluna "model_name" ou você deve selecionar uma IA específica para atualizar.',
      report: null,
    }
  }

  const processedData = {
    benchmarkData: [],
    comparisonTable: [],
    radarUpdates: {},
  }

  for (const row of rows) {
    // If we have a model column, read it. Else fallback to the targetModel.
    const modelRaw = hasModelCol ? row[hasModelCol.original] : targetModel
    let modelName = resolveModelName(modelRaw)
    
    // If a target model is enforced, validate
    if (targetModel) {
      if (modelName && modelName.toLowerCase() !== targetModel.toLowerCase()) {
        return {
          mappings, unmapped, chartTargets: [...chartTargets],
          processedData: null,
          error: `ALERTA DE SEGURANÇA: Você selecionou para atualizar apenas "${targetModel}", mas o arquivo contém dados da IA "${modelName}". A operação foi rejeitada para proteger a integridade dos dados.`,
          report: null,
        }
      }
      // Force model name to target model if empty/undefined
      modelName = targetModel;
    }

    if (!modelName) continue

    // Benchmark (accuracy + latency)
    const accMap = mappings.find(m => m.canonical === 'accuracy')
    const latMap = mappings.find(m => m.canonical === 'latency' || m.canonical === 'latency_ms')

    if (accMap || latMap) {
      let latency = 0
      if (latMap) {
        latency = parseFloat(row[latMap.original]) || 0
        if (latMap.canonical === 'latency_ms') latency = latency / 1000
      }
      processedData.benchmarkData.push({
        name: modelName,
        accuracy: accMap ? (parseFloat(row[accMap.original]) || 0) : 0,
        latency,
      })
    }

    // Table data
    const reasonMap = mappings.find(m => m.canonical === 'reasoning')
    const extractMap = mappings.find(m => m.canonical === 'extraction')
    const costMap = mappings.find(m => m.canonical === 'cost')
    const compliMap = mappings.find(m => m.canonical === 'compliance')
    const statusMap = mappings.find(m => m.canonical === 'status')

    if (reasonMap || extractMap || costMap || compliMap) {
      const costVal = costMap ? row[costMap.original] : '—'
      const costStr = typeof costVal === 'number' ? `$${costVal.toFixed(2)}` :
                      String(costVal).startsWith('$') ? costVal : `$${costVal}`

      processedData.comparisonTable.push({
        model: modelName,
        reasoning: reasonMap ? (parseFloat(row[reasonMap.original]) || 0) : 0,
        extraction: extractMap ? (parseFloat(row[extractMap.original]) || 0) : 0,
        cost: costStr,
        compliance: compliMap ? `${parseFloat(row[compliMap.original]) || 0}%` : '—',
        status: statusMap ? row[statusMap.original] : 'Ativo',
      })
    }

    // Radar updates
    const radarKeys = ['Criatividade', 'Confiabilidade', 'Usabilidade', 'Segurança', 'Potencial Saúde']
    for (const rk of radarKeys) {
      const rMap = mappings.find(m => m.canonical === rk)
      if (rMap) {
        if (!processedData.radarUpdates[rk]) processedData.radarUpdates[rk] = {}
        processedData.radarUpdates[rk][modelName] = parseFloat(row[rMap.original]) || 0
      }
    }
    // Reasoning also maps to radar
    if (reasonMap) {
      if (!processedData.radarUpdates['Raciocínio']) processedData.radarUpdates['Raciocínio'] = {}
      processedData.radarUpdates['Raciocínio'][modelName] = parseFloat(row[reasonMap.original]) || 0
    }
  }

  // Phase 4: Generate report
  const report = {
    totalColumns: headers.length,
    mappedColumns: mappings.length,
    unmappedColumns: unmapped.length,
    modelsFound: [...new Set(processedData.benchmarkData.map(d => d.name))].length || [...new Set(processedData.comparisonTable.map(d => d.model))].length,
    chartsAffected: [...chartTargets].filter(c => c !== 'identifier'),
    fuzzyMatches: mappings.filter(m => m.fuzzy).length,
    summary: [],
  }

  if (processedData.benchmarkData.length > 0) {
    report.summary.push(`📊 ${processedData.benchmarkData.length} modelos → Acurácia vs Latência`)
  }
  if (processedData.comparisonTable.length > 0) {
    report.summary.push(`📋 ${processedData.comparisonTable.length} modelos → Tabela de Desempenho`)
  }
  if (Object.keys(processedData.radarUpdates).length > 0) {
    const axisCount = Object.keys(processedData.radarUpdates).length
    report.summary.push(`🎯 ${axisCount} eixo(s) → Radar de Atributos Clínicos`)
  }
  if (unmapped.length > 0) {
    report.summary.push(`⚠️ ${unmapped.length} coluna(s) ignorada(s): ${unmapped.map(u => u.header).join(', ')}`)
  }

  return { mappings, unmapped, chartTargets: [...chartTargets], processedData, error: null, report }
}

export { CHART_DESCRIPTIONS, COLUMN_SEMANTICS, MODEL_ALIASES }
