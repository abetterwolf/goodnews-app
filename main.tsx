import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

// ── PWA Service Worker Registration ──────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[GoodNews] Service Worker registered:', registration.scope)
      })
      .catch((error) => {
        console.warn('[GoodNews] Service Worker registration failed:', error)
      })
  })
}

// ── Root Mount ────────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <App />

        {/* ── Global Toast Notifications ── */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            classNames: {
              toast:
                'bg-card border border-border text-foreground shadow-xl rounded-2xl px-4 py-3 text-sm font-medium',
              success: 'border-amber-500/40 text-amber-400',
              error:   'border-red-500/40 text-red-400',
              info:    'border-sky-500/40 text-sky-400',
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
