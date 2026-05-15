import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Profile from './pages/Profile'

function App() {
  const location = useLocation()

  return (
    <div className="app-container">
      {location.pathname !== '/auth' && <Navbar />}
      <AnimatePresence mode="wait">
        <main style={{ minHeight: 'calc(100vh - 80px)', padding: '0 40px' }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </main>
      </AnimatePresence>
    </div>
  )
}

export default App
