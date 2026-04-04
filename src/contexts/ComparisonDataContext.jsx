import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'lias_comparison_data'
const STORAGE_META_KEY = 'lias_comparison_meta'

// ═══════════ DEFAULT MOCK DATA (fallback) ═══════════
const DEFAULT_BENCHMARK = [
  { name: 'Gemini', accuracy: 93.0, latency: 0.7 },
  { name: 'Claude', accuracy: 95.0, latency: 1.1 },
  { name: 'DeepSeek', accuracy: 88.0, latency: 1.8 },
  { name: 'Grok', accuracy: 85.0, latency: 0.6 },
  { name: 'Perplexity', accuracy: 88.0, latency: 3.5 },
  { name: 'Manus', accuracy: 85.0, latency: 4.5 },
  { name: 'Antigravity', accuracy: 97.0, latency: 2.0 },
  { name: 'Chat Z.Ai', accuracy: 78.0, latency: 0.4 },
]

const DEFAULT_LATENCY_TIMELINE = [
  { time: '04:00', Gemini: 70, Claude: 110, DeepSeek: 180, Grok: 60, Perplexity: 350, Manus: 450, Antigravity: 200, 'Chat Z.Ai': 40 },
  { time: '08:00', Gemini: 75, Claude: 115, DeepSeek: 185, Grok: 65, Perplexity: 360, Manus: 460, Antigravity: 210, 'Chat Z.Ai': 45 },
  { time: '12:00', Gemini: 90, Claude: 130, DeepSeek: 200, Grok: 80, Perplexity: 380, Manus: 480, Antigravity: 230, 'Chat Z.Ai': 55 },
  { time: '16:00', Gemini: 85, Claude: 125, DeepSeek: 190, Grok: 75, Perplexity: 370, Manus: 470, Antigravity: 220, 'Chat Z.Ai': 50 },
  { time: '20:00', Gemini: 72, Claude: 112, DeepSeek: 182, Grok: 62, Perplexity: 355, Manus: 455, Antigravity: 205, 'Chat Z.Ai': 42 },
]

const DEFAULT_COMPARISON_TABLE = [
  { model: 'Antigravity', reasoning: 98.0, extraction: 99.0, cost: '$0.00', compliance: '99.9%', status: 'Ativo' },
  { model: 'Claude', reasoning: 96.0, extraction: 95.0, cost: '$3.00', compliance: '98.0%', status: 'Ativo' },
  { model: 'Gemini', reasoning: 93.0, extraction: 94.0, cost: '$1.25', compliance: '92.0%', status: 'Ativo' },
  { model: 'Perplexity', reasoning: 82.0, extraction: 97.0, cost: '$2.00', compliance: '90.0%', status: 'Ativo' },
  { model: 'DeepSeek', reasoning: 91.0, extraction: 88.0, cost: '$0.14', compliance: '82.0%', status: 'Ativo' },
  { model: 'Manus', reasoning: 90.0, extraction: 85.0, cost: '$5.00', compliance: '80.0%', status: 'Ativo' },
  { model: 'Grok', reasoning: 88.0, extraction: 84.0, cost: '$1.50', compliance: '75.0%', status: 'Ativo' },
  { model: 'Chat Z.Ai', reasoning: 78.0, extraction: 76.0, cost: '$0.50', compliance: '80.0%', status: 'Pendente' },
]

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const meta = localStorage.getItem(STORAGE_META_KEY)
    if (raw) {
      return {
        data: JSON.parse(raw),
        meta: meta ? JSON.parse(meta) : null,
        isCustom: true,
      }
    }
  } catch { /* ignore corrupted data */ }
  return null
}

function saveToStorage(data, meta) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta))
  } catch { /* storage full */ }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_META_KEY)
}

const ComparisonDataContext = createContext()

