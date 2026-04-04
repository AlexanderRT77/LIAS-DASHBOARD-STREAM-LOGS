import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { EvaluationProvider } from './contexts/EvaluationContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EvaluationProvider>
          <App />
        </EvaluationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
