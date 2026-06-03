import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage({ onBypassLogin }) {
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [user,        setUser]        = useState('');
  const [pass,        setPass]        = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [errPass,     setErrPass]     = useState(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  function handlePassLogin(e) {
    e.preventDefault();
    setErrPass(null);
    setLoadingPass(true);

    setTimeout(() => {
      if (user.trim() === 'criolloadmin' && pass === 'criolloadmin2026') {
        onBypassLogin?.();
      } else {
        setErrPass('Usuario o contraseña incorrectos');
      }
      setLoadingPass(false);
    }, 400);
  }

  const inp = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#F0EBE3',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">C</div>
        <h1 className="login-title">Criollo</h1>
        <p className="login-subtitle">Portal de Franquicias</p>

        {/* Google OAuth */}
        <button className="login-btn" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? (
            <span style={{ opacity: 0.7 }}>Redirigiendo...</span>
          ) : (
            <>
              <svg className="login-google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Iniciar sesión con Google
            </>
          )}
        </button>

        {error && (
          <p style={{ color: '#E53935', fontSize: '0.8rem', textAlign: 'center', marginTop: 8 }}>
            Error: {error}
          </p>
        )}

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 4px', width: '100%' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>o</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Usuario / Contraseña */}
        <form onSubmit={handlePassLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <input
            style={inp}
            type="text"
            placeholder="Usuario"
            value={user}
            onChange={e => setUser(e.target.value)}
            autoComplete="username"
          />
          <input
            style={inp}
            type="password"
            placeholder="Contraseña"
            value={pass}
            onChange={e => setPass(e.target.value)}
            autoComplete="current-password"
          />
          {errPass && (
            <p style={{ color: '#E53935', fontSize: '0.8rem', textAlign: 'center', margin: '0' }}>
              {errPass}
            </p>
          )}
          <button
            type="submit"
            disabled={loadingPass || !user || !pass}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: loadingPass ? 'rgba(192,92,62,0.6)' : 'var(--accent-terracotta)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: loadingPass || !user || !pass ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: !user || !pass ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loadingPass ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <p className="login-footer" style={{ marginTop: 20 }}>OptiCore · Sistema de Gestión</p>
      </div>
    </div>
  );
}
