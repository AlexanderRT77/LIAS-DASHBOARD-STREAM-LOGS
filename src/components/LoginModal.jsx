import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './LoginModal.css'

export default function LoginModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!email.toLowerCase().endsWith('@sou.unifal-mg.edu.br')) {
      setError('Apenas e-mails institucionais (@sou.unifal-mg.edu.br) são permitidos.')
      setLoading(false)
      return
    }

    try {
      if (mode === 'login') {
        await signIn(email, password)
        onClose?.()
      } else {
        await signUp(email, password, { full_name: name })
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <span className="material-symbols-outlined">shield_person</span>
          </div>
          <h2>{mode === 'login' ? 'Acesso Restrito' : 'Criar Conta'}</h2>
          <p>
            {mode === 'login'
              ? 'Entre para editar dados e fazer upload de planilhas.'
              : 'Crie uma conta para acessar a área administrativa.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {mode === 'register' && (
            <div className="form-field">
              <label htmlFor="auth-name">Nome Completo</label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dr. Nome Sobrenome"
                required
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@sou.unifal-mg.edu.br"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? (
              <span className="material-symbols-outlined spinning">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                  {mode === 'login' ? 'login' : 'person_add'}
                </span>
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </>
            )}
          </button>
        </form>

        <div className="modal-footer">
          {mode === 'login' ? (
            <p>Não tem conta? <button onClick={() => { setMode('register'); setError('') }}>Criar uma</button></p>
          ) : (
            <p>Já tem conta? <button onClick={() => { setMode('login'); setError('') }}>Fazer login</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
