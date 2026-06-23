# Health Grid — Portal del Paciente (Módulo 8 - Frontend)

Este repositorio contiene la aplicación web del **Portal del Paciente** y la **Sala Virtual** del ecosistema **Health Grid**. Es una interfaz moderna, responsiva e interactiva diseñada para que los ciudadanos gestionen su salud de forma centralizada y segura.

---

## 🎯 Propósito del Proyecto y Necesidades que Resuelve

El Portal del Paciente actúa como el punto de contacto único del ciudadano con el ecosistema médico de la institución. Resuelve la fragmentación de la información de salud al integrar los flujos de múltiples microservicios en una experiencia fluida:

* **Acceso Unificado a la Información Médica:** Permite al paciente visualizar en un solo lugar su historial de recetas y órdenes de laboratorio sin necesidad de sistemas separados.
* **Autonomía en la Gestión de Turnos:** Facilita la consulta de sus turnos programados (virtuales o presenciales) de manera ágil.
* **Telemedicina Integrada (Sala Virtual):** Provee una videollamada integrada directamente en el navegador para consultas virtuales, evitando el uso de plataformas externas.
* **Seguridad Farmacológica:** Alerta visualmente al paciente sobre contraindicaciones médicas críticas antes de que consuma un medicamento, basándose en la información de su Historia Clínica Electrónica.
* **Transparencia en Pagos:** Permite ver y abonar coseguros de consultas médicas en línea.

---

## 🛠️ Arquitectura del Frontend

La aplicación está diseñada bajo principios de modularidad, tipado estricto y alto rendimiento visual:

* **Framework y Herramientas:** Construido con **React 18**, **TypeScript** para un desarrollo seguro de tipos, y empaquetado ultra-rápido con **Vite**.
* **Diseño y Estética Premium:** Implementa una interfaz interactiva con **Tailwind CSS**, tipografía moderna (Inter), micro-animaciones dinámicas y diseño adaptivo (móvil y escritorio) utilizando componentes reutilizables.
* **Manejo de Estado Global (AuthContext):** Utiliza la API de Contexto de React (`AuthContext` y `useAuth`) para la gestión unificada de la sesión del usuario, sincronizando tokens JWT, datos de perfil del paciente, persistencia del estado en storage local y la inicialización de sockets de escucha para notificaciones.
* **Integración API REST y WebSockets:** Consume los endpoints estructurados del Backend (`BACK/`) e inicializa canales en tiempo real mediante `Socket.io-client` para capturar eventos de actualizaciones médicas críticas.

---

## 📋 Requisitos Previos

* **Node.js** 18.0 o superior (recomendado LTS).
* **NPM** o **pnpm** como gestor de paquetes.

---

## 🚀 Instalación y Ejecución en Desarrollo

1. Navegar a la carpeta del frontend (`FRONT/`):
   ```bash
   cd FRONT
   ```
2. Instalar las dependencias de node:
   ```bash
   npm install
   ```
3. Configurar la URL de conexión al backend. Copiar el archivo de plantilla `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *El archivo `.env` tendrá por defecto la URL local:*
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```
4. Levantar el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
5. Abrir en tu navegador web la dirección local indicada por la terminal (por defecto [http://localhost:5173](http://localhost:5173)).

---

## 🧑‍💻 Guía de Evaluación y Demo (Usuario Demo)

Para facilitar la corrección y prueba por separado de las pantallas del portal sin depender de registros externos:

1. En la pantalla de login del portal, hacé clic en el botón **"Ingresar con usuario demo"**.
2. Este botón iniciará sesión automáticamente con el paciente demo preestablecido (**María Elena González**, ID Core `101`, DNI `28345671`).
3. El frontend enviará los datos del paciente para validar sesión en el backend y generará tu entorno personalizado en tiempo real.
4. Navegá por las secciones del menú lateral:
   * **Mi Salud (Turnos):** Visualizarás citas médicas sincronizadas.
   * **Mi Salud (Recetas):** Podrás revisar recetas activas y alertas críticas de alergias farmacológicas.
   * **Mi Salud (Laboratorios):** Verás análisis clínicos (ej. Lipidograma) con formato de rangos óptimos.
   * **Pagos Online:** Visualización y simulación de pago de coseguros.
   * **Sala Virtual:** Simulación interactiva de videollamada para consultas programadas.

---

## 📁 Estructura del Código Fuente

* `src/main.tsx` — Punto de entrada de la aplicación.
* `src/App.tsx` — Definición de rutas y estructura de páginas (React Router Dom).
* `src/context/AuthContext.tsx` — Proveedor y lógica de autenticación y sesión de usuario.
* `src/pages/` — Vistas de la aplicación (Portal, Mi Salud, Sala Virtual, Pagos, etc.).
* `components/` — Catálogo de componentes visuales interactivos y reutilizables.
* `lib/api/` — Conectores HTTP para la comunicación con el Backend de la aplicación.
