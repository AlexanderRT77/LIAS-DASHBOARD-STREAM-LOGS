import { useState, useEffect, useCallback, useRef } from 'react'

// ── Mapeamento: slug da API → nome interno do projeto ──
const MODEL_SLUG_MAP = {
  'gemini-3-flash-reasoning': 'Gemini',
  'gemini-3-flash': 'Gemini',
  'claude-sonnet-4-6': 'Claude',
  'claude-sonnet-4-6-adaptive': 'Claude',
  'deepseek-v3-2-reasoning': 'DeepSeek',
  'deepseek-v3-2': 'DeepSeek',
  'grok-4-20': 'Grok',
  'grok-3': 'Grok',
  'sonar-reasoning-pro': 'Perplexity',
  'sonar-pro': 'Perplexity',
  'sonar-reasoning': 'Perplexity',
  'sonar': 'Perplexity',
  'r1-1776': 'Perplexity',
  'perplexity-sonar-pro': 'Perplexity',
  'perplexity-sonar': 'Perplexity',
}

// Nomes internos que buscamos da API (excluindo mock-only)
const API_MODELS = ['Gemini', 'Claude', 'DeepSeek', 'Grok', 'Perplexity']

// ── Dados mock para modelos que NÃO existem na API ──
const MOCK_MODELS = {
  Antigravity: {
    name: 'Antigravity',
    slug: 'antigravity',
    release_date: '2025-01-15',
    model_creator: { name: 'Antigravity Labs', slug: 'antigravity-labs' },
    evaluations: {
      artificial_analysis_intelligence_index: 52,
      artificial_analysis_coding_index: 48,
      gpqa: 0.91,
      hle: 0.35,
      scicode: 0.52,
      ifbench: 0.78,
      lcr: 0.71,
      terminalbench_hard: 0.45,
      tau2: 0.82,
      livecodebench: 0.76,
    },
    pricing: {
      price_1m_blended_3_to_1: 0,
      price_1m_input_tokens: 0,
      price_1m_output_tokens: 0,
    },
    median_output_tokens_per_second: 195,
    median_time_to_first_token_seconds: 0.8,
  },
  Manus: {
    name: 'Manus',
    slug: 'manus',
    release_date: '2025-03-01',
    model_creator: { name: 'Manus AI', slug: 'manus-ai' },
    evaluations: {
      artificial_analysis_intelligence_index: 38,
      artificial_analysis_coding_index: 32,
      gpqa: 0.68,
      hle: 0.12,
      scicode: 0.34,
      ifbench: 0.55,
      lcr: 0.42,
      terminalbench_hard: 0.18,
      tau2: 0.49,
      livecodebench: 0.41,
    },
    pricing: {
      price_1m_blended_3_to_1: 2.5,
      price_1m_input_tokens: 1.0,
      price_1m_output_tokens: 7.0,
    },
    median_output_tokens_per_second: 65,
    median_time_to_first_token_seconds: 2.1,
  },
  'Chat Z.Ai': {
    name: 'Chat Z.Ai',
    slug: 'chat-z-ai',
    release_date: '2024-08-20',
    model_creator: { name: 'Z.Ai Corp', slug: 'z-ai' },
    evaluations: {
      artificial_analysis_intelligence_index: 28,
      artificial_analysis_coding_index: 22,
      gpqa: 0.52,
      hle: 0.06,
      scicode: 0.24,
      ifbench: 0.42,
      lcr: 0.29,
      terminalbench_hard: 0.09,
      tau2: 0.31,
      livecodebench: 0.28,
    },
    pricing: {
      price_1m_blended_3_to_1: 0.8,
      price_1m_input_tokens: 0.3,
      price_1m_output_tokens: 2.0,
    },
    median_output_tokens_per_second: 110,
    median_time_to_first_token_seconds: 1.4,
  },
}

const CACHE_KEY = 'aa_api_cache'
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 horas

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch { /* localStorage full — ignore */ }
}

export function useArtificialAnalysis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const fetchedRef = useRef(false)

  const processApiData = useCallback((apiData) => {
    if (!apiData?.data || !Array.isArray(apiData.data)) return []

    const found = {}

    for (const model of apiData.data) {
      const internalName = MODEL_SLUG_MAP[model.slug]
      if (!internalName) continue

      if (!found[internalName]) {
        // Primeiro match — base
        found[internalName] = {
          ...model,
          name: internalName,
          _originalName: model.name,
          _source: 'api',
          evaluations: { ...model.evaluations },
          pricing: { ...model.pricing },
        }
      } else {
        // Merge: preencher campos null com dados de outras variantes
        const existing = found[internalName]

        // Merge evaluations — pegar o valor mais alto (não-null)
        if (model.evaluations) {
          for (const [key, val] of Object.entries(model.evaluations)) {
            if (val != null && (existing.evaluations[key] == null || val > existing.evaluations[key])) {
              existing.evaluations[key] = val
            }
          }
        }

        // Merge pricing — pegar valor != 0
        if (model.pricing) {
          for (const [key, val] of Object.entries(model.pricing)) {
            if (val && (!existing.pricing[key])) {
              existing.pricing[key] = val
            }
          }
        }

        // Merge speed/latency — pegar valor != 0
        if (model.median_output_tokens_per_second && !existing.median_output_tokens_per_second) {
          existing.median_output_tokens_per_second = model.median_output_tokens_per_second
        }
        if (model.median_time_to_first_token_seconds && !existing.median_time_to_first_token_seconds) {
          existing.median_time_to_first_token_seconds = model.median_time_to_first_token_seconds
        }
      }
    }

    // Adicionar modelos mock
    for (const [name, mockData] of Object.entries(MOCK_MODELS)) {
      if (!found[name]) {
        found[name] = { ...mockData, _source: 'mock' }
      }
    }

    // Ordenar: Antigravity primeiro, depois por intelligence index
    const allModels = Object.values(found)
    allModels.sort((a, b) => {
      if (a.name === 'Antigravity') return -1
      if (b.name === 'Antigravity') return 1
      const aScore = a.evaluations?.artificial_analysis_intelligence_index || 0
      const bScore = b.evaluations?.artificial_analysis_intelligence_index || 0
      return bScore - aScore
    })

    return allModels
  }, [])

  const fetchData = useCallback(async () => {
    // Tentar cache primeiro
    const cached = getCachedData()
    if (cached) {
      setData(processApiData(cached))
      setLastUpdated(new Date(JSON.parse(localStorage.getItem(CACHE_KEY))?.timestamp))
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Usa o proxy em ambos os ambientes:
      // Dev → Vite proxy reescreve para API real com headers
      // Prod → Vercel serverless function em /api/artificial-analysis.js
      const response = await fetch('/api/artificial-analysis')
      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const apiData = await response.json()
      setCachedData(apiData)
      setData(processApiData(apiData))
      setLastUpdated(new Date())
    } catch (err) {
      console.warn('[AA API] Fetch failed, using mock data:', err.message)
      setError(err.message)

      // Fallback: retornar apenas mocks
      const fallback = Object.values(MOCK_MODELS).map(m => ({ ...m, _source: 'mock' }))
      setData(fallback)
    } finally {
      setLoading(false)
    }
  }, [processApiData])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchData()
  }, [fetchData])

  return { data, loading, error, lastUpdated, refetch: fetchData }
}
