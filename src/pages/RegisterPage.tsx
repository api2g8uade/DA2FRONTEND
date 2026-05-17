import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { Activity, Eye, EyeOff, Lock, User, Mail, UserPlus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/src/context/AuthContext'

export function RegisterPage() {
  const navigate = useNavigate()
  const { user, register } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setError('Completá tu nombre y apellido.')
      return
    }
    if (!formData.dni.trim()) {
      setError('Ingresá tu DNI.')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Ingresá un correo electrónico válido.')
      return
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setError('')
    setLoading(true)
    const result = await register({
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      email: formData.email,
      password: formData.password,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate('/mi-salud')
  }

  if (user) return <Navigate to="/mi-salud" replace />

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar (desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-sidebar p-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-2xl font-bold text-sidebar-foreground">Health Grid</span>
        </div>

        <div className="space-y-6">
          <p className="font-serif text-4xl font-bold text-sidebar-foreground text-balance leading-tight">
            Creá tu cuenta en minutos.
          </p>
          <p className="text-sidebar-foreground/60 leading-relaxed text-sm">
            Registrate para acceder a tus turnos, resultados de laboratorio, recetas y
            teleconsultas médicas desde un solo portal seguro y unificado.
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

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-bold text-foreground">Health Grid</span>
        </div>

        <Card className="w-full max-w-md border-border shadow-none">
          <CardContent className="p-8">
            <div className="mb-8">
              <h1 className="font-serif text-2xl font-bold text-foreground">Crear cuenta</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Completá tus datos para registrarte en el Portal del Paciente.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="nombre"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                  >
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="nombre"
                      type="text"
                      className="w-full border border-input rounded-lg pl-10 pr-4 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={(e) => updateField('nombre', e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="apellido"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                  >
                    Apellido
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="apellido"
                      type="text"
                      className="w-full border border-input rounded-lg pl-10 pr-4 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                      placeholder="Pérez"
                      value={formData.apellido}
                      onChange={(e) => updateField('apellido', e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              {/* DNI */}
              <div>
                <label
                  htmlFor="reg-dni"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  DNI / CUIL
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="reg-dni"
                    type="text"
                    className="w-full border border-input rounded-lg pl-10 pr-4 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="28345671"
                    value={formData.dni}
                    onChange={(e) => updateField('dni', e.target.value.replace(/\D/g, ''))}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="reg-email"
                    type="email"
                    className="w-full border border-input rounded-lg pl-10 pr-4 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="juan.perez@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border border-input rounded-lg pl-10 pr-10 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    autoComplete="new-password"
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

              {/* Confirmar Contraseña */}
              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full border border-input rounded-lg pl-10 pr-10 py-3 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Crear cuenta
                  </span>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  ¿Ya tenés cuenta?{' '}
                  <Link to="/" className="text-accent hover:text-accent/80 transition-colors font-medium">
                    Iniciá sesión
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground text-xs"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Volver al inicio de sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
