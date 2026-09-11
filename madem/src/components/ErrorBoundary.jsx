import { Component } from 'react'

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
      return (
        <div className="crash-screen" role="alert">
          <div className="crash-card">
            <p className="crash-kicker">NFC Tag</p>
            <h1>Something went wrong</h1>
            <p>The page hit an unexpected error. Your data is safe — try refreshing.</p>
            <button type="button" className="primary" onClick={() => window.location.assign('/')}>
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
