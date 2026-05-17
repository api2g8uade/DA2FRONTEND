import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { Activity, Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/src/context/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, login, loginDemo } = useAuth()
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(dni, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate('/mi-salud')
  }

  const handleDemo = async () => {
    await loginDemo()
    navigate('/mi-salud')
  }

  if (user) return <Navigate to="/mi-salud" replace />

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-sidebar p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-2xl font-bold text-sidebar-foreground">Health Grid</span>
        </div>

        <div className="space-y-6">
          <p className="font-serif text-4xl font-bold text-sidebar-foreground text-balance leading-tight">
            Tu salud, en la palma de tu mano.
          </p>
          <p className="text-sidebar-foreground/60 leading-relaxed text-sm">
            Accedé a tus turnos, resultados de laboratorio, recetas y teleconsultas médicas desde un
            solo portal seguro y unificado.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '48k+', label: 'Pacientes activos' },
              { value: '320+', label: 'Profesionales' },
              { value: '99.9%', label: 'Disponibilidad' },
              { value: 'ISO 27001', label: 'Certificación' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-sidebar-accent rounded-xl p-4">
                <p className="font-serif text-xl font-bold text-sidebar-foreground">{value}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/30">© 2026 Health Grid · HIPAA Compliant · Ley 25.326</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">Health Grid</span>
        </div>

        <Card className="w-full max-w-md border-border shadow-none">
          <CardContent className="p-8">
            <div className="mb-8">
              <h1 className="font-serif text-2xl font-bold text-foreground">Iniciar sesión</h1>
              <p className="text-muted-foreground text-sm mt-1">Accedé al Portal del Paciente con tu DNI.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="dni"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  DNI / CUIL
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="dni"
                    type="text"
                    className="w-full border border-input rounded-lg pl-10 pr-4 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="28345671"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-input rounded-lg pl-10 pr-10 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-secondary font-semibold text-sm"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar al portal'
                )}
              </Button>

              <div className="text-center">
                <button type="button" className="text-sm text-accent hover:text-accent/80 transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                ¿Primera vez?{' '}
                <Link to="/register" className="text-accent hover:underline">Creá tu cuenta acá</Link>.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground mb-2">Demo de acceso rápido</p>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground text-xs"
            onClick={handleDemo}
          >
            Entrar como paciente de prueba
          </Button>
        </div>
      </div>
    </div>
  )
}

