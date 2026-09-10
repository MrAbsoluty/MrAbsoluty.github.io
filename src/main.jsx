import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FavoritesProvider } from './context/FavoritesContext'
import { AuthProvider } from './context/AuthContext'
import { testSupabaseConnection, isSupabaseConfigured } from './services/supabase.js'

if (import.meta.env.DEV) {
  window.testSupabaseConnection = testSupabaseConnection
  if (isSupabaseConfigured) {
    testSupabaseConnection()
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </AuthProvider>
  </StrictMode>,
)
