import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function DoomEasterEgg({ onClose }) {
  // Impede rolagem do dashboard principal enquanto o Doom está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 999999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div className="animate-in" style={{
        position: 'relative', width: '90vw', height: '85vh', maxWidth: 1000,
        backgroundColor: '#000', border: '1px solid var(--primary)',
        boxShadow: '0 0 50px rgba(0, 226, 238, 0.3)',
        borderRadius: 8, overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Barra Retrô do Sistema */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px', backgroundColor: '#111', borderBottom: '1px solid var(--primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', letterSpacing: 1 }}>
              C:\&gt; DOOM.EXE — MS-DOS EMULATOR VIA WEBASSEMBLY
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,113,108,0.1)', border: '1px solid var(--error)', 
            color: 'var(--error)', cursor: 'pointer', padding: '4px 12px',
            fontFamily: 'monospace', fontWeight: 700, borderRadius: 4, transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--error)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,113,108,0.1)'}
          >
            [X] ABORTAR SISTEMA
          </button>
        </div>

        {/* Emulador do Doom (WebAssembly nativo via Silent Space Marine) */}
        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <iframe 
            src="https://silentspacemarine.com/"
            style={{ width: '100%', height: '100%', border: 'none', background: '#000', pointerEvents: 'auto' }}
            allow="autoplay; fullscreen; keyboard"
            title="Doom Easter Egg"
          />
        </div>
      </div>
      
      <p style={{ marginTop: 24, color: 'var(--on-surface-variant)', fontSize: '0.8rem', fontFamily: 'monospace', width: '90vw', maxWidth: 1000, textAlign: 'center' }}>
        * <strong>Acesso Antecipado Sandeco Maestro</strong>: Por segurança, o sistema bloqueia os executáveis (.exe) nativos do seu Windows.<br/> 
        Para dar vida ao <em>Doom</em> dentro desta interface, um módulo WebAssembly foi carregado em tempo real, transpilando o motor DOS clássico para rodar a 60fps junto aos dados das IAs. Enjoy!
      </p>
    </div>,
    document.body
  )
}
