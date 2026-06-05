// Mock data for Health Grid Patient Portal

export const currentPatient = {
  id: 101,
  name: "María Elena González",
  dni: "28.345.671",
  dateOfBirth: "1985-07-14",
  bloodType: "A+",
  phone: "+54 11 4567-8901",
  email: "maria.gonzalez@email.com",
  obraSocial: "OSDE 310",
  affiliateNumber: "4-4231-0987654/01",
  avatar: null,
}

export const upcomingAppointments = [
  {
    id: "TUR-8821",
    doctor: "Dr. Carlos Peralta",
    specialty: "Cardiología",
    date: "2026-03-24",
    time: "09:30",
    location: "Consultorio 4B",
    modality: "presencial",
    status: "confirmado",
  },
  {
    id: "TUR-8952",
    doctor: "Dra. Laura Vásquez",
    specialty: "Clínica Médica",
    date: "2026-04-02",
    time: "11:00",
    location: "Sala Virtual",
    modality: "virtual",
    status: "confirmado",
  },
  {
    id: "TUR-9014",
    doctor: "Dr. Martín Rodríguez",
    specialty: "Traumatología",
    date: "2026-04-10",
    time: "14:45",
    location: "Consultorio 7A",
    modality: "presencial",
    status: "pendiente",
  },
]

export const prescriptionHistory = [
  {
    id: "REC-551",
    doctor: "Dra. Laura Vásquez",
    date: "2026-02-28",
    medications: [
      { name: "Enalapril 10mg", instructions: "1 comprimido cada 12 hs", quantity: "30 comp." },
      { name: "Atorvastatina 20mg", instructions: "1 comprimido por noche", quantity: "30 comp." },
    ],
    status: "vigente",
  },
  {
    id: "REC-489",
    doctor: "Dr. Carlos Peralta",
    date: "2026-01-15",
    medications: [
      { name: "Aspirina 100mg", instructions: "1 comprimido diario con el desayuno", quantity: "30 comp." },
    ],
    status: "vigente",
  },
  {
    id: "REC-412",
    doctor: "Dra. Ana Morales",
    date: "2025-11-20",
    medications: [
      { name: "Amoxicilina 500mg", instructions: "1 comprimido cada 8 hs por 7 días", quantity: "21 comp." },
    ],
    status: "vencida",
  },
]

export const labResults = [
  {
    id: "LAB-2241",
    date: "2026-03-10",
    type: "Hemograma completo",
    doctor: "Dra. Laura Vásquez",
    status: "disponible",
    critical: false,
    results: [
      { name: "Glóbulos rojos", value: "4.8", unit: "mill/μL", reference: "4.2–5.4", status: "normal" },
      { name: "Hemoglobina", value: "14.2", unit: "g/dL", reference: "12–16", status: "normal" },
      { name: "Hematocrito", value: "42", unit: "%", reference: "36–46", status: "normal" },
      { name: "Glóbulos blancos", value: "7.2", unit: "mil/μL", reference: "4.5–11.0", status: "normal" },
      { name: "Plaquetas", value: "215", unit: "mil/μL", reference: "150–400", status: "normal" },
    ],
  },
  {
    id: "LAB-2198",
    date: "2026-03-10",
    type: "Perfil lipídico",
    doctor: "Dr. Carlos Peralta",
    status: "disponible",
    critical: true,
    results: [
      { name: "Colesterol total", value: "238", unit: "mg/dL", reference: "< 200", status: "alto" },
      { name: "LDL", value: "158", unit: "mg/dL", reference: "< 130", status: "alto" },
      { name: "HDL", value: "52", unit: "mg/dL", reference: "> 40", status: "normal" },
      { name: "Triglicéridos", value: "142", unit: "mg/dL", reference: "< 150", status: "normal" },
    ],
  },
  {
    id: "LAB-2055",
    date: "2026-01-20",
    type: "Glucemia en ayunas",
    doctor: "Dra. Laura Vásquez",
    status: "disponible",
    critical: false,
    results: [
      { name: "Glucemia", value: "92", unit: "mg/dL", reference: "70–100", status: "normal" },
    ],
  },
]

export const notifications = [
  {
    id: "NOT-001",
    type: "resultado",
    title: "Resultado de laboratorio disponible",
    message: "Su perfil lipídico del 10/03 ya está disponible para consultar.",
    time: "Hace 2 horas",
    read: false,
    urgent: true,
  },
  {
    id: "NOT-002",
    type: "turno",
    title: "Recordatorio de turno",
    message: "Mañana tiene turno con Dr. Carlos Peralta a las 09:30 hs.",
    time: "Hace 5 horas",
    read: false,
    urgent: false,
  },
  {
    id: "NOT-003",
    type: "receta",
    title: "Receta lista para retirar",
    message: "Su receta REC-551 fue enviada a la farmacia de guardia.",
    time: "Ayer",
    read: true,
    urgent: false,
  },
  {
    id: "NOT-004",
    type: "pago",
    title: "Pago confirmado",
    message: "Se procesó el pago del coseguro de $4.500 para el turno TUR-8821.",
    time: "Hace 2 días",
    read: true,
    urgent: false,
  },
]

export const paymentHistory = [
  {
    id: "PAG-9921",
    concept: "Coseguro — Cardiología",
    turno: "TUR-8821",
    amount: 4500,
    date: "2026-03-16",
    method: "Visa •••• 4521",
    status: "aprobado",
  },
  {
    id: "PAG-9870",
    concept: "Turno — Clínica Médica",
    turno: "TUR-8952",
    amount: 0,
    date: "2026-03-12",
    method: "OSDE — cubierto",
    status: "cubierto",
  },
  {
    id: "PAG-9744",
    concept: "Coseguro — Laboratorio",
    turno: "LAB-2241",
    amount: 2800,
    date: "2026-03-08",
    method: "Mercado Pago",
    status: "aprobado",
  },
]

export const pendingPayments = [
  {
    id: "PEN-001",
    concept: "Coseguro — Traumatología",
    turno: "TUR-9014",
    amount: 5200,
    dueDate: "2026-04-10",
    doctor: "Dr. Martín Rodríguez",
  },
]
