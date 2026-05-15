import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, CheckCircle, XCircle } from 'lucide-react'
import { db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

const StreakCard = ({ friendHandle, myHandle, platform, onRemove }) => {
  const [friendData, setFriendData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mutualStreak, setMutualStreak] = useState(0)
  const [myStatus, setMyStatus] = useState('pending')
  const [friendStatus, setFriendStatus] = useState('pending')
  const [myAvatarUrl, setMyAvatarUrl] = useState(null)

  useEffect(() => {
    if (!friendHandle || !myHandle || !platform) return

    const fetchAndCalculateStreak = async () => {
      try {
        setLoading(true)
        const myCal = {}
        const friendCal = {}

        // 1. Fetch friend's document from Firestore to get their exact platform handle
        const usersRef = collection(db, 'users')
        const q = query(usersRef, where('username', '==', friendHandle)) // friendHandle is the StreakSync username
        const querySnapshot = await getDocs(q)
        
        let actualFriendPlatformHandle = null
        if (!querySnapshot.empty) {
          const friendDoc = querySnapshot.docs[0].data()
          actualFriendPlatformHandle = friendDoc[`${platform}Handle`]
        }

        if (!actualFriendPlatformHandle) {
          // Friend hasn't linked this platform yet
          setFriendData({ name: friendHandle, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendHandle}` })
          setMutualStreak(0)
          setMyStatus('pending')
          setFriendStatus('pending')
          setLoading(false)
          return
        }

        if (platform === 'leetcode') {
          const [myRes, fRes, fProfileRes, myProfileRes] = await Promise.all([
            fetch(`https://alfa-leetcode-api.onrender.com/${myHandle}/calendar`),
            fetch(`https://alfa-leetcode-api.onrender.com/${actualFriendPlatformHandle}/calendar`),
            fetch(`https://alfa-leetcode-api.onrender.com/${actualFriendPlatformHandle}`),
            fetch(`https://alfa-leetcode-api.onrender.com/${myHandle}`)
          ])
          
          const myData = await myRes.json()
          const fData = await fRes.json()
          const fProfile = await fProfileRes.json()
          const myProfile = await myProfileRes.json()

          setFriendData({
            name: fProfile.name || friendHandle,
            avatarUrl: fProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendHandle}`
          })
          setMyAvatarUrl(myProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myHandle}`)

          const myParsed = JSON.parse(myData.submissionCalendar || "{}")
          const fParsed = JSON.parse(fData.submissionCalendar || "{}")

          Object.keys(myParsed).forEach(ts => myCal[new Date(parseInt(ts)*1000).toLocaleDateString('en-CA')] = myParsed[ts])
          Object.keys(fParsed).forEach(ts => friendCal[new Date(parseInt(ts)*1000).toLocaleDateString('en-CA')] = fParsed[ts])
        } 
        else if (platform === 'codeforces') {
          setFriendData({ name: friendHandle, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friendHandle}` })
          
          const [myRes, fRes] = await Promise.all([
            fetch(`https://codeforces.com/api/user.status?handle=${myHandle}`),
            fetch(`https://codeforces.com/api/user.status?handle=${actualFriendPlatformHandle}`)
          ])
          
          const myData = await myRes.json()
          const fData = await fRes.json()

          if (myData.status === 'OK') myData.result.forEach(s => { if (s.verdict === 'OK') myCal[new Date(s.creationTimeSeconds*1000).toLocaleDateString('en-CA')] = 1 })
          if (fData.status === 'OK') fData.result.forEach(s => { if (s.verdict === 'OK') friendCal[new Date(s.creationTimeSeconds*1000).toLocaleDateString('en-CA')] = 1 })
        }
        else if (platform === 'github') {
          // GitHub Contributions via public proxy
          setFriendData({ name: actualFriendPlatformHandle, avatarUrl: `https://avatars.githubusercontent.com/${actualFriendPlatformHandle}` })
          
          const parseGithubData = (data) => {
            const cal = {}
            if (data?.contributions) {
              data.contributions.forEach(day => { if (day.count > 0) cal[day.date] = day.count })
            }
            return cal
          }

          try {
            const [myRes, fRes] = await Promise.all([
              fetch(`https://github-contributions-api.jogruber.de/v4/${myHandle}?y=last`),
              fetch(`https://github-contributions-api.jogruber.de/v4/${actualFriendPlatformHandle}?y=last`)
            ])
            const myData = await myRes.json()
            const fData = await fRes.json()
            Object.assign(myCal, parseGithubData(myData))
            Object.assign(friendCal, parseGithubData(fData))
          } catch(e) { console.warn('GitHub streak fetch failed:', e) }
        }
        else if (platform === 'codechef') {
          // CodeChef via unofficial community API
          setFriendData({ name: actualFriendPlatformHandle, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${actualFriendPlatformHandle}` })
          
          const parseCodechefData = (data) => {
            const cal = {}
            if (data?.heatMap) {
              data.heatMap.forEach(entry => { if (entry.value > 0) cal[entry.date] = entry.value })
            }
            return cal
          }

          try {
            const [myRes, fRes] = await Promise.all([
              fetch(`https://codechef-api.vercel.app/handle/${myHandle}`),
              fetch(`https://codechef-api.vercel.app/handle/${actualFriendPlatformHandle}`)
            ])
            const myData = await myRes.json()
            const fData = await fRes.json()
            Object.assign(myCal, parseCodechefData(myData))
            Object.assign(friendCal, parseCodechefData(fData))
          } catch(e) { console.warn('CodeChef streak fetch failed:', e) }
        }
        else if (platform === 'atcoder') {
          // AtCoder via Kenkoooo API
          setFriendData({ name: actualFriendPlatformHandle, avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${actualFriendPlatformHandle}` })
          
          const parseAtcoderData = (data) => {
            const cal = {}
            if (Array.isArray(data)) {
              data.forEach(s => { if (s.result === 'AC') cal[new Date(s.epoch_second * 1000).toLocaleDateString('en-CA')] = 1 })
            }
            return cal
          }

          try {
            const [myRes, fRes] = await Promise.all([
              fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${myHandle}&epoch_second=0`),
              fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${actualFriendPlatformHandle}&epoch_second=0`)
            ])
            const myData = await myRes.json()
            const fData = await fRes.json()
            Object.assign(myCal, parseAtcoderData(myData))
            Object.assign(friendCal, parseAtcoderData(fData))
          } catch(e) { console.warn('AtCoder streak fetch failed:', e) }
        }

        let currentStreak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let checkingDate = new Date(today)
        let isToday = true
        
        while (true) {
          const dateStr = checkingDate.toLocaleDateString('en-CA')
          const mySubmissions = myCal[dateStr] || 0
          const friendSubmissions = friendCal[dateStr] || 0

          if (isToday) {
            setMyStatus(mySubmissions > 0 ? 'solved' : 'pending')
            setFriendStatus(friendSubmissions > 0 ? 'solved' : 'pending')
            if (mySubmissions > 0 && friendSubmissions > 0) currentStreak++
            isToday = false
          } else {
            if (mySubmissions > 0 && friendSubmissions > 0) currentStreak++
            else break 
          }
          checkingDate.setDate(checkingDate.getDate() - 1)
        }

        setMutualStreak(currentStreak)
      } catch (err) {
        console.error("Error fetching streak data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAndCalculateStreak()
  }, [friendHandle, myHandle, platform])

  if (loading) return <div className="glass-panel" style={{ padding: '24px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Syncing...</span></div>

  const isStreakAlive = mutualStreak > 0 || (myStatus !== 'failed' && friendStatus !== 'failed')
  const glowColor = mutualStreak > 0 ? 'rgba(255, 51, 102, 0.4)' : 'rgba(255, 255, 255, 0.05)'

  return (
    <motion.div 
      whileHover={{ scale: 1.02, translateY: -5 }} 
      className="glass-panel" 
      style={{ 
        padding: '32px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'linear-gradient(145deg, rgba(20,20,30,0.8) 0%, rgba(10,10,15,0.9) 100%)',
        borderTop: mutualStreak > 0 ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        boxShadow: `0 15px 35px -10px ${glowColor}`, 
        position: 'relative', 
        overflow: 'hidden' 
      }}
    >
      {/* Background glow behind VS */}
      {mutualStreak > 0 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', background: 'var(--accent-primary)', filter: 'blur(70px)', opacity: 0.25, borderRadius: '50%', pointerEvents: 'none' }} />}

      {mutualStreak === 0 && myStatus === 'pending' && friendStatus === 'pending' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(255, 161, 22, 0.2)', borderBottom: '1px solid rgba(255, 161, 22, 0.5)', color: '#ffa116', fontSize: '0.75rem', textAlign: 'center', padding: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
          START YOUR STREAK TODAY
        </div>
      )}
      
      {onRemove && (
        <button 
          onClick={() => onRemove(friendHandle)} 
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 10 }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,51,102,0.8)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          title="Remove Friend"
        >
          ✕
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative', zIndex: 1, marginTop: mutualStreak === 0 ? '16px' : '0' }}>
        
        {/* YOU */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <img src={myAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myHandle}`} alt="You" style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: myStatus === 'solved' ? '3px solid #00ff88' : '3px solid var(--border-color)', background: 'var(--bg-main)' }} />
            <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--bg-main)', borderRadius: '50%', padding: '2px', display: 'flex' }}>
              {myStatus === 'solved' ? <CheckCircle color="#00ff88" size={24} fill="rgba(0,255,136,0.2)" /> : <XCircle color="var(--text-muted)" size={24} fill="rgba(255,255,255,0.05)" />}
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>You</span>
        </div>

        {/* VS & STREAK */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '2px', marginBottom: '12px' }}>VS</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: mutualStreak > 0 ? 'rgba(255,51,102,0.1)' : 'rgba(255,255,255,0.05)', padding: '16px 24px', borderRadius: '20px', border: mutualStreak > 0 ? '1px solid rgba(255,51,102,0.3)' : '1px solid var(--border-color)', boxShadow: mutualStreak > 0 ? 'inset 0 0 20px rgba(255,51,102,0.1)' : 'none' }}>
            <Flame size={32} fill={mutualStreak > 0 ? "var(--accent-primary)" : "none"} color={mutualStreak > 0 ? "var(--accent-primary)" : "var(--text-muted)"} style={{ filter: mutualStreak > 0 ? 'drop-shadow(0 0 10px rgba(255,51,102,0.8))' : 'none' }} />
            <span style={{ fontWeight: 800, fontSize: '1.8rem', color: mutualStreak > 0 ? '#fff' : 'var(--text-muted)', marginTop: '4px' }}>{mutualStreak}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Days</span>
          </div>
        </div>

        {/* FRIEND */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <img src={friendData?.avatarUrl} alt={friendData?.name} style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: friendStatus === 'solved' ? '3px solid #00ff88' : '3px solid var(--border-color)', background: 'var(--bg-main)' }} />
            <div style={{ position: 'absolute', bottom: -5, left: -5, background: 'var(--bg-main)', borderRadius: '50%', padding: '2px', display: 'flex' }}>
               {friendStatus === 'solved' ? <CheckCircle color="#00ff88" size={24} fill="rgba(0,255,136,0.2)" /> : <XCircle color="var(--text-muted)" size={24} fill="rgba(255,255,255,0.05)" />}
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }} title={friendData?.name}>{friendData?.name}</span>
        </div>

      </div>
    </motion.div>
  )
}

export default StreakCard
