import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import Login from './components/Login'
import Signup from './components/Signup'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import { BrandingProvider } from './contexts/BrandingContext'

// Lazy-load heavy Three.js canvas and AdminDashboard for minimal initial bundle size
const Scene = lazy(() => import('./components/Scene'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))

function App() {
  return (
    <BrandingProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected User Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="relative w-full h-screen overflow-hidden bg-white text-gray-900 dark:bg-black dark:text-white">
                <Suspense fallback={<div className="absolute inset-0 bg-black -z-10" />}>
                  <Scene />
                </Suspense>
                <ChatInterface />
              </div>
            </ProtectedRoute>
          }
        />

        {/* Protected Administrator Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Suspense fallback={
                <div className="min-h-screen bg-black flex items-center justify-center text-white/60 text-sm">
                  Loading Admin Dashboard...
                </div>
              }>
                <AdminDashboard />
              </Suspense>
            </AdminRoute>
          }
        />
      </Routes>
    </BrandingProvider>
  )
}

export default App
