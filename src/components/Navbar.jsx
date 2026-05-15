import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, LogIn, Users, User, Plus, X } from 'lucide-react'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, or } from 'firebase/firestore'

const Navbar = () => {
  const [user, setUser] = useState(null)
  const location = useLocation()
  
  // Friend Modal State
  const [showFriendModal, setShowFriendModal] = useState(false)
  const [friendInput, setFriendInput] = useState('')
  const [friendError, setFriendError] = useState('')
  const [isAddingFriend, setIsAddingFriend] = useState(false)

  const isDashboard = location.pathname === '/dashboard'
  const isProfile = location.pathname === '/profile'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleAddFriend = async (e) => {
    e.preventDefault()
    const handle = friendInput.trim()
    if (!handle) return

    setIsAddingFriend(true)
    setFriendError('')

    try {
      const userRef = doc(db, 'users', user.uid)
      const currentUserSnap = await getDoc(userRef)
      
      if (currentUserSnap.exists() && currentUserSnap.data().friends?.includes(handle)) {
        setFriendError("You are already tracking this friend!")
        setIsAddingFriend(false)
        return
      }

      const usersRef = collection(db, 'users')
      const q = query(usersRef, or(where('username', '==', handle), where('displayName', '==', handle)))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setFriendError("Could not find a StreakSync user with that name.")
        setIsAddingFriend(false)
        return
      }

      const actualFriendUsername = querySnapshot.docs[0].data().username

      if (currentUserSnap.exists() && currentUserSnap.data().friends?.includes(actualFriendUsername)) {
        setFriendError("You are already tracking this friend!")
        setIsAddingFriend(false)
        return
      }

      await updateDoc(userRef, {
        friends: arrayUnion(actualFriendUsername)
      })

      setShowFriendModal(false)
      setFriendInput('')
    } catch (error) {
      console.error("Error adding friend: ", error)
      setFriendError("An error occurred. Please try again.")
    } finally {
      setIsAddingFriend(false)
    }
  }

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="header-container glass-panel"
        style={{ margin: '20px 40px', borderRadius: '16px' }}
      >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: 'var(--accent-primary)', 
          padding: '8px', 
          borderRadius: '12px',
          boxShadow: 'var(--glow-shadow)'
        }}>
          <Flame size={24} color="#fff" />
        </div>
        <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800 }}>StreakSync</h1>
      </Link>

      <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {user && (
          <>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDashboard ? 'var(--accent-primary)' : 'var(--text-main)', fontWeight: isDashboard ? 700 : 500 }}>
              <Users size={18} /> Dashboard
            </Link>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isProfile ? 'var(--accent-primary)' : 'var(--text-main)', fontWeight: isProfile ? 700 : 500 }}>
              <User size={18} /> Profile
            </Link>
            <button 
              onClick={() => setShowFriendModal(true)} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px' }}
            >
              <Plus size={16} /> Add Friend
            </button>
          </>
        )}
        
        {!user && (
          <Link to="/auth">
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogIn size={18} /> Login / Sign Up
            </button>
          </Link>
        )}
        </nav>
      </motion.header>

      {/* Add Friend Modal (Global) - Escaped from header's transform context! */}
      <AnimatePresence>
        {showFriendModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px', position: 'relative' }}>
              <button onClick={() => setShowFriendModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
              
              <h3 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Add a Friend</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Enter their master username to track streaks across all shared platforms.</p>
              
              <form onSubmit={handleAddFriend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="text" placeholder="Friend's Username" value={friendInput} onChange={(e) => setFriendInput(e.target.value)} required style={{ padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                {friendError && <span style={{ color: '#ff3366', fontSize: '0.85rem' }}>{friendError}</span>}
                <button className="btn-primary" type="submit" disabled={isAddingFriend} style={{ opacity: isAddingFriend ? 0.7 : 1 }}>
                  {isAddingFriend ? 'Adding...' : 'Add Friend'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
}

export default Navbar
