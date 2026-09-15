import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ExternalLink, Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { fetchAllContests } from '../lib/api';

export default function Calendar() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [registered, setRegistered] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('registeredContests')) || {};
    } catch { return {}; }
  });

  useEffect(() => {
    setLoading(true);
    fetchAllContests()
      .then(data => {
        setContests(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleRegistered = (id) => {
    const newReg = { ...registered, [id]: !registered[id] };
    setRegistered(newReg);
    localStorage.setItem('registeredContests', JSON.stringify(newReg));
  };

  const formatDate = (ts) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(ts).toLocaleDateString(undefined, options);
  };
  
  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPlatformColor = (platform) => {
    if (platform === 'Codeforces') return '#3b82f6';
    if (platform === 'LeetCode') return '#eab308';
    if (platform === 'AtCoder') return '#22c55e';
    return 'var(--accent-primary)';
  };
  
  const getPlatformRGB = (platform) => {
    if (platform === 'Codeforces') return '59, 130, 246';
    if (platform === 'LeetCode') return '234, 179, 8';
    if (platform === 'AtCoder') return '34, 197, 94';
    return '59, 130, 246';
  };

  const getPlatformShortName = (name) => {
    const n = name.toLowerCase();
    if (n.includes('div. 1')) return 'Div 1';
    if (n.includes('div. 2')) return 'Div 2';
    if (n.includes('div. 3')) return 'Div 3';
    if (n.includes('div. 4')) return 'Div 4';
    if (n.includes('biweekly')) return 'Biweekly';
    if (n.includes('weekly')) return 'Weekly';
    if (n.includes('beginner')) return 'ABC';
    if (n.includes('regular')) return 'ARC';
    if (n.includes('grand')) return 'AGC';
    return name.slice(0, 8) + '..';
  };

  // Calendar Grid Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="animation-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <CalendarIcon size={32} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Contest Calendar</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '500px', borderRadius: '16px', width: '100%' }} />
          <div className="skeleton" style={{ height: '100px', borderRadius: '16px', width: '100%' }} />
        </div>
      ) : (
        <>
          {/* Visual Calendar Grid */}
          <div className="glass" style={{ padding: '2rem', marginBottom: '3rem', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button onClick={prevMonth} className="hover-scale" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', padding: '0.6rem' }}><ChevronLeft size={20}/></button>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="hover-scale" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-main)', padding: '0.6rem' }}><ChevronRight size={20}/></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1rem', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', gap: '0.75rem' }}>
              {blanks.map((_, i) => <div key={`blank-${i}`} style={{ minHeight: '120px', padding: '0.5rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }} />)}
              {days.map(day => {
                const dateObj = new Date(year, month, day);
                const todayObj = new Date();
                const isToday = todayObj.toDateString() === dateObj.toDateString();
                const isPast = dateObj < new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
                
                const dayContests = contests.filter(c => {
                  const d = new Date(c.startTime);
                  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                });
                
                return (
                  <div key={day} style={{ 
                    minHeight: '120px', 
                    padding: '0.75rem', 
                    borderRadius: '12px', 
                    background: isPast ? 'rgba(0,0,0,0.3)' : (isToday ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-card)'),
                    border: isToday ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    opacity: isPast ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }} className={!isPast ? "hover-scale" : ""}>
                    <div style={{ 
                      fontWeight: '700', 
                      marginBottom: '0.75rem', 
                      color: isToday ? '#fff' : 'var(--text-muted)', 
                      alignSelf: 'flex-end', 
                      fontSize: '1rem',
                      background: isToday ? 'var(--accent-primary)' : 'transparent',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      flexShrink: 0
                    }}>{day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto' }}>
                      {dayContests.map(c => (
                        <a key={c.id} href={c.url} target="_blank" rel="noreferrer" style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.4rem 0.5rem', 
                          borderRadius: '6px', 
                          background: `rgba(${getPlatformRGB(c.platform)}, 0.15)`,
                          border: `1px solid rgba(${getPlatformRGB(c.platform)}, 0.3)`,
                          color: getPlatformColor(c.platform), 
                          textDecoration: 'none',
                          fontWeight: '600',
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textAlign: 'left'
                        }} title={c.name}>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getPlatformShortName(c.name)}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.8, whiteSpace: 'nowrap' }}>{formatTime(c.startTime)}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Upcoming Contests</h3>
            <div style={{ height: '1px', flex: 1, background: 'var(--glass-border)' }}></div>
          </div>
          
          {/* List of Contests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contests.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: '16px' }}>No upcoming contests found.</p>}
            {contests.map((contest) => {
              const isRegistered = registered[contest.id];
              return (
                <div key={contest.id} className="glass" style={{ 
                  padding: '1.5rem 2rem', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isRegistered ? `rgba(${getPlatformRGB(contest.platform)}, 0.08)` : 'var(--glass-bg)',
                  border: isRegistered ? `1px solid rgba(${getPlatformRGB(contest.platform)}, 0.3)` : '1px solid var(--glass-border)',
                  borderLeft: `4px solid ${getPlatformColor(contest.platform)}`,
                  borderRadius: '16px',
                  transition: 'all 0.3s ease'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.6rem', color: isRegistered ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: isRegistered ? 'line-through' : 'none' }}>
                      {contest.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', color: getPlatformColor(contest.platform) }}>
                        {contest.platform}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '500' }}>
                        <Clock size={15} /> {formatDate(contest.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={() => toggleRegistered(contest.id)}
                      className="hover-scale"
                      style={{
                        padding: '0.6rem 1rem',
                        background: isRegistered ? `rgba(${getPlatformRGB(contest.platform)}, 0.2)` : 'rgba(255,255,255,0.05)',
                        border: isRegistered ? `1px solid ${getPlatformColor(contest.platform)}` : '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        color: isRegistered ? getPlatformColor(contest.platform) : 'var(--text-main)',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle size={16} />
                      {isRegistered ? 'Registered' : 'Mark Registered'}
                    </button>
                    <a 
                      href={contest.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="hover-scale"
                      style={{
                        padding: '0.6rem 1.2rem',
                        background: getPlatformColor(contest.platform),
                        boxShadow: `0 4px 15px rgba(${getPlatformRGB(contest.platform)}, 0.3)`,
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <ExternalLink size={16} /> Link
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
