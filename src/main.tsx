import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/** Last-resort screen so a render error never leaves a blank page. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0b1220', color: '#e2e8f0', fontFamily: 'system-ui', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 320, marginBottom: 16 }}>
            The app hit an unexpected error. Your data is still stored encrypted on this device.
          </p>
          <button
            onClick={() => { this.setState({ error: null }); location.reload(); }}
            style={{ background: '#f59e0b', color: '#0b1220', fontWeight: 700, padding: '10px 20px', borderRadius: 12, border: 'none', fontSize: 14 }}>
            Reload app
          </button>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 16, maxWidth: 320, wordBreak: 'break-word' }}>{String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
