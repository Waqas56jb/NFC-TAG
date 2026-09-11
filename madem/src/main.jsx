import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { I18nProvider } from './i18n/I18nContext'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<main style="font-family:system-ui;padding:2rem;max-width:28rem;margin:auto"><h1>NFC Tag</h1><p>App shell failed to load. Please refresh.</p></main>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
