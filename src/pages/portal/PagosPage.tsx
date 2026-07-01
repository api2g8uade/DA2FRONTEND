import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CreditCard,
  Wallet,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Lock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiUrl } from '@/lib/api'
import { useAuth } from '@/src/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type PaymentMethod = 'visa' | 'mastercard' | 'mercadopago' | 'debin'
type BackendPaymentMethod = 'TARJETA' | 'BILLETERA_VIRTUAL'
type PaymentStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CUBIERTO'
type PaymentView = 'list' | 'checkout' | 'success'

type Appointment = {
  _id: string
  medicoId: string
  especialidad: string
  fechaHora: string
  sede?: string
  tipo?: string
}

type Payment = {
  _id: string
  pacienteId: string
  turnoId?: string | Appointment | null
  concepto: string
  monto: number
  numeroFactura?: string
  metodoPago?: BackendPaymentMethod
  estado: PaymentStatus
  fechaPago?: string
  createdAt?: string
}

const methodLabel: Record<BackendPaymentMethod, string> = {
  TARJETA: 'Tarjeta',
  BILLETERA_VIRTUAL: 'Billetera virtual',
}

const checkoutMethodMap: Record<PaymentMethod, BackendPaymentMethod> = {
  visa: 'TARJETA',
  mastercard: 'TARJETA',
  mercadopago: 'BILLETERA_VIRTUAL',
  debin: 'BILLETERA_VIRTUAL',
}

function formatCurrency(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Sin fecha'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getAppointment(payment: Payment): Appointment | null {
  return payment.turnoId && typeof payment.turnoId === 'object' ? payment.turnoId : null
}

function getPaymentDate(payment: Payment) {
  return payment.fechaPago ?? payment.createdAt
}

function getTurnoLabel(payment: Payment) {
  const appointment = getAppointment(payment)
  if (!appointment) return 'Turno asociado no disponible'
  return `${appointment.especialidad} - ${formatDate(appointment.fechaHora)}`
}

