import { useEffect, useState } from 'react'
import {
  User,
  Shield,
  FileText,
  Trash2,
  Edit3,
  Save,
  X,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { currentPatient } from '@/lib/mock-data'
import { apiUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/src/context/AuthContext'

type Tab = 'perfil' | 'seguridad'

type BackendProfile = {
  id?: string
  _id?: string
  nombre: string
  apellido: string
  dni: string
  email: string
  telefono?: string
  obraSocial?: string
  nroAfiliado?: string
  fechaNacimiento?: string
}

function ProfileTab() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState<BackendProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Nombre consolidado del auth o del mock
  const authenticatedName = profile
    ? `${profile.nombre} ${profile.apellido}`.trim()
    : user
      ? `${user.nombre} ${user.apellido}`.trim()
      : currentPatient.name
  const authenticatedEmail = profile?.email ?? user?.email ?? currentPatient.email
  const authenticatedDni = profile?.dni ?? user?.dni ?? currentPatient.dni
  const authenticatedObraSocial = profile?.obraSocial ?? user?.obraSocial ?? currentPatient.obraSocial ?? 'Ninguna'
  const authenticatedPhone = profile?.telefono ?? user?.telefono ?? currentPatient.phone
  const authenticatedAffiliateNumber = profile?.nroAfiliado ?? user?.nroAfiliado ?? currentPatient.affiliateNumber
  const authenticatedFechaNacimiento = profile?.fechaNacimiento ?? user?.fechaNacimiento ?? currentPatient.dateOfBirth

  useEffect(() => {
    if (!user?.token) {
      setProfileError('No hay token de sesion para consultar el perfil.')
      return
    }

    const controller = new AbortController()
    setLoadingProfile(true)
    setProfileError('')

    fetch(apiUrl('/api/perfil'), {
      headers: { Authorization: `Bearer ${user.token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('No se pudo consultar el perfil.')
        return response.json() as Promise<BackendProfile>
      })
      .then((data) => {
        setProfile(data)
        updateUser({
          id: data._id ?? data.id,
          dni: data.dni,
          email: data.email,
          nombre: data.nombre,
          apellido: data.apellido,
          telefono: data.telefono,
          obraSocial: data.obraSocial,
          nroAfiliado: data.nroAfiliado,
          fechaNacimiento: data.fechaNacimiento,
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setProfileError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProfile(false)
      })

    return () => controller.abort()
  }, [user?.token, updateUser])

  const fields = [
    { label: 'Nombre completo', value: authenticatedName },
    { label: 'DNI', value: authenticatedDni },
    {
      label: 'Fecha de nacimiento',
      value: new Date(authenticatedFechaNacimiento + 'T00:00:00').toLocaleDateString('es-AR'),
    },
    { label: 'Teléfono', value: authenticatedPhone || 'No registrado' },
    { label: 'Email', value: authenticatedEmail },
    { label: 'Obra Social', value: authenticatedObraSocial },
    { label: 'N° de afiliado', value: authenticatedAffiliateNumber || 'No registrado' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg sm:text-2xl font-bold flex-shrink-0">
          {authenticatedName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground truncate">{authenticatedName}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{authenticatedObraSocial}</p>
          <p className="text-xs text-muted-foreground">ID: {user?.dni ? `PAT-${user.dni.slice(-5)}` : currentPatient.id}</p>
        </div>
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base font-bold">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {loadingProfile && <p className="py-3 text-sm text-muted-foreground">Cargando perfil...</p>}
          {profileError && <p className="py-3 text-sm text-destructive">{profileError}</p>}
          {fields.map((field) => (
            <div
              key={field.label}
              className="py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
            >
              <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">{field.label}</span>
              <span className="text-sm font-medium text-foreground text-left sm:text-right">
                {field.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">Seguridad y privacidad</h2>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base font-bold">Sesiones activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { device: 'Chrome · Windows 11', location: 'Buenos Aires, AR', current: true, time: 'Ahora' },
            { device: 'Safari · iPhone 14', location: 'Buenos Aires, AR', current: false, time: 'Hace 2 días' },
          ].map(({ device, location, current, time }) => (
            <div key={device} className="flex items-center justify-between gap-2 py-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', current ? 'bg-primary' : 'bg-muted-foreground')} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{device}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {location} · {time}
                  </p>
                </div>
              </div>
              {current ? (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs flex-shrink-0" variant="outline">
                  Actual
                </Badge>
              ) : (
                <button className="text-xs text-destructive hover:underline flex-shrink-0">Cerrar</button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base font-bold">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña'].map((label) => (
            <div key={label}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
              <input
                type="password"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>
          ))}
          <Button className="bg-primary text-primary-foreground hover:bg-secondary w-full mt-2">
            Actualizar contraseña
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base font-bold">Datos y privacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <Shield className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">
              Sus datos están protegidos bajo la <strong>Ley 25.326 de Protección de Datos Personales</strong> y los
              estándares HIPAA.
            </p>
          </div>
          <Button variant="outline" className="border-border text-foreground hover:bg-muted w-full justify-start">
            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
            Descargar mis datos personales
          </Button>
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/5 w-full justify-start">
            <Trash2 className="w-4 h-4 mr-2" />
            Solicitar eliminación de cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'perfil', label: 'Mis datos', icon: User },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
]

export function PerfilPage() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Portal del Paciente
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">Perfil y Seguridad</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Gestioná tus datos personales y configuración de seguridad.
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 overflow-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 min-w-max sm:flex-auto flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors relative',
              activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'perfil' && <ProfileTab />}
      {activeTab === 'seguridad' && <SecurityTab />}
    </div>
  )
}

