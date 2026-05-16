import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { auth, db } from '../firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { User, Users, Flame, Code2, Terminal, Code, Cpu, Trophy, Edit2, X } from 'lucide-react'
import { updateDoc } from 'firebase/firestore'

const Profile = () => {
  const { username } = useParams()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [followersList, setFollowersList] = useState([])   // [{ username, displayName, syncedAvatar }]
  const [followingList, setFollowingList] = useState([])   // [{ username, displayName, syncedAvatar }]
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  
  const [activityCounts, setActivityCounts] = useState({ lc: {}, cf: {}, gh: {}, cc: {}, ac: {} })
  const [activeGraphPlatform, setActiveGraphPlatform] = useState('all')
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Social Modals State
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthChecked(true)
      if (currentUser) {
        setUser(currentUser)
        
        try {
          let docSnap = null
          
          if (username) {
            // Public profile mode
            const usersRef = collection(db, 'users')
            const q = query(usersRef, where('username', '==', username))
            const snap = await getDocs(q)
            if (!snap.empty) {
              docSnap = snap.docs[0]
            } else {
              setUserData(null) // Not found
              setLoading(false)
              return
            }
          } else {
            // Own profile mode
            const docRef = doc(db, 'users', currentUser.uid)
            docSnap = await getDoc(docRef)
          }
          
          if (docSnap && docSnap.exists()) {
            const data = docSnap.data()
            setUserData(data)
            
            // Fetch Followers (users who have THIS username in their friends array)
            if (data.username) {
              const usersRef = collection(db, 'users')
              const q = query(usersRef, where('friends', 'array-contains', data.username))
              const querySnapshot = await getDocs(q)
              
              const followers = []
              querySnapshot.forEach(fdoc => {
                const fd = fdoc.data()
                followers.push({
                  username: fd.username,
                  displayName: fd.displayName || fd.username,
                  syncedAvatar: fd.syncedAvatar || null
                })
              })
              setFollowersList(followers)
              setFollowersCount(followers.length)
            }

            // Fetch Following (rich data for each friend username)
            if (data.friends && data.friends.length > 0) {
              const usersRef2 = collection(db, 'users')
              const q2 = query(usersRef2, where('username', 'in', data.friends.slice(0, 10)))
              const querySnapshot2 = await getDocs(q2)
              const following = []
              querySnapshot2.forEach(fdoc => {
                const fd = fdoc.data()
                following.push({
                  username: fd.username,
                  displayName: fd.displayName || fd.username,
                  syncedAvatar: fd.syncedAvatar || null
                })
              })
              // Preserve original order from friends array
              const ordered = data.friends.map(uname =>
                following.find(f => f.username === uname) || { username: uname, displayName: uname, syncedAvatar: null }
              )
              setFollowingList(ordered)
            }

            // Fetch Universal Graph Data (LeetCode + Codeforces)
            const lcCounts = {}
            const cfCounts = {}

            // 1. Fetch LeetCode
            if (data.leetcodeHandle) {
              try {
                // Fetch profile to get real avatar
                const profileRes = await fetch(`https://alfa-leetcode-api.onrender.com/${data.leetcodeHandle}`)
                const profileData = await profileRes.json()
                if (profileData.avatar) {
                  setUserData(prev => ({ ...prev, syncedAvatar: profileData.avatar }))
                  // Persist to Firestore only on own profile so others see the real avatar
                  if (!username) {
                    try {
                      await updateDoc(doc(db, 'users', currentUser.uid), { syncedAvatar: profileData.avatar })
                    } catch(_) {}
                  }
                }

                const res = await fetch(`https://alfa-leetcode-api.onrender.com/${data.leetcodeHandle}/calendar`)
                const calData = await res.json()
                if (calData.submissionCalendar) {
                  const parsed = JSON.parse(calData.submissionCalendar)
                  Object.keys(parsed).forEach(pTs => {
                     const dateStr = new Date(parseInt(pTs)*1000).toLocaleDateString('en-CA')
                     lcCounts[dateStr] = (lcCounts[dateStr] || 0) + parsed[pTs]
                  })
                }
              } catch(e) { console.error(e) }
            }

            // 2. Fetch Codeforces
            if (data.codeforcesHandle) {
              try {
                const res = await fetch(`https://codeforces.com/api/user.status?handle=${data.codeforcesHandle}`)
                const cfData = await res.json()
                if (cfData.status === 'OK') {
                  cfData.result.forEach(sub => {
                     // Codeforces creationTimeSeconds
                     const dateStr = new Date(sub.creationTimeSeconds * 1000).toLocaleDateString('en-CA')
                     cfCounts[dateStr] = (cfCounts[dateStr] || 0) + 1
                  })
                }
              } catch(e) { console.error(e) }
            }

            // 3. Fetch GitHub
            if (data.githubHandle) {
              try {
                const ghRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${data.githubHandle}?y=last`)
                const ghData = await ghRes.json()
                const ghCounts = {}
                if (ghData?.contributions) {
                  ghData.contributions.forEach(day => { if (day.count > 0) ghCounts[day.date] = day.count })
                }
                setActivityCounts(prev => ({ ...prev, gh: ghCounts }))
              } catch(e) { console.error(e) }
            }

            // 4. Fetch CodeChef
            if (data.codechefHandle) {
              try {
                const ccRes = await fetch(`https://codechef-api.vercel.app/handle/${data.codechefHandle}`)
                const ccData = await ccRes.json()
                const ccCounts = {}
                if (ccData?.heatMap) {
                  ccData.heatMap.forEach(entry => { if (entry.value > 0) ccCounts[entry.date] = entry.value })
                }
                setActivityCounts(prev => ({ ...prev, cc: ccCounts }))
              } catch(e) { console.error(e) }
            }

            // 5. Fetch AtCoder
            if (data.atcoderHandle) {
              try {
                const acRes = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${data.atcoderHandle}&epoch_second=0`)
                const acData = await acRes.json()
                const acCounts = {}
                if (Array.isArray(acData)) {
                  acData.forEach(s => { if (s.result === 'AC') { const d = new Date(s.epoch_second * 1000).toLocaleDateString('en-CA'); acCounts[d] = (acCounts[d] || 0) + 1 } })
                }
                setActivityCounts(prev => ({ ...prev, ac: acCounts }))
              } catch(e) { console.error(e) }
            }

            setActivityCounts(prev => ({ ...prev, lc: lcCounts, cf: cfCounts }))
          } else if (!username) {
            // Own profile doc doesn't exist yet in Firestore
            console.warn('User Firestore document not found for uid:', currentUser.uid)
          }
        } catch (err) {
          console.error("Error fetching profile data", err)
        }
      } else {
        // Only redirect if auth has been checked and user is truly not logged in
        navigate('/auth')
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [navigate, username])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!editName.trim()) return
    setIsSaving(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        displayName: editName.trim()
      })
      setUserData(prev => ({ ...prev, displayName: editName.trim() }))
      setShowEditModal(false)
    } catch (err) {
      console.error("Error updating profile", err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!authChecked || loading) return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>Loading Profile...</div>
  if (!userData) return (
    <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Profile Not Found</div>
      <div style={{ fontSize: '1rem' }}>No user document found. Try signing out and back in.</div>
    </div>
  )

  // Calculate dynamic activity data based on selected platform
  const weekData = []
  let currentStreak = 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let isToday = true
  let checkingDate = new Date(today)
  
  const getCountForDate = (dateStr) => {
    let count = 0
    if (activeGraphPlatform === 'all' || activeGraphPlatform === 'leetcode') count += activityCounts.lc[dateStr] || 0
    if (activeGraphPlatform === 'all' || activeGraphPlatform === 'codeforces') count += activityCounts.cf[dateStr] || 0
    if (activeGraphPlatform === 'all' || activeGraphPlatform === 'github') count += activityCounts.gh[dateStr] || 0
    if (activeGraphPlatform === 'all' || activeGraphPlatform === 'codechef') count += activityCounts.cc[dateStr] || 0
    if (activeGraphPlatform === 'all' || activeGraphPlatform === 'atcoder') count += activityCounts.ac[dateStr] || 0
    return count
  }

  while(true) {
     const dateStr = checkingDate.toLocaleDateString('en-CA')
     const count = getCountForDate(dateStr)

     if (isToday) {
        if (count > 0) currentStreak++
        isToday = false
     } else {
        if (count > 0) currentStreak++
        else break
     }
     checkingDate.setDate(checkingDate.getDate() - 1)
  }

  for (let i = 6; i >= 0; i--) {
     const d = new Date(today)
     d.setDate(d.getDate() - i)
     const dateStr = d.toLocaleDateString('en-CA')
     weekData.push({
       dayName: d.toLocaleString('default', { weekday: 'short' }),
       count: getCountForDate(dateStr)
     })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 0' }}
    >
      
      {/* Profile Header */}
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '32px' }}>
        <img 
          src={userData.syncedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`} 
          alt="Avatar" 
          style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--accent-primary)', objectFit: 'cover', background: 'var(--bg-main)' }} 
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{userData.displayName || userData.username}</h1>
            {!username && (
              <button 
                onClick={() => { setEditName(userData.displayName || userData.username); setShowEditModal(true) }} 
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '8px', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}
                title="Edit Profile"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={16} /> Joined {
              userData.createdAt?.toDate 
                ? userData.createdAt.toDate().toLocaleDateString() 
                : userData.createdAt?.seconds 
                  ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() 
                  : 'Recently'
            }
          </p>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div 
              onClick={() => setShowFollowingModal(true)}
              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '12px', transition: 'all 0.2s', alignItems: 'center' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{userData.friends?.length || 0}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Following</span>
            </div>
            <div 
              onClick={() => setShowFollowersModal(true)}
              style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '12px', transition: 'all 0.2s', alignItems: 'center' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{followersCount}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Line Chart Widget */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Activity Graph (Last 7 Days)</h3>
          <select 
            value={activeGraphPlatform} 
            onChange={(e) => setActiveGraphPlatform(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', outline: 'none', cursor: 'pointer', appearance: 'none' }}
          >
            <option value="all" style={{ background: '#111' }}>Universal (All)</option>
            <option value="leetcode" style={{ background: '#111' }}>LeetCode</option>
            <option value="codeforces" style={{ background: '#111' }}>Codeforces</option>
            <option value="github" style={{ background: '#111' }}>GitHub</option>
            <option value="codechef" style={{ background: '#111' }}>CodeChef</option>
            <option value="atcoder" style={{ background: '#111' }}>AtCoder</option>
          </select>
        </div>
        <ActivityLineChart data={weekData} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        
        {/* Duolingo Style Streak Widget */}
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255, 161, 22, 0.2)', padding: '16px', borderRadius: '50%' }}>
              <Flame size={48} color="#ffa116" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#ffa116' }}>{currentStreak}</h2>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Day Streak</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 16px' }}>
            {weekData.map((day, idx) => {
              // Handle uninitialized array
              if (typeof day === 'number') return null; 
              
              const isActive = day.count > 0;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    background: isActive ? '#ffa116' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    fontWeight: 'bold',
                    boxShadow: isActive ? '0 0 10px rgba(255,161,22,0.5)' : 'none'
                  }}>
                    {isActive && <CheckCircle2 size={16} />}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{day.dayName[0]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Linked Accounts Widget */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={20} color="var(--accent-secondary)" /> Connected Profiles
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* LeetCode */}
            {userData.leetcodeHandle && (() => {
              const handle = userData.leetcodeHandle
              return (
                <a href={`https://leetcode.com/${handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,161,22,0.08)', borderRadius: '12px', border: '1px solid rgba(255,161,22,0.3)', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,161,22,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,161,22,0.08)'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,161,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Code2 color="#ffa116" size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>LeetCode</div>
                      <div style={{ color: '#ffa116', fontSize: '0.85rem' }}>@{handle}</div>
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                  </div>
                </a>
              )
            })()}

            {/* Codeforces */}
            {userData.codeforcesHandle && (() => {
              const handle = userData.codeforcesHandle
              return (
                <a href={`https://codeforces.com/profile/${handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(31,138,203,0.08)', borderRadius: '12px', border: '1px solid rgba(31,138,203,0.3)', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(31,138,203,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(31,138,203,0.08)'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(31,138,203,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Terminal color="#1f8acb" size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Codeforces</div>
                      <div style={{ color: '#1f8acb', fontSize: '0.85rem' }}>@{handle}</div>
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                  </div>
                </a>
              )
            })()}

            {/* GitHub */}
            {userData.githubHandle && (() => {
              const handle = userData.githubHandle
              return (
                <a href={`https://github.com/${handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Code color="#ffffff" size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>GitHub</div>
                      <div style={{ color: '#fff', fontSize: '0.85rem' }}>@{handle}</div>
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                  </div>
                </a>
              )
            })()}

            {/* CodeChef */}
            {userData.codechefHandle && (() => {
              const handle = userData.codechefHandle
              return (
                <a href={`https://codechef.com/users/${handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(90,50,20,0.2)', borderRadius: '12px', border: '1px solid rgba(180,100,30,0.4)', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(90,50,20,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(90,50,20,0.2)'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(180,100,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Cpu color="#b46c1e" size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>CodeChef</div>
                      <div style={{ color: '#b46c1e', fontSize: '0.85rem' }}>@{handle}</div>
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                  </div>
                </a>
              )
            })()}

            {/* AtCoder */}
            {userData.atcoderHandle && (() => {
              const handle = userData.atcoderHandle
              return (
                <a href={`https://atcoder.jp/users/${handle}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(100,200,255,0.05)', borderRadius: '12px', border: '1px solid rgba(100,200,255,0.3)', transition: 'all 0.2s', cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(100,200,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(100,200,255,0.05)'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(100,200,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Code2 color="#64c8ff" size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>AtCoder</div>
                      <div style={{ color: '#64c8ff', fontSize: '0.85rem' }}>@{userData.atcoderHandle}</div>
                    </div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                  </div>
                </a>
              )
            })()}
          </div>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setShowEditModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            <h3 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Edit Profile</h3>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Display Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', outline: 'none' }} 
                />
              </div>
              <button className="btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Following List Modal */}
      {showFollowingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px', position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setShowFollowingModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            <h3 style={{ marginBottom: '24px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} color="var(--accent-primary)" /> Following</h3>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(!userData.friends || userData.friends.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{username ? 'They aren\'t following anyone.' : 'You aren\'t following anyone yet.'}</p>
              ) : (
                followingList.map((friend, idx) => (
                  <Link to={`/profile/${friend.username}`} key={idx} onClick={() => setShowFollowingModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                    <img
                      src={friend.syncedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                      alt={friend.displayName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-main)', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{friend.displayName}</span>
                      {friend.displayName !== friend.username && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{friend.username}</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Followers List Modal */}
      {showFollowersModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '400px', position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => setShowFollowersModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            <h3 style={{ marginBottom: '24px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} color="var(--accent-primary)" /> Followers</h3>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {followersList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{username ? 'They don\'t have any followers yet.' : 'You don\'t have any followers yet.'}</p>
              ) : (
                followersList.map((follower, idx) => (
                  <Link to={`/profile/${follower.username}`} key={idx} onClick={() => setShowFollowersModal(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                    <img
                      src={follower.syncedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${follower.username}`}
                      alt={follower.displayName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-main)', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{follower.displayName}</span>
                      {follower.displayName !== follower.username && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{follower.username}</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </motion.div>
  )
}

// Custom Line Chart Component
const ActivityLineChart = ({ data }) => {
  // Check if data is populated
  if (!data || data.length === 0 || typeof data[0] === 'number') return <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>Loading graph...</div>;
  
  const maxSubmissions = Math.max(...data.map(d => d.count), 5);
  const width = 700;
  const height = 200;
  const padding = 40;
  
  const getX = (index) => padding + (index * ((width - padding * 2) / (data.length - 1)));
  const getY = (count) => height - padding - (count / maxSubmissions) * (height - padding * 2);
  
  const points = data.map((d, i) => `${getX(i)},${getY(d.count)}`).join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ minWidth: '500px' }}>
        {/* Horizontal Grid lines */}
        {[0, 0.5, 1].map(ratio => (
          <line 
            key={ratio}
            x1={padding} 
            y1={height - padding - (height - padding*2)*ratio} 
            x2={width - padding} 
            y2={height - padding - (height - padding*2)*ratio} 
            stroke="rgba(255,255,255,0.1)" 
            strokeDasharray="4 4"
          />
        ))}
        {/* X-Axis Line */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        
        {/* Line Data */}
        <polyline 
          points={points} 
          fill="none" 
          stroke="var(--accent-primary)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(d.count)} r="6" fill="#14141e" stroke="var(--accent-primary)" strokeWidth="3" />
            <text x={getX(i)} y={height - 15} fill="var(--text-muted)" fontSize="12" textAnchor="middle">{d.dayName}</text>
            {d.count > 0 && <text x={getX(i)} y={getY(d.count) - 15} fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">{d.count}</text>}
          </g>
        ))}
      </svg>
    </div>
  )
}

// Quick inline icon component to avoid importing if not available
const CheckCircle2 = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default Profile
