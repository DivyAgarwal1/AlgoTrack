import React, { useMemo } from 'react';

export default function ActivityHeatmap({ data = [] }) {
  const { grid, maxStreak, activeDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const counts = {};
    data.forEach(ts => {
      const d = new Date(ts * 1000);
      d.setHours(0, 0, 0, 0);
      const key = d.getTime();
      counts[key] = (counts[key] || 0) + 1;
    });

    const msPerDay = 24 * 60 * 60 * 1000;
    
    let maxStreak = 0;
    let currentStreak = 0;
    let activeDays = 0;
    
    const sortedKeys = Object.keys(counts).map(Number).sort((a,b)=>a-b);
    let lastDate = null;
    
    sortedKeys.forEach(ts => {
      activeDays++;
      
      if (!lastDate) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round((ts - lastDate) / msPerDay);
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      lastDate = ts;
    });

    const days = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today.getTime() - i * msPerDay);
      const key = d.getTime();
      days.push({
        date: d,
        count: counts[key] || 0
      });
    }

    const grid = [];
    let currentWeek = [];
    
    const firstDay = days[0].date.getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null);
    }
    
    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }
    
    return { grid, maxStreak, activeDays };
  }, [data]);

  const getColor = (count) => {
    if (count === 0) return 'var(--bg-main)';
    if (count === 1) return '#9be9a8';
    if (count <= 3) return '#40c463';
    if (count <= 6) return '#30a14e';
    return '#216e39';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="glass animation-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--text-muted)' }}>
          <strong style={{color: 'var(--text-main)', fontSize: '1.25rem'}}>{data.length}</strong> submissions in the past one year
        </h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem' }}>
          <span>Total active days: <strong style={{color: 'var(--text-main)'}}>{activeDays}</strong></span>
          <span>Max streak: <strong style={{color: 'var(--text-main)'}}>{maxStreak}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', paddingTop: '16px', paddingRight: '8px' }}>
          <div style={{ height: '12px' }}>Sun</div>
          <div style={{ height: '12px' }}></div>
          <div style={{ height: '12px' }}>Tue</div>
          <div style={{ height: '12px' }}></div>
          <div style={{ height: '12px' }}>Thu</div>
          <div style={{ height: '12px' }}></div>
          <div style={{ height: '12px' }}>Sat</div>
        </div>
        
        {grid.map((week, i) => {
          const firstDayInWeek = week.find(d => d !== null);
          const isFirstWeekOfMonth = firstDayInWeek && firstDayInWeek.date.getDate() <= 7 && i % 4 === 0; 
          
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ height: '12px', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {isFirstWeekOfMonth ? months[firstDayInWeek.date.getMonth()] : ''}
              </div>
              {week.map((day, j) => (
                <div 
                  key={j} 
                  title={day ? `${day.count} submissions on ${day.date.toLocaleDateString()}` : ''}
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '3px',
                    background: day ? getColor(day.count) : 'transparent',
                    border: day && day.count === 0 ? '1px solid var(--border-color)' : '1px solid rgba(27,31,35,0.06)'
                  }} 
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}