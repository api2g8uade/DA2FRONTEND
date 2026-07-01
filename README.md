# Health Grid — Portal del Paciente (Módulo 8 - Frontend)

Este repositorio contiene la aplicación web del **Portal del Paciente** y la **Sala Virtual** del ecosistema **Health Grid**. Es una SPA (Single Page Application) moderna, responsiva e interactiva diseñada para que los pacientes gestionen su salud.

---

## 🏗️ Descripción de la Arquitectura

La aplicación está diseñada bajo principios de modularidad, desacoplamiento y tipado estricto:

*   **Tecnologías Principales:** React 19, TypeScript (para seguridad de tipos) y Vite 6 (empaquetador ultra rápido de desarrollo y producción).
*   **Diseño y UI:** Tailwind CSS 4 para estilos utilitarios y componentes altamente responsivos e interactivos basados en Radix UI.
*   **Manejo de Estado Global (AuthContext):** Utiliza React Context API (`AuthContext` y `useAuth`) para centralizar el ciclo de vida de la sesión del paciente (sincronización de tokens JWT, almacenamiento persistente en localStorage y la inicialización de la conexión de WebSockets para notificaciones).
*   **Capa de Servicios y API:** Ubicada en `src/lib/api/` y `src/lib/api.ts`. Encapsula las llamadas HTTP a la API REST del Backend, enviando automáticamente el token de sesión (Bearer Token) en cada solicitud.
*   **Notificaciones en Tiempo Real:** Implementado con `socket.io-client` para escuchar y reaccionar de manera inmediata a alertas médicas, recordatorios de turnos y resultados de laboratorio.

---

## 🚀 Cómo Inicializar el Proyecto

Sigue estos pasos para instalar, configurar y ejecutar la aplicación en tu entorno local:

### 1. Requisitos Previos
*   **Node.js** v18 o superior (recomendado LTS).
*   **NPM** instalado.

### 2. Instalación de Dependencias
Navegá a la carpeta del frontend y ejecutá:
```bash
cd FRONT
npm install
```

### 3. Configuración del Entorno (`.env`)
Creá un archivo `.env` en la raíz de la carpeta `FRONT/` para indicarle al frontend dónde se encuentra el servidor backend:
```bash
cp .env.example .env
```
Abrí el archivo `.env` y configurá la variable `VITE_API_BASE_URL` apuntando al backend (ya sea local o en la nube):
*   **Desarrollo Local:**
    ```env
    VITE_API_BASE_URL=http://localhost:3000
    ```
*   **Producción (Nube):**
    ```env
    VITE_API_BASE_URL=https://health-grid-backend-7l67.onrender.com
    ```

### 4. Ejecución en Desarrollo
Iniciá el servidor de desarrollo local de Vite:
```bash
npm run dev
```
La aplicación estará disponible para abrir en tu navegador en: [http://localhost:5173](http://localhost:5173)

### 5. Compilación para Producción (Build)
Para compilar la aplicación optimizada para producción:
```bash
npm run build
```
Los archivos optimizados y estáticos se generarán en la carpeta `dist/`, listos para ser desplegados en plataformas de hosting como Render o Vercel.
