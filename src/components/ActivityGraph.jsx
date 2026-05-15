import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const ActivityGraph = ({ username, platform }) => {
  const [dailySubmissions, setDailySubmissions] = useState({})
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [loading, setLoading] = useState(true)

  const getPlatformColors = () => {
    switch(platform) {
      case 'leetcode': return ['#2c2c2c', '#0e4429', '#006d32', '#26a641', '#39d353']
      case 'codeforces': return ['#2c2c2c', '#153c5c', '#1f5f8b', '#2682bf', '#34a5f6']
      case 'github': return ['#2c2c2c', '#0e4429', '#006d32', '#26a641', '#39d353']
      case 'codechef': return ['#2c2c2c', '#4a3b32', '#6b5141', '#8c6851', '#b38262']
      default: return ['#2c2c2c', '#333', '#555', '#777', '#999']
    }
  }

  const getActivityColor = (submissions) => {
    const colors = getPlatformColors()
    if (submissions === 0) return colors[0]
    if (submissions <= 2) return colors[1]
    if (submissions <= 5) return colors[2]
    if (submissions <= 8) return colors[3]
    return colors[4]
  }

  useEffect(() => {
    if (!username || !platform) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const normalizedDailyData = {}
        let total = 0

        if (platform === 'leetcode') {
          const res = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`)
          const data = await res.json()
          if (data.submissionCalendar) {
            const parsed = JSON.parse(data.submissionCalendar)
            Object.keys(parsed).forEach(ts => {
              const dateStr = new Date(parseInt(ts) * 1000).toLocaleDateString('en-CA')
              normalizedDailyData[dateStr] = (normalizedDailyData[dateStr] || 0) + parsed[ts]
              total += parsed[ts]
            })
          }
        } 
        else if (platform === 'codeforces') {
          const res = await fetch(`https://codeforces.com/api/user.status?handle=${username}`)
          const data = await res.json()
          if (data.status === 'OK') {
            data.result.forEach(submission => {
              if (submission.verdict === 'OK') {
                const dateStr = new Date(submission.creationTimeSeconds * 1000).toLocaleDateString('en-CA')
                normalizedDailyData[dateStr] = (normalizedDailyData[dateStr] || 0) + 1
                total += 1
              }
            })
          }
        }
        else if (platform === 'github') {
          // GitHub Contributions via public proxy (no auth needed)
          try {
            const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
            const data = await res.json()
            if (data && data.contributions) {
              data.contributions.forEach(day => {
                if (day.count > 0) {
                  normalizedDailyData[day.date] = day.count
                  total += day.count
                }
              })
            }
          } catch(e) {
            // Fallback: try alternate proxy
            try {
              const res2 = await fetch(`https://github-contributions-api.deno.dev/${username}.json`)
              const data2 = await res2.json()
              if (data2 && data2.contributions) {
                data2.contributions.forEach(contrib => {
                  normalizedDailyData[contrib.date] = contrib.contributionCount
                  total += contrib.contributionCount
                })
              }
            } catch(e2) { console.warn('GitHub API failed:', e2) }
          }
        }
        else if (platform === 'codechef') {
          // CodeChef via unofficial community API
          try {
            const res = await fetch(`https://codechef-api.vercel.app/handle/${username}`)
            const data = await res.json()
            if (data && data.heatMap) {
              data.heatMap.forEach(entry => {
                // entry: { date: "YYYY-MM-DD", value: N }
                if (entry.value > 0) {
                  normalizedDailyData[entry.date] = entry.value
                  total += entry.value
                }
              })
            }
          } catch(e) { console.warn('CodeChef API failed:', e) }
        }
        else if (platform === 'atcoder') {
          // AtCoder via Kenkoooo AtCoder Problems API (community standard)
          try {
            const res = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${username}&epoch_second=0`)
            const data = await res.json()
            if (Array.isArray(data)) {
              data.forEach(submission => {
                if (submission.result === 'AC') {
                  const dateStr = new Date(submission.epoch_second * 1000).toLocaleDateString('en-CA')
                  normalizedDailyData[dateStr] = (normalizedDailyData[dateStr] || 0) + 1
                  total += 1
                }
              })
            }
          } catch(e) { console.warn('AtCoder API failed:', e) }
        }

        setDailySubmissions(normalizedDailyData)
        setTotalSubmissions(total)
      } catch (err) {
        console.error(`Failed to fetch ${platform} stats:`, err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username, platform])

  const generateGrid = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(today)
    startDate.setFullYear(today.getFullYear() - 1)
    
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1)
    }

    const rawWeeks = []
    let currentDate = new Date(startDate)

    for (let w = 0; w < 53; w++) {
      const weekDays = []
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toLocaleDateString('en-CA')
        const isFuture = currentDate > today
        
        weekDays.push({
          dateStr,
          dateLabel: currentDate.toDateString(),
          isFuture,
          submissions: isFuture ? 0 : (dailySubmissions[dateStr] || 0),
          monthIndex: currentDate.getMonth(),
          monthName: currentDate.toLocaleString('default', { month: 'short' })
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
      rawWeeks.push(weekDays)
      if (currentDate > today && currentDate.getDay() === 0) break
    }

    const finalWeeks = []
    let lastSeenMonth = -1
    rawWeeks.forEach((week) => {
      const weekStartMonth = week[0].monthIndex
      let isNewMonth = false
      let monthLabel = null

      if (weekStartMonth !== lastSeenMonth) {
        if (lastSeenMonth !== -1) isNewMonth = true
        monthLabel = week[0].monthName
        lastSeenMonth = weekStartMonth
      }
      finalWeeks.push({ days: week, isNewMonth, monthLabel })
    })

    return finalWeeks
  }

  const weeks = generateGrid()
  const pName = platform.charAt(0).toUpperCase() + platform.slice(1)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '24px', marginBottom: '40px', overflow: 'hidden', background: 'rgba(20,20,30, 0.8)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500 }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>{totalSubmissions}</span> {pName} activity in the past one year
        </h3>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {loading && 'Syncing...'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginRight: '4px', marginLeft: week.isNewMonth ? '12px' : '0px', position: 'relative' }}>
            {week.days.map((day, dayIdx) => (
              <motion.div key={`${weekIdx}-${dayIdx}`} whileHover={{ scale: day.isFuture ? 1 : 1.2, zIndex: 10 }}
                style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: day.isFuture ? 'transparent' : getActivityColor(day.submissions), cursor: day.isFuture ? 'default' : 'pointer' }}
                title={day.isFuture ? '' : `${day.submissions} activity on ${day.dateLabel}`}
              />
            ))}
            {week.monthLabel && <div style={{ position: 'absolute', bottom: '-25px', left: '0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{week.monthLabel}</div>}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default ActivityGraph
