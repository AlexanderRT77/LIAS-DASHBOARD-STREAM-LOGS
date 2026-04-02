import { useLocation } from 'react-router-dom'
import './TopBar.css'

const pageTitles = {
  '/':           'DASHBOARD GLOBAL',
  '/rankings':   'RANKINGS DE IA',
  '/pubmed':     'PUBMED & SCIELO',
  '/upload':     'GESTÃO DE DADOS',
  '/metricas':   'MÉTRICAS LIVE',
  '/comparacao': 'COMPARAÇÃO DE IAS',
  '/radar':      'RADAR DE NOVIDADES',
  '/historico':  'BASE HISTÓRICA',
}

export default function TopBar() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'DASHBOARD'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        <nav className="topbar-tabs">
          <button className="tab active">Visão Geral</button>
          <button className="tab">Benchmarks</button>
          <button className="tab">Relatórios</button>
        </nav>
      </div>
      <div className="topbar-right">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Buscar IA ou Categoria..."
            className="search-input"
            id="global-search"
          />
        </div>
        <button className="topbar-action" title="Notificações" id="btn-notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="topbar-action" title="Configurações" id="btn-settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  )
}
