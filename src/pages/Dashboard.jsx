import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Target, Activity, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchCodeforcesData, fetchLeetcodeData, fetchAtcoderData, fetchWithCache } from '../lib/api';
import { useInView } from '../lib/useInView';
import { useAuth } from '../context/AuthContext';
import ActivityHeatmap from '../components/ActivityHeatmap';

const CodeforcesLogo = () => <span style={{fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '0.9em'}}><span style={{color: '#333'}}>Code</span><span style={{color: '#3b82f6'}}>forces</span></span>;
const LeetCodeLogo = () => <span style={{fontFamily: 'Helvetica, sans-serif', fontWeight: 600, fontSize: '0.9em'}}><span style={{color: '#333'}}>Leet</span><span style={{color: '#eab308'}}>Code</span></span>;
const AtCoderLogo = () => <span style={{fontFamily: 'Verdana, sans-serif', fontWeight: 700, fontSize: '0.9em'}}><span style={{color: '#333'}}>At</span><span style={{color: '#10b981'}}>Coder</span></span>;

const platforms = [
  { id: 'codeforces', name: 'Codeforces', color: '#3b82f6', rgb: '59, 130, 246', logo: <CodeforcesLogo />, fetcher: fetchCodeforcesData },
  { id: 'leetcode', name: 'LeetCode', color: '#eab308', rgb: '234, 179, 8', logo: <LeetCodeLogo />, fetcher: fetchLeetcodeData },
  { id: 'atcoder', name: 'AtCoder', color: '#22c55e', rgb: '34, 197, 94', logo: <AtCoderLogo />, fetcher: fetchAtcoderData }
];

function CustomTooltip({ active, payload, label, color }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', zIndex: 1000 }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{label}</p>
        {data.contest && <p style={{ margin: '5px 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.contest}</p>}
        <p style={{ margin: 0, color, fontWeight: 'bold' }}>Rating: {data.rating}</p>
      </div>
    );
  }
  return null;
}

/* ── Skeleton Loader ──────────────────────────────────────────────────── */
function Skeleton({ width = '100%', height = '1.5rem', radius = '8px' }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: radius }} />
  );
}

function SkeletonCard() {
  return (
    <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton width="40px" height="40px" radius="12px" />
      <Skeleton width="60%" height="0.9rem" />
      <Skeleton width="40%" height="1.75rem" />
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, color, rgb }) {
  return (
    <div className="glass hover-scale" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ padding: '0.75rem', background: `rgba(${rgb}, 0.1)`, borderRadius: '12px', color, width: 'fit-content' }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</h3>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{value}</h2>
      </div>
    </div>
  );
}

