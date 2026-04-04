import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import LoginModal from './components/LoginModal'
import Dashboard from './pages/Dashboard'
import Rankings from './pages/Rankings'
import PubMed from './pages/PubMed'
import Upload from './pages/Upload'
import MetricasLive from './pages/MetricasLive'
import Comparacao from './pages/Comparacao'
import PainelAvaliativo from './pages/PainelAvaliativo'
import Radar from './pages/Radar'
import BaseHistorica from './pages/BaseHistorica'
import DashboardAlternativa from './pages/DashboardAlternativa'

export default function App() {
  const { user, signOut } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="app-layout">
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      <Sidebar user={user} onLogin={() => setShowLogin(true)} onLogout={signOut} />
      <div className="main-content">
        <TopBar user={user} onLogin={() => setShowLogin(true)} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/pubmed" element={<PubMed />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/metricas" element={<MetricasLive />} />
            <Route path="/comparacao" element={<Comparacao />} />
            <Route path="/avaliacao" element={<PainelAvaliativo />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/historico" element={<BaseHistorica />} />
            <Route path="/dashboard-alternativa" element={<DashboardAlternativa />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <button className="fab" title="Nova Ação">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  )
}
