import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { AuthProvider, useAuth } from './context/auth.tsx'
import { router } from './router'

import reportWebVitals from './reportWebVitals.ts'
import './styles.css'

function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}


const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </StrictMode>,
  )
}




reportWebVitals()