export function ComparisonDataProvider({ children }) {
  const stored = loadFromStorage()

  const [benchmarkData, setBenchmarkData] = useState(
    stored?.data?.benchmarkData || DEFAULT_BENCHMARK
  )
  const [latencyTimeline, setLatencyTimeline] = useState(
    stored?.data?.latencyTimeline || DEFAULT_LATENCY_TIMELINE
  )
  const [comparisonTable, setComparisonTable] = useState(
    stored?.data?.comparisonTable || DEFAULT_COMPARISON_TABLE
  )
  const [isCustomData, setIsCustomData] = useState(stored?.isCustom || false)
  const [uploadMeta, setUploadMeta] = useState(stored?.meta || null)

  /**
   * Update data from CSV analysis results
   * Called by Upload page after csvSmartMapper processes the file
   */
  const updateFromCSV = useCallback((processedData, report, targetModel = null) => {
    const newData = {}
    const meta = {
      uploadedAt: new Date().toISOString(),
      modelsCount: report.modelsFound,
      chartsAffected: report.chartsAffected,
      summary: report.summary,
      targetModel: targetModel,
    }

    const mergeArray = (currentArray, incomingArray, keyField) => {
      if (!incomingArray || incomingArray.length === 0) return currentArray;
      if (!targetModel) return incomingArray; // Global update: replace entirely
      
      const updated = [...currentArray];
      for (const incomingItem of incomingArray) {
        const index = updated.findIndex(item => item[keyField].toLowerCase() === incomingItem[keyField].toLowerCase());
        if (index >= 0) {
          updated[index] = { ...updated[index], ...incomingItem };
        } else {
          updated.push(incomingItem);
        }
      }
      return updated;
    }

    // Update benchmark if available
    if (processedData.benchmarkData?.length > 0) {
      const newBenchmark = mergeArray(benchmarkData, processedData.benchmarkData, 'name');
      setBenchmarkData(newBenchmark)
      newData.benchmarkData = newBenchmark

      // Recompute synthetic latency timeline from the new benchmark data
      const newTimeline = ['04:00', '08:00', '12:00', '16:00', '20:00'].map((time, idx) => {
        const row = { time }
        const variance = [0, 0.05, 0.15, 0.1, 0.02] // daily usage pattern
        newBenchmark.forEach(m => {
          const baseLatency = m.latency * 1000 // convert to ms
          row[m.name] = Math.round(baseLatency * (1 + variance[idx] * (Math.random() * 0.5 + 0.75)))
        })
        return row
      })
      setLatencyTimeline(newTimeline)
      newData.latencyTimeline = newTimeline
    } else {
      newData.benchmarkData = benchmarkData
      newData.latencyTimeline = latencyTimeline
    }

    // Update comparison table if available  
    if (processedData.comparisonTable?.length > 0) {
      const newComparison = mergeArray(comparisonTable, processedData.comparisonTable, 'model');
      setComparisonTable(newComparison)
      newData.comparisonTable = newComparison
    } else {
      newData.comparisonTable = comparisonTable
    }

    setIsCustomData(true)
    setUploadMeta(meta)
    saveToStorage(newData, meta)

    return meta
  }, [benchmarkData, latencyTimeline, comparisonTable])

  /**
   * Reset all data to default mocks
   */
  const resetToDefaults = useCallback(() => {
    setBenchmarkData(DEFAULT_BENCHMARK)
    setLatencyTimeline(DEFAULT_LATENCY_TIMELINE)
    setComparisonTable(DEFAULT_COMPARISON_TABLE)
    setIsCustomData(false)
    setUploadMeta(null)
    clearStorage()
  }, [])

  return (
    <ComparisonDataContext.Provider value={{
      benchmarkData,
      latencyTimeline,
      comparisonTable,
      isCustomData,
      uploadMeta,
      updateFromCSV,
      resetToDefaults,
    }}>
      {children}
    </ComparisonDataContext.Provider>
  )
}

export function useComparisonData() {
  const ctx = useContext(ComparisonDataContext)
  if (!ctx) throw new Error('useComparisonData must be used within ComparisonDataProvider')
  return ctx
}
