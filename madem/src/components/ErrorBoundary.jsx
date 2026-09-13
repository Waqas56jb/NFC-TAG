import { Component } from 'react'

function copy() {
  const ar = typeof document !== 'undefined' && document.documentElement?.lang === 'ar'
  return ar
    ? {
        title: 'حدث خطأ ما',
        body: 'واجهت الصفحة خطأ غير متوقع. بياناتك بأمان — جرّب التحديث.',
        reload: 'إعادة تحميل التطبيق',
      }
    : {
        title: 'Something went wrong',
        body: 'The page hit an unexpected error. Your data is safe — try refreshing.',
        reload: 'Reload app',
      }
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crash caught:', error, info)
  }

  render() {
    if (this.state.error) {
      const c = copy()
      return (
        <div className="crash-screen" role="alert">
          <div className="crash-card">
            <p className="crash-kicker">Aman</p>
            <h1>{c.title}</h1>
            <p>{c.body}</p>
            <button type="button" className="primary" onClick={() => window.location.assign('/')}>
              {c.reload}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
