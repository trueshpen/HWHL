import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  registerSW({
    onOfflineReady() {
      console.info('App ready to work offline')
    },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

