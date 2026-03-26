import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { TestPage } from './pages/TestPage'

const token = new URLSearchParams(window.location.search).get('token')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {token ? <TestPage token={token} /> : <App />}
  </StrictMode>
)