function getPaymentSubtitle(payment: Payment) {
  const appointment = getAppointment(payment)
  const parts = [
    appointment?.medicoId,
    appointment?.sede,
    appointment?.tipo,
    payment.numeroFactura ? `Factura ${payment.numeroFactura}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' - ') : 'Factura no disponible'
}

const paymentMethods: { id: PaymentMethod; label: string; Icon: typeof CreditCard; last4?: string }[] = [
  { id: 'visa', label: 'Visa', Icon: CreditCard, last4: '4521' },
  { id: 'mastercard', label: 'Mastercard', Icon: CreditCard, last4: '8834' },
  { id: 'mercadopago', label: 'Mercado Pago', Icon: Wallet },
  { id: 'debin', label: 'DEBIN / Transferencia', Icon: Wallet },
]

function PaymentCheckout({
  payment,
  token,
  onSuccess,
  onBack,
}: {
  payment: Payment
  token?: string
  onSuccess: (payment: Payment) => void
  onBack: () => void
}) {
  const [method, setMethod] = useState<PaymentMethod>('visa')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    if (!token) {
      setError('No hay una sesion activa para procesar el pago.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl('/api/pagos/checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: payment._id,
          metodoPago: checkoutMethodMap[method],
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'No se pudo procesar el pago.')

      onSuccess(data.pago)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el pago.')
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim()

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <Card className="border-border shadow-none bg-primary/5">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Resumen del pago</p>
          <p className="font-semibold text-foreground">{payment.concepto}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{getTurnoLabel(payment)}</p>
          <p className="text-xs text-muted-foreground mt-1">{getPaymentSubtitle(payment)}</p>
          <p className="text-2xl font-bold text-primary mt-3">{formatCurrency(payment.monto)}</p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base">Metodo de pago</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {paymentMethods.map(({ id, label, Icon, last4 }) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border text-xs transition-all text-center',
                method === id
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              <Icon className="w-5 h-5 text-primary" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground line-clamp-2">{label}</p>
                {last4 && <p className="text-xs text-muted-foreground">**** {last4}</p>}
              </div>
              {method === id && <CheckCircle className="w-3.5 h-3.5 text-primary mt-1" />}
            </button>
          ))}
        </CardContent>
      </Card>

      {(method === 'visa' || method === 'mastercard') && (
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base">Datos de la tarjeta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nombre en la tarjeta</label>
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
                placeholder="MARIA E GONZALEZ"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Numero de tarjeta</label>
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground font-mono outline-none focus:border-primary transition-colors"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Vencimiento</label>
                <input
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground font-mono outline-none focus:border-primary transition-colors"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CVV</label>
                <input
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background text-foreground font-mono outline-none focus:border-primary transition-colors"
                  placeholder="***"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {method === 'mercadopago' && (
        <Card className="border-border shadow-none bg-muted">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Seras redirigido a Mercado Pago para completar el pago de forma segura.
            </p>
          </CardContent>
        </Card>
      )}

      {method === 'debin' && (
        <Card className="border-border shadow-none bg-muted">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm font-semibold text-foreground">CBU para transferencia</p>
            <p className="text-sm font-mono text-foreground bg-card rounded-lg p-3 border border-border">
              0720005820000006247915
            </p>
            <p className="text-xs text-muted-foreground">
              Concepto: {getTurnoLabel(payment)} - {payment.concepto}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5 text-primary" />
        Transaccion cifrada con SSL 256-bit
      </div>

      {error && (
        <Card className="border-destructive/30 shadow-none bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-secondary h-12 text-base font-semibold"
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Procesando...
          </span>
        ) : (
          <>Pagar {formatCurrency(payment.monto)}</>
        )}
      </Button>
    </div>
  )
}

function PaymentSuccess({ payment, onBack }: { payment: Payment | null; onBack: () => void }) {
  return (
    <Card className="max-w-sm mx-auto border-border shadow-none">
      <CardContent className="p-6 sm:p-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-foreground">Pago exitoso</h2>
          <p className="text-muted-foreground text-sm mt-1">
            El pago fue procesado correctamente. Recibiras el comprobante por email.
          </p>
        </div>
        <div className="w-full bg-muted rounded-xl p-4 text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Factura</span>
            <span className="font-mono font-semibold text-foreground">{payment?.numeroFactura ?? '00000000'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs" variant="outline">
              APROBADO
            </Badge>
          </div>
        </div>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-secondary" onClick={onBack}>
          Volver al inicio
        </Button>
      </CardContent>
    </Card>
  )
}

export function PagosPage() {
  const { user } = useAuth()
  const [view, setView] = useState<PaymentView>('list')
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [successPayment, setSuccessPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subTab, setSubTab] = useState<'pendientes' | 'historial'>('pendientes')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadPayments = useCallback(async () => {
    if (!user?.token) {
      setError('No hay una sesion activa para consultar pagos.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl('/api/pagos/historial'), {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'No se pudo cargar el historial de pagos.')
      setPayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial de pagos.')
    } finally {
      setLoading(false)
    }
  }, [user?.token])

  useEffect(() => {
    void loadPayments()
  }, [loadPayments])

  const pendingPayments = useMemo(
    () => payments.filter((payment) => payment.estado === 'PENDIENTE'),
    [payments]
  )
  const paymentHistory = useMemo(
    () => payments.filter((payment) => payment.estado === 'APROBADO' || payment.estado === 'CUBIERTO'),
    [payments]
  )
  const totalPending = pendingPayments.reduce((acc, p) => acc + p.monto, 0)

  const handlePaymentSuccess = (payment: Payment) => {
    setSuccessPayment(payment)
    setSelectedPayment(null)
    setView('success')
    void loadPayments()
  }

  if (view === 'checkout' && selectedPayment) {
    return (
      <div>
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Portal del Paciente
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">Pagos Online</h1>
        </div>
        <PaymentCheckout
          payment={selectedPayment}
          token={user?.token}
          onSuccess={handlePaymentSuccess}
          onBack={() => setView('list')}
        />
      </div>
    )
  }

  if (view === 'success') {
    return (
      <div>
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
            Portal del Paciente
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">Pagos Online</h1>
        </div>
        <PaymentSuccess payment={successPayment} onBack={() => setView('list')} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Portal del Paciente
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">Pagos Online</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Abona coseguros y turnos de forma segura desde el portal.
        </p>
      </div>

      {loading ? (
        <Card className="border-border shadow-none">
          <CardContent className="p-8 text-center text-muted-foreground">Cargando pagos...</CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 shadow-none bg-destructive/5">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void loadPayments()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Sub Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg max-w-xs w-full mb-2">
            <button
              onClick={() => { setSubTab('pendientes'); setExpandedId(null); }}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
                subTab === 'pendientes' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pendientes
            </button>
            <button
              onClick={() => { setSubTab('historial'); setExpandedId(null); }}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
                subTab === 'historial' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Historial de pagos
            </button>
          </div>

          {subTab === 'pendientes' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold text-foreground">Pagos pendientes</h2>
                {totalPending > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200" variant="outline">
                    {formatCurrency(totalPending)} total
                  </Badge>
                )}
              </div>
              {pendingPayments.length === 0 ? (
                <Card className="border-border shadow-none">
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    No tenés pagos pendientes.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((p) => {
                    const isOpen = expandedId === p._id
                    return (
                      <Card key={p._id} className="border-amber-200 shadow-none bg-amber-50/10 overflow-hidden transition-all">
                        <button
                          className="w-full text-left"
                          onClick={() => setExpandedId(isOpen ? null : p._id)}
                          aria-expanded={isOpen}
                        >
                          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                            <div className="flex gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{p.concepto}</p>
                                <p className="text-xs text-muted-foreground">{getTurnoLabel(p)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <p className="font-bold text-foreground text-sm sm:text-base">{formatCurrency(p.monto)}</p>
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 border-t border-border bg-amber-50/5">
                            <div className="pt-4 space-y-3 text-sm">
                              <div className="bg-muted/40 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Concepto</span>
                                  <span className="font-medium text-foreground">{p.concepto}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Detalles</span>
                                  <span className="font-medium text-foreground text-right">{getPaymentSubtitle(p)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Monto a pagar</span>
                                  <span className="font-bold text-primary">{formatCurrency(p.monto)}</span>
                                </div>
                              </div>
                              <div className="pt-2 text-right">
                                <Button
                                  size="sm"
                                  className="bg-primary text-primary-foreground hover:bg-secondary w-full sm:w-auto"
                                  onClick={() => {
                                    setSelectedPayment(p)
                                    setView('checkout')
                                  }}
                                >
                                  Pagar ahora
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-foreground font-semibold">Historial de pagos</h2>
              {paymentHistory.length === 0 ? (
                <Card className="border-border shadow-none">
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    Todavía no tenés pagos aprobados o cubiertos.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((p) => {
                    const isOpen = expandedId === p._id
                    return (
                      <Card key={p._id} className="border-border shadow-none overflow-hidden transition-all bg-muted/5 opacity-80">
                        <button
                          className="w-full text-left"
                          onClick={() => setExpandedId(isOpen ? null : p._id)}
                          aria-expanded={isOpen}
                        >
                          <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                            <div className="flex gap-3 min-w-0">
                              <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                p.estado === 'APROBADO' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              )}>
                                {p.estado === 'APROBADO' ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : (
                                  <Wallet className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{p.concepto}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(getPaymentDate(p))} · {p.metodoPago ? methodLabel[p.metodoPago] : 'Obra social'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {p.estado === 'CUBIERTO' || p.monto === 0 ? (
                                <p className="font-semibold text-primary text-sm sm:text-base">Cubierto</p>
                              ) : (
                                <p className="font-semibold text-foreground text-sm sm:text-base">{formatCurrency(p.monto)}</p>
                              )}
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </CardContent>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 border-t border-border bg-muted/10">
                            <div className="pt-4 space-y-3 text-sm">
                              <div className="bg-muted p-4 rounded-xl space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider font-sans">Comprobante</span>
                                  <span className="font-mono text-foreground">{p.numeroFactura || 'MP-TRANS-184719'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Fecha</span>
                                  <span className="font-medium text-foreground">{formatDate(getPaymentDate(p))}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Turno Asociado</span>
                                  <span className="font-medium text-foreground text-right">{getTurnoLabel(p)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Sede & Médico</span>
                                  <span className="font-medium text-foreground text-right">{getPaymentSubtitle(p)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Estado</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs capitalize',
                                      p.estado === 'APROBADO' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'
                                    )}
                                  >
                                    {p.estado}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <section className="pt-6 border-t border-border">
            <h2 className="font-serif text-lg font-bold text-foreground mb-4">Métodos aceptados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Visa / Mastercard', sub: 'Debito y credito', icon: CreditCard },
                { name: 'Mercado Pago', sub: 'Billetera virtual', icon: Wallet },
                { name: 'DEBIN', sub: 'Transferencia bancaria', icon: Wallet },
                { name: 'Obra Social', sub: 'Pago directo', icon: CheckCircle },
              ].map(({ name, sub, icon: Icon }) => (
                <Card key={name} className="border-border shadow-none">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
