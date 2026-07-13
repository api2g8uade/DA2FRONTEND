import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Activity, Loader2 } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export function SSOCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const ticket = params.get('ticket')
    const redirect = params.get('redirect') || '/mi-salud'

    // 1) Si ya vino redirigido desde backend con ?token=...
    if (token) {
      localStorage.setItem('token', token)
      navigate(redirect, { replace: true })
      return
    }

    // 2) Si vino con ?ticket=... canjeamos contra nuestro backend API /api/auth/sso
    if (ticket) {
      fetch(apiUrl(`/api/auth/sso?ticket=${encodeURIComponent(ticket)}&redirect=${encodeURIComponent(redirect)}`), {
        headers: {
          Accept: 'application/json'
        }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('No se pudo validar el ticket SSO del Core.')
          const data = await res.json()
          if (data && data.token) {
            localStorage.setItem('token', data.token)
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user))
            }
            navigate(redirect, { replace: true })
          } else {
            throw new Error('Respuesta inválida en SSO.')
          }
        })
        .catch((err) => {
          console.error('[SSOCallbackPage] Error:', err)
          setError(err.message || 'Falló la autenticación por SSO.')
        })
      return
    }

    setError('Falta parámetro token o ticket en la URL de SSO.')
  }, [location.search, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold">Autenticando vía Health Grid SSO</h1>
        {!error ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Verificando tu sesión centralizada...</span>
          </div>
        ) : (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-300 text-sm">
            <p className="font-semibold mb-1">Error de Autenticación SSO</p>
            <p>{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium text-sm transition"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
