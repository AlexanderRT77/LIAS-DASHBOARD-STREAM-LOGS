// Vercel Serverless Function: Proxy para Artificial Analysis API
// Protege a API key no servidor, nunca exposta ao frontend
// Inclui retry com backoff para lidar com rate limits (429)

let cachedResponse = null
let cacheTimestamp = 0
const SERVER_CACHE_TTL = 6 * 60 * 60 * 1000 // 6 horas

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options)
    if (response.ok) return response
    if (response.status === 429 && i < retries - 1) {
      // Esperar antes de tentar de novo: 2s, 4s, 8s
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)))
      continue
    }
    return response // retorna o erro se não for 429 ou esgotou retries
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.AA_API_KEY
  if (!apiKey) {
    return res.status(500).json({ status: 'error', message: 'AA_API_KEY não configurada na Vercel.' })
  }

  // Verificar cache do servidor primeiro
  if (cachedResponse && (Date.now() - cacheTimestamp) < SERVER_CACHE_TTL) {
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600')
    res.setHeader('X-Cache', 'HIT')
    return res.status(200).json(cachedResponse)
  }

  try {
    const response = await fetchWithRetry(
      'https://artificialanalysis.ai/api/v2/data/llms/models',
      { headers: { 'x-api-key': apiKey } },
      3
    )

    if (!response.ok) {
      // Se temos cache antigo, usamos como fallback
      if (cachedResponse) {
        res.setHeader('X-Cache', 'STALE')
        return res.status(200).json(cachedResponse)
      }
      return res.status(response.status).json({
        status: 'error',
        message: `API retornou status ${response.status}`
      })
    }

    const data = await response.json()

    // Guardar em cache de memória do servidor
    cachedResponse = data
    cacheTimestamp = Date.now()

    // Cache por 6 horas no Vercel Edge
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600')
    res.setHeader('X-Cache', 'MISS')
    res.status(200).json(data)
  } catch (error) {
    // Fallback para cache antigo em caso de erro de rede
    if (cachedResponse) {
      res.setHeader('X-Cache', 'STALE-ERROR')
      return res.status(200).json(cachedResponse)
    }
    res.status(500).json({ status: 'error', message: error.message })
  }
}
