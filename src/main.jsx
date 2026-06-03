import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { supabase } from './lib/supabaseClient.js'

const ADMIN_FAKE_SESSION = {
  user: {
    email: 'admin@criollo.admin',
    user_metadata: { full_name: 'Admin Criollo' }
  }
};

function Root() {
  const [session,      setSession]      = useState(undefined)
  const [adminBypass,  setAdminBypass]  = useState(
    () => localStorage.getItem('criollo_admin_bypass') === '1'
  )

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (_event === 'SIGNED_OUT') {
        setAdminBypass(false)
        localStorage.removeItem('criollo_admin_bypass')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleBypassLogin = () => {
    localStorage.setItem('criollo_admin_bypass', '1')
    setAdminBypass(true)
  }

  // Prioridad: sesión real de Supabase > bypass admin > estado de Supabase (null/undefined)
  const effectiveSession = (session !== undefined && session !== null)
    ? session
    : adminBypass ? ADMIN_FAKE_SESSION : session

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            effectiveSession === undefined
              ? <div className="loading-screen" />
              : effectiveSession
                ? <Navigate to="/" replace />
                : <LoginPage onBypassLogin={handleBypassLogin} />
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute session={effectiveSession}>
              <App session={effectiveSession} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
