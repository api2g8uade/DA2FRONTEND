import { Navigate, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/src/context/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { PortalLayout } from './layouts/PortalLayout'
import { MiSaludPage } from './pages/portal/MiSaludPage'
import { SalaVirtualPage } from './pages/portal/SalaVirtualPage'
import { PagosPage } from './pages/portal/PagosPage'
import { PerfilPage } from './pages/portal/PerfilPage'
import { NotificacionesPage } from './pages/portal/NotificacionesPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<PortalLayout />}>
          <Route path="/notificaciones" element={<NotificacionesPage />} />
          <Route path="/mi-salud" element={<MiSaludPage />} />
          <Route path="/sala-virtual" element={<SalaVirtualPage />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

