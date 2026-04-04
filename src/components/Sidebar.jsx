import { NavLink, useLocation } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { path: '/',           icon: 'dashboard',       label: 'Dashboard' },
  { path: '/rankings',   icon: 'leaderboard',     label: 'Rankings' },
  { path: '/pubmed',     icon: 'menu_book',       label: 'PubMed & SciELO' },
  { path: '/upload',     icon: 'upload_file',     label: 'Upload & Export' },
  { path: '/comparacao', icon: 'compare_arrows',  label: 'Comparação de IAs' },
  { path: '/avaliacao',  icon: 'gavel',           label: 'Painel Avaliativo' },
  { path: '/radar',      icon: 'new_releases',    label: 'Radar de Novidades' },
  { path: '/historico',  icon: 'history',         label: 'Base Histórica' },
  { path: '/registro',   icon: 'note_add',        label: 'Novo Registro' },
  { path: '/dashboard-alternativa', icon: 'view_in_ar', label: 'IA Benchmark 3D' },
]

export default function Sidebar({ user, onLogin, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <span className="material-symbols-outlined">verified</span>
        </div>
        <div className="brand-text">
          <span className="brand-name">Health Insights</span>
          <span className="brand-subtitle">IA Precision Analytics</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="nav-indicator" />
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        {user ? (
          <>
            <div className="user-avatar" style={{ background: 'rgba(0,226,238,0.15)', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
              <span className="user-name">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
              <span className="user-role">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              title="Sair"
              style={{
                width: 28, height: 28, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--on-surface-variant)', flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>logout</span>
            </button>
          </>
        ) : (
          <button
            onClick={onLogin}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              width: '100%', padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(0,226,238,0.06)',
              color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>login</span>
            Fazer Login
          </button>
        )}
      </div>
    </aside>
  )
}
