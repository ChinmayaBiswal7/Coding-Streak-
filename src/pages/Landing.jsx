import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Target, Users } from 'lucide-react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const Landing = () => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      >
        <h1 style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: '24px' }}>
          Code Together.<br />
          <span className="gradient-text">Never Break The Streak.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 40px auto', lineHeight: 1.6 }}>
          Sync your LeetCode and CodeChef accounts. Add friends. Solve daily problems together. If one fails, the mutual streak dies. Keep each other accountable.
        </p>
        
        <Link to={user ? "/dashboard" : "/auth"}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary" 
            style={{ fontSize: '1.2rem', padding: '16px 32px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}
          >
            {user ? "Go to Dashboard" : "Start Your Journey"} <ArrowRight />
          </motion.button>
        </Link>
      </motion.div>

      <div style={{ display: 'flex', gap: '32px', marginTop: '80px' }}>
        {[
          { icon: <Zap color="var(--accent-secondary)" size={32} />, title: "Instant Sync", desc: "Auto-syncs with LeetCode API" },
          { icon: <Users color="var(--accent-primary)" size={32} />, title: "Mutual Streaks", desc: "Your streak is bound to your friend's" },
          { icon: <Target color="#00ff88" size={32} />, title: "Daily Goals", desc: "Never miss a day of coding" },
        ].map((feat, i) => (
          <motion.div 
            key={i}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="glass-panel"
            style={{ padding: '32px', textAlign: 'left', width: '250px' }}
          >
            <div style={{ marginBottom: '16px' }}>{feat.icon}</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{feat.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default Landing
