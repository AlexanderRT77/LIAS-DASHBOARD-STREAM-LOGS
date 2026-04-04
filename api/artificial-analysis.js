// Vercel Serverless Function: Proxy para Artificial Analysis API
// Protege a API key no servidor, nunca exposta ao frontend

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

  try {
    const response = await fetch('https://artificialanalysis.ai/api/v2/data/llms/models', {
      headers: { 'x-api-key': apiKey },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        status: 'error',
        message: `API retornou status ${response.status}`
      })
    }

    const data = await response.json()

    // Cache por 6 horas no Vercel Edge
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600')
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}
