import { useState } from 'react'

const trendTopics = [
  'NLP em Saúde', 'Deep Learning', 'EHR', 'Diagnóstico por IA', 'Telemedicina',
  'Computer Vision', 'Drug Discovery', 'Genômica', 'Wearables', 'Patologia Digital',
  'Radiômica', 'Bioinformática', 'Epidemiologia Computacional', 'Robótica Cirúrgica',
]

const staticPublications = [
  {
    title: 'GPT-4o aplicado em triagem emergencial: estudo multicêntrico',
    journal: 'The Lancet Digital Health',
    authors: 'Zhang et al., 2024',
    model: 'GPT-4o',
    impact: 'Alto Impacto',
    citations: 142,
    date: 'Mar 2024',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    title: 'Claude 3.5 na análise de laudos radiológicos com benchmark MIMIC-IV',
    journal: 'Nature Medicine',
    authors: 'Chen, Williams & Park',
    model: 'Claude 3.5',
    impact: 'Referência',
    citations: 89,
    date: 'Fev 2024',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    title: 'Med-PaLM 2 vs. especialistas em diagnóstico diferencial oncológico',
    journal: 'JAMA Network Open',
    authors: 'Singhal et al.',
    model: 'Med-PaLM 2',
    impact: 'Alto Impacto',
    citations: 217,
    date: 'Jan 2024',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    title: 'Llama 3 fine-tuned para extração de entidades clínicas em prontuários',
    journal: 'BMJ Open',
    authors: 'Rodriguez & Lee',
    model: 'Llama 3',
    impact: 'Moderado',
    citations: 45,
    date: 'Jan 2024',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
]

export default function PubMed() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    
    try {
      // 1. Fetch IDs from NCBI E-utilities
      const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmode=json&retmax=10`)
      const searchData = await searchRes.json()
      const ids = searchData?.esearchresult?.idlist || []

      if (ids.length === 0) {
        setSearchResults([])
        setLoading(false)
        return
      }

      // 2. Fetch specific details for those IDs
      const summaryRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`)
      const summaryData = await summaryRes.json()
      const results = summaryData?.result || {}

      const formattedResults = ids.map(id => {
        const item = results[id]
        if (!item) return null

        let authorsArr = []
        if (item.authors && Array.isArray(item.authors)) {
          authorsArr = item.authors.map(a => a.name)
        }
        let authorText = authorsArr.length > 2 ? `${authorsArr[0]} et al.` : authorsArr.join(', ')
        if (!authorText) authorText = 'Autores desconhecidos'

        // Data extract
        let dateText = item.pubdate || 'Data N/A'
        if (dateText.length > 8) dateText = dateText.split(' ')[0]

        return {
          title: item.title || 'Sem título',
          journal: item.source || 'PubMed',
          authors: authorText,
          model: 'PubMed',
          impact: 'Público',
          citations: '-',
          date: dateText,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
        }
      }).filter(Boolean)

      setSearchResults(formattedResults)
    } catch (err) {
      console.error(err)
      setError('Falha ao buscar no PubMed. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setSearchResults(null)
    setError('')
  }

  const renderList = searchResults !== null ? searchResults : staticPublications

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Integração Acadêmica</h2>
        <p className="page-description">
          Monitoramento de publicações científicas e tendências em IA aplicada à saúde. 
          Dados agregados de PubMed, SciELO e bases clínicas internacionais.
        </p>
      </div>

      {/* Trend Cloud */}
      <div className="card animate-in animate-delay-1" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 className="title-lg">Tendências em Pesquisa Clínica</h3>
            <p className="chart-subtitle">Nuvem de tópicos com maior crescimento nos últimos 90 dias</p>
          </div>
        </div>
        <div className="tag-cloud">
          {trendTopics.map((topic, i) => (
            <span
              key={i}
              className="tag"
              style={{
                fontSize: `${0.75 + Math.random() * 0.5}rem`,
                color: i < 3 ? 'var(--primary)' : i < 7 ? 'var(--tertiary)' : 'var(--on-surface-variant)',
                fontWeight: i < 3 ? 700 : 500,
                cursor: 'pointer'
              }}
              onClick={() => {
                setSearchQuery(topic)
                setTimeout(() => handleSearch(), 50)
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Publications Header */}
      <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h3 className="section-title">Publicações Recentes</h3>
          <p className="section-subtitle">Estudos relevantes envolvendo modelos de IA em saúde</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ 
        display: 'flex', gap: 'var(--space-3)', 
        marginBottom: 'var(--space-6)', 
        background: 'var(--surface-container-high)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, color: 'var(--on-surface-variant)' }}>search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar publicações, autores ou tópicos no PubMed..."
            style={{
              width: '100%',
              background: 'var(--surface-container-highest)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px 12px 48px',
              color: 'var(--on-surface)',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'box-shadow 0.2s',
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--primary-dim)'}
            onBlur={(e) => e.target.style.boxShadow = 'none'}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 120, justifyContent: 'center' }}>
          {loading ? (
            <span className="material-symbols-outlined spinning">progress_activity</span>
          ) : (
            'Pesquisar'
          )}
        </button>
        {searchResults !== null && (
          <button type="button" onClick={handleClear} className="btn btn-outline" style={{ minWidth: 100, justifyContent: 'center' }}>
            Limpar
          </button>
        )}
      </form>

      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--error)', marginBottom: 'var(--space-6)', padding: 'var(--space-3)' }}>
          <span style={{ color: 'var(--error)' }}>{error}</span>
        </div>
      )}

      {/* Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {searchResults !== null && renderList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--outline)', marginBottom: 'var(--space-3)' }}>search_off</span>
            <p style={{ color: 'var(--on-surface-variant)' }}>Nenhuma publicação encontrada para "{searchQuery}"</p>
          </div>
        ) : (
          renderList.map((pub, i) => (
            <a 
              key={i} 
              href={pub.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`card animate-in animate-delay-${Math.min(i + 1, 4)}`} 
              style={{ 
                display: 'block', 
                textDecoration: 'none', 
                color: 'inherit',
                transition: 'all 0.2s ease',
                border: '1px solid var(--outline-variant)'
              }}
              onMouseEnter={(e) => {
                 e.currentTarget.style.borderColor = 'var(--primary-dim)'
                 e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                 e.currentTarget.style.borderColor = 'var(--outline-variant)'
                 e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.4, marginBottom: 'var(--space-2)' }}>
                    {pub.title}
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
                    {pub.journal} · {pub.authors}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, marginLeft: 'var(--space-4)' }}>
                  <span className="badge badge-primary">{pub.model}</span>
                  <span className={`badge ${pub.impact === 'Alto Impacto' || pub.impact === 'Referência' ? 'badge-success' : 'badge-tertiary'}`}>
                    {pub.impact}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)', alignSelf: 'center', marginLeft: 8 }}>
                    open_in_new
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>format_quote</span>
                  {pub.citations} citações
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>calendar_today</span>
                  {pub.date}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