/* ── Platform Quick Card ──────────────────────────────────────────────── */
function PlatformCard({ platform, data, loading, error, onRetry }) {
  return (
    <div className="glass hover-scale" style={{ padding: '1.5rem' }}>
      <Link to={`/platform/${platform.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>{platform.logo}</span>
          </div>
          <ArrowRight size={20} color="var(--text-muted)" />
        </div>
      </Link>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="70%" height="0.9rem" />
          <Skeleton width="50%" height="0.9rem" />
        </div>
      ) : error ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          <button onClick={onRetry} className="hover-scale" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.8rem', background: 'rgba(255,117,76,0.1)',
            color: 'var(--accent-secondary)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600'
          }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <span>Rating: <strong style={{ color: platform.color }}>{data.currentRating}</strong></span>
          <span>Solved: <strong style={{ color: 'var(--text-main)' }}>{data.solved}</strong></span>
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No handle linked</p>
      )}
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { handles: contextHandles } = useAuth();
  const [platformData, setPlatformData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});
  const [chartRef, chartInView] = useInView();

  const handles = contextHandles || {};

  const loadPlatform = (p, force = false) => {
    const handle = handles[p.id];
    if (!handle) return;

    if (!force) setLoadingMap(prev => ({ ...prev, [p.id]: true }));
    setErrorMap(prev => ({ ...prev, [p.id]: null }));

    fetchWithCache(
      `${p.id}_${handle}`,
      () => p.fetcher(handle),
      (data) => {
        setPlatformData(prev => ({ ...prev, [p.id]: data }));
        setLoadingMap(prev => ({ ...prev, [p.id]: false }));
      },
      force
    ).catch(err => {
      setErrorMap(prev => ({ ...prev, [p.id]: err.message }));
      setLoadingMap(prev => ({ ...prev, [p.id]: false }));
    });
  };

  const handleRefreshAll = () => {
    platforms.forEach(p => loadPlatform(p, true));
  };

  useEffect(() => {
    platforms.forEach(loadPlatform);
  }, [handles]);

  const totalSolved = Object.values(platformData).reduce((sum, d) => sum + (d?.solved || 0), 0);
  
  const allTimestamps = Object.values(platformData).flatMap(d => d?.calendar || []);

  const hasAnyData = Object.keys(platformData).length > 0;
  const allLoading = platforms.every(p => loadingMap[p.id]);

  return (
    <div className="animation-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>Overview</h2>
        <button 
          onClick={handleRefreshAll} 
          className="hover-scale"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: 'var(--text-main)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          title="Force refresh all platforms"
        >
          <RefreshCw size={16} className={Object.values(loadingMap).some(l => l) ? "spinner-icon" : ""} style={Object.values(loadingMap).some(l => l) ? { animation: 'spin 1s linear infinite' } : {}} /> 
          Refresh All
        </button>
      </div>

      {/* Aggregate Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {allLoading && !hasAnyData ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title="Total Solved" value={totalSolved} icon={Target} color="#6C5DD3" rgb="108, 93, 211" />
            
            <div className="glass hover-scale" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255, 117, 76, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={24} color="#FF754C" />
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: '500' }}>Best Rating</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.95rem', fontWeight: '700' }}>
                  {platforms.map(p => {
                    const r = platformData[p.id]?.maxRating;
                    return r ? <div key={p.id}><span style={{color: p.color}}>{p.name}:</span> {r}</div> : null;
                  })}
                  {Object.values(platformData).every(d => !d?.maxRating) && <span style={{fontSize: '1.75rem'}}>0</span>}
                </div>
              </div>
            </div>

            <StatCard title="Platforms Linked" value={Object.keys(platformData).length} icon={Activity} color="#7FBA7A" rgb="127, 186, 122" />
          </>
        )}
      </div>

      {/* Platform Quick Cards */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>Your Platforms</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {platforms.map(p => (
          <PlatformCard
            key={p.id}
            platform={p}
            data={platformData[p.id]}
            loading={loadingMap[p.id]}
            error={errorMap[p.id]}
            onRetry={() => loadPlatform(p)}
          />
        ))}
      </div>

      {hasAnyData && <ActivityHeatmap data={allTimestamps} />}

      {/* Rating Charts for each platform */}
      <div ref={chartRef} style={{
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        opacity: chartInView ? 1 : 0,
        transform: chartInView ? 'translateY(0)' : 'translateY(40px)'
      }}>
        {platforms.map(p => {
          const pData = platformData[p.id];
          if (!pData || !pData.chart || pData.chart.length === 0) return null;
          
          const chartData = pData.chart;
          return (
            <div
              key={p.id}
              className="glass"
              style={{
                padding: '2rem',
                marginBottom: '2rem'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                Rating Progression ({p.name})
              </h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip color={p.color} />} />
                    <Line type="linear" dataKey="rating" stroke={p.color} strokeWidth={2}
                      dot={{ fill: p.color, stroke: 'none', r: 3 }}
                      activeDot={{ r: 6, fill: p.color, stroke: 'none' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}

        {/* Show placeholder if no charts at all */}
        {platforms.every(p => !platformData[p.id]?.chart || platformData[p.id].chart.length === 0) && (
          <div className="glass" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Rating Progression
            </h3>
            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {allLoading ? <Skeleton width="90%" height="80px" /> : (
                <p style={{ color: 'var(--text-muted)' }}>No rating data available yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
