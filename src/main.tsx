import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import './styles/theme.css'

// Initialize theme from user preferences or system preference
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme)
  } else {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', systemTheme)
  }
}

// Initialize accessibility preferences
const initializeAccessibility = () => {
  const savedPreferences = localStorage.getItem('accessibility')
  if (savedPreferences) {
    const { highContrast, reducedMotion, fontSize } = JSON.parse(savedPreferences)
    if (highContrast) document.documentElement.classList.add('high-contrast')
    if (reducedMotion) document.documentElement.classList.add('reduced-motion')
    if (fontSize) document.documentElement.setAttribute('data-font-size', fontSize)
  }
}

// Initialize preferences
initializeTheme()
initializeAccessibility()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
