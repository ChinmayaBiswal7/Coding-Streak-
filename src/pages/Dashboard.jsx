import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StreakCard from '../components/StreakCard'
import ActivityGraph from '../components/ActivityGraph'
import { Plus, Code2, LogOut, Users, X, Code, Terminal, Cpu, Settings } from 'lucide-react'
import { auth, db } from '../firebase'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'

const PLATFORMS = [
  { id: 'leetcode', name: 'LeetCode', icon: <Code2 size={18} />, color: '#ffa116' },
  { id: 'codeforces', name: 'Codeforces', icon: <Terminal size={18} />, color: '#1f8acb' },
  { id: 'github', name: 'GitHub', icon: <Code size={18} />, color: '#ffffff' },
  { id: 'codechef', name: 'CodeChef', icon: <Cpu size={18} />, color: '#b46c1e' },
  { id: 'atcoder', name: 'AtCoder', icon: <Code2 size={18} />, color: '#64c8ff' }
]

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Connection Form State
  const [handles, setHandles] = useState({ leetcode: '', codeforces: '', github: '', codechef: '', atcoder: '' })
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // Dashboard State
  const [activePlatform, setActivePlatform] = useState('leetcode')
  
  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribeDoc = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const docRef = doc(db, 'users', currentUser.uid)
        
        // Listen in real-time so when Navbar adds a friend, Dashboard updates instantly!
        unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setUserData(data)
            setHandles({
              leetcode: data.leetcodeHandle || '',
              codeforces: data.codeforcesHandle || '',
              github: data.githubHandle || '',
              codechef: data.codechefHandle || '',
              atcoder: data.atcoderHandle || ''
            })
          }
          setLoading(false)
        })
      } else {
        navigate('/auth')
        setLoading(false)
      }
    })
    return () => {
      unsubscribeAuth()
      if (unsubscribeDoc) unsubscribeDoc()
    }
  }, [navigate])

  const handleUpdatePlatforms = async (e) => {
    e.preventDefault()
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        leetcodeHandle: handles.leetcode.trim(),
        codeforcesHandle: handles.codeforces.trim(),
        githubHandle: handles.github.trim(),
        codechefHandle: handles.codechef.trim(),
        atcoderHandle: handles.atcoder.trim()
      })
      setUserData({ 
        ...userData, 
        leetcodeHandle: handles.leetcode.trim(),
        codeforcesHandle: handles.codeforces.trim(),
        githubHandle: handles.github.trim(),
        codechefHandle: handles.codechef.trim(),
        atcoderHandle: handles.atcoder.trim()
      })
      setShowSettingsModal(false)
    } catch (error) {
      console.error("Error updating documents: ", error)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const handleRemoveFriend = async (handleToRemove) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        friends: arrayRemove(handleToRemove)
      })
      setUserData(prev => ({ ...prev, friends: prev.friends.filter(f => f !== handleToRemove) }))
    } catch (error) {
      console.error("Error removing friend:", error)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>Loading...</div>

  // If NO handles are connected at all, show the Connect screen
  const hasAnyHandle = userData?.leetcodeHandle || userData?.codeforcesHandle || userData?.githubHandle || userData?.codechefHandle || userData?.atcoderHandle

  if (userData && !hasAnyHandle) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Link Your Accounts</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Enter your public usernames for the platforms you want to track. Leave blank if you don't use them.
          </p>

          <form onSubmit={handleUpdatePlatforms} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
              <Code2 color="#ffa116" />
              <input type="text" placeholder="LeetCode Username" value={handles.leetcode} onChange={(e) => setHandles({...handles, leetcode: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
              <Terminal color="#1f8acb" />
              <input type="text" placeholder="Codeforces Handle" value={handles.codeforces} onChange={(e) => setHandles({...handles, codeforces: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
              <Code color="#ffffff" />
              <input type="text" placeholder="GitHub Username" value={handles.github} onChange={(e) => setHandles({...handles, github: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
              <Cpu color="#b46c1e" />
              <input type="text" placeholder="CodeChef Username" value={handles.codechef} onChange={(e) => setHandles({...handles, codechef: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
              <Code2 color="#64c8ff" />
              <input type="text" placeholder="AtCoder Username" value={handles.atcoder} onChange={(e) => setHandles({...handles, atcoder: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
            </div>
            
            <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: '16px' }}>
              Sync Accounts
            </button>
          </form>
        </div>
      </motion.div>
    )
  }

  const friends = userData?.friends || []
  
  // Get active handle based on selected platform
  const activeHandle = userData?.[`${activePlatform}Handle`]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ padding: '20px 0', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Dashboard, <span className="gradient-text">{userData?.username}</span>!</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowSettingsModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <Settings size={18} /> Manage
          </button>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Platform Selector Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {PLATFORMS.map(p => {
          const isConnected = userData?.[`${p.id}Handle`]
          if (!isConnected) return null // Only show tabs for connected accounts
          
          const isActive = activePlatform === p.id
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${isActive ? p.color : 'var(--border-color)'}`,
                color: isActive ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              {React.cloneElement(p.icon, { color: isActive ? p.color : 'var(--text-muted)' })}
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{p.name}</span>
            </button>
          )
        })}
      </div>

      <ActivityGraph username={activeHandle} platform={activePlatform} />

      <h3 style={{ marginBottom: '24px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={24} color="var(--accent-primary)" /> {PLATFORMS.find(p=>p.id===activePlatform)?.name} Mutual Streaks
      </h3>
      
      {friends.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--text-muted)' }}>
          <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-main)' }}>You have no mutual streaks yet.</h4>
          <p style={{ color: 'var(--text-muted)' }}>Click "Add Friend" in the top right to start a coding streak!</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {friends.map((friendHandle, i) => (
            <motion.div key={`${friendHandle}-${activePlatform}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
              <StreakCard friendHandle={friendHandle} myHandle={activeHandle} platform={activePlatform} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '450px', position: 'relative' }}>
              <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
              
              <h3 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Manage Linked Accounts</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Add or update your usernames for different coding platforms.</p>
              
              <form onSubmit={handleUpdatePlatforms} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
                  <Code2 color="#ffa116" />
                  <input type="text" placeholder="LeetCode Username" value={handles.leetcode} onChange={(e) => setHandles({...handles, leetcode: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
                  <Terminal color="#1f8acb" />
                  <input type="text" placeholder="Codeforces Handle" value={handles.codeforces} onChange={(e) => setHandles({...handles, codeforces: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
                  <Code color="#ffffff" />
                  <input type="text" placeholder="GitHub Username" value={handles.github} onChange={(e) => setHandles({...handles, github: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
                  <Cpu color="#b46c1e" />
                  <input type="text" placeholder="CodeChef Username" value={handles.codechef} onChange={(e) => setHandles({...handles, codechef: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 16px' }}>
                  <Code2 color="#64c8ff" />
                  <input type="text" placeholder="AtCoder Username" value={handles.atcoder} onChange={(e) => setHandles({...handles, atcoder: e.target.value})} style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                </div>
                <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: '16px' }}>
                  Save Updates
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}

export default Dashboard
