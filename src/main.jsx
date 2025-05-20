import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import {RouterProvider } from 'react-router-dom'
import { router } from './routes/routes.jsx'
import { AuthProvider } from './context/authContext.jsx'


createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  // </StrictMode>,
);
