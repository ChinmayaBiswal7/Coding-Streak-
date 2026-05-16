import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Ghost } from 'lucide-react'
import { auth, db } from '../firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        navigate('/dashboard')
      }
    })
    return () => unsubscribe()
  }, [navigate])

  // Helper function to create/update user document in Firestore
  const saveUserToFirestore = async (user, displayName) => {
    const userRef = doc(db, 'users', user.uid)
    const { getDoc, updateDoc } = await import('firebase/firestore')
    const docSnap = await getDoc(userRef)
    
    // Generate a clean username (no spaces, lowercase)
    const cleanUsername = (displayName || user.displayName || 'AnonymousCoder')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 20) || 'AnonymousCoder'
    
    if (docSnap.exists()) {
      const existingData = docSnap.data()
      // Patch missing username if old account doesn't have one
      if (!existingData.username) {
        await updateDoc(userRef, {
          username: cleanUsername,
          lastLogin: serverTimestamp()
        })
      } else {
        // If user already exists, just update their login time
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        })
      }
    } else {
      // First time login, create the template
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        username: cleanUsername,
        displayName: displayName || user.displayName || cleanUsername,
        leetcodeHandle: '',
        codeforcesHandle: '',
        githubHandle: '',
        codechefHandle: '',
        friends: [],
        lastLogin: serverTimestamp(),
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : serverTimestamp()
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        await saveUserToFirestore(userCredential.user, userCredential.user.displayName)
        navigate('/dashboard')
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(userCredential.user, { displayName: username })
        await saveUserToFirestore(userCredential.user, username)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      await saveUserToFirestore(result.user, result.user.displayName)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymousSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signInAnonymously(auth)
      await saveUserToFirestore(result.user, 'GuestCoder')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '40px 0' }}
    >
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: isLogin ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: isLogin ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: !isLogin ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              color: !isLogin ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            style={{ 
              background: 'rgba(255, 51, 102, 0.1)', 
              border: '1px solid var(--accent-primary)', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff809f',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ position: 'relative' }}
              >
                <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Username" 
                  required={!isLogin}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (error) setError('')
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '16px 16px 16px 48px', 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px',
                    color: 'white',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              style={{ 
                width: '100%', 
                padding: '16px 16px 16px 48px', 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }} 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError('')
              }}
              style={{ 
                width: '100%', 
                padding: '16px 16px 16px 48px', 
                background: 'rgba(0,0,0,0.2)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                fontFamily: 'inherit'
              }} 
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary" 
            type="submit"
            disabled={loading}
            style={{ 
              marginTop: '12px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              background: isLogin ? 'linear-gradient(135deg, var(--accent-primary), #d01144)' : 'linear-gradient(135deg, var(--accent-secondary), #00b3cc)',
              boxShadow: isLogin ? '0 0 20px rgba(255, 51, 102, 0.4)' : '0 0 20px rgba(0, 240, 255, 0.4)',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? <><LogIn size={18} /> Login</> : <><UserPlus size={18} /> Sign Up</>)}
          </motion.button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-main)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
          >
            <GoogleIcon /> Continue with Google
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnonymousSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.color = 'var(--text-main)')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Ghost size={18} /> Continue as Guest
          </motion.button>
        </div>

      </div>
    </motion.div>
  )
}

export default Auth
