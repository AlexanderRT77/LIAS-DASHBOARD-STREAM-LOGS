const innovations = [
  { area: 'Robótica Cirúrgica', growth: '+34%', icon: 'precision_manufacturing', desc: 'Sistemas autônomos de assistência intra-operatória' },
  { area: 'Digital Twins', growth: '+28%', icon: 'hub', desc: 'Gêmeos digitais para simulação de pacientes' },
  { area: 'Drug Synth', growth: '+22%', icon: 'science', desc: 'Síntese molecular guiada por IA generativa' },
  { area: 'Wearable AI', growth: '+19%', icon: 'watch', desc: 'Monitoramento contínuo com inferência on-device' },
]

const modelAlerts = [
  {
    model: 'GPT-5 Medical',
    vendor: 'OpenAI',
    eta: 'Q3 2024',
    highlight: 'Raciocínio multi-etapa avançado para diagnóstico diferencial complexo',
    badge: 'Pré-Anúncio',
    badgeType: 'badge-warning',
  },
  {
    model: 'Claude 3.7 Opus',
    vendor: 'Anthropic',
    eta: 'Q2 2024',
    highlight: 'Melhorias significativas em conformidade HIPAA e trilha de auditoria',
    badge: 'Beta Fechado',
    badgeType: 'badge-tertiary',
  },
  {
    model: 'Gemini 2.0 Health',
    vendor: 'Google DeepMind',
    eta: 'Q4 2024',
    highlight: 'Integração nativa com FHIR R4 e processamento multimodal de imagens',
    badge: 'Roadmap',
    badgeType: 'badge-primary',
  },
  {
    model: 'Med-PaLM 3',
    vendor: 'Google Research',
    eta: 'Q1 2025',
    highlight: 'Acurácia projetada de 99.2% em ME Score com explicabilidade aprimorada',
    badge: 'Pesquisa',
    badgeType: 'badge-success',
  },
]

import { useState, useEffect } from 'react'

function timeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / 1000 / 60)
  
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h atrás`
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d atrás`
}

export default function Radar() {
  const [news, setNews] = useState([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorInfo, setErrorInfo] = useState('')

  const fetchNews = async (query = '(AI OR artificial intelligence) AND (health OR medical OR medicine OR clinical)') => {
    setLoadingNews(true)
    setErrorInfo('')
    try {
      // Usamos a ponte de API (/api/news) para contornar a trava de navegador do plano gratuito
      const res = await fetch(`/api/news?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      
      if (data.status === 'error') throw new Error(data.message)

      const formatted = (data.articles || []).filter(a => a.title && a.source?.name).map(a => ({
        title: a.title,
        source: a.source.name,
        time: timeAgo(a.publishedAt),
        url: a.url
      }))
      setNews(formatted)
    } catch (err) {
      console.error(err)
      setErrorInfo(`Erro NewsAPI: ${err.message}`)
    } finally {
      setLoadingNews(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleSearchNews = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) fetchNews(searchQuery)
    else fetchNews()
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Radar de Novidades</h2>
        <p className="page-description">
          Mapa de inovação e alertas sobre próximos modelos de IA para o ecossistema de saúde digital.
        </p>
      </div>

      {/* Innovation Map */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-8)' }}>
        {innovations.map((inn, i) => (
          <div key={i} className={`card animate-in animate-delay-${i + 1}`} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                background: 'rgba(0,226,238,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{inn.icon}</span>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.125rem' }}>{inn.growth}</span>
            </div>
            <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 'var(--space-1)' }}>{inn.area}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{inn.desc}</p>
          </div>
        ))}
      </div>

      {/* Model Alerts */}
      <div className="section-header">
        <div>
          <h3 className="section-title">Próximos Modelos</h3>
          <p className="section-subtitle">Alertas e roadmap de novos motores de IA clínica</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {modelAlerts.map((alert, i) => (
          <div key={i} className={`card animate-in`} style={{ animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{alert.model}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{alert.vendor} · ETA: {alert.eta}</p>
              </div>
              <span className={`badge ${alert.badgeType}`}>{alert.badge}</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
              {alert.highlight}
            </p>
          </div>
        ))}
      </div>

      {/* Trending News */}
      <div className="card animate-in" style={{ animationDelay: '0.6s', opacity: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 className="title-lg" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.25rem', marginRight: '8px' }}>trending_up</span>
            Notícias em Destaque
          </h3>
          
          <form onSubmit={handleSearchNews} style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: '300px', maxWidth: '500px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, color: 'var(--on-surface-variant)', fontSize: '1rem' }}>search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar notícias sobre IA..."
                style={{
                  width: '100%',
                  background: 'var(--surface-container-highest)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px 10px 36px',
                  color: 'var(--on-surface)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.boxShadow = '0 0 0 1px var(--primary-dim)'}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
            </div>
            <button type="submit" className="btn btn-outline" disabled={loadingNews} style={{ padding: '8px 16px', height: '37px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>sync</span>
              Atualizar
            </button>
          </form>
        </div>

        {errorInfo && (
          <div style={{ padding: 'var(--space-3)', background: 'rgba(255, 113, 108, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '0.8125rem' }}>
            {errorInfo}
          </div>
        )}

        {loadingNews ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined spinning" style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--space-2)' }}>progress_activity</span>
            Buscando notícias...
          </div>
        ) : news.length === 0 ? (
           <p style={{ color: 'var(--on-surface-variant)', textAlign: 'center', fontSize: '0.8125rem', padding: 'var(--space-4)' }}>Nenhuma notícia encontrada.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-4) 0',
                borderBottom: i < news.length - 1 ? '1px solid rgba(65,71,91,0.1)' : 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.2s',
                borderRadius: 'var(--radius-sm)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 226, 238, 0.04)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, padding: '0 8px' }}>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{item.source}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--outline)', whiteSpace: 'nowrap' }}>
                    {item.time}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--primary)' }}>open_in_new</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
