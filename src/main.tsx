import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/src/context/AuthContext'
import { HealthProvider } from '@/src/context/HealthContext'

import './globals.css'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="healthgrid-theme"
    >
      <BrowserRouter>
        <AuthProvider>
          <HealthProvider>
            <App />
          </HealthProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)

