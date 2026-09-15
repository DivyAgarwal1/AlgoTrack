import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Target, Trophy, Activity, CheckCircle, XCircle, Clock, RefreshCw, Bookmark, Star, Code2 } from 'lucide-react';
import { fetchCodeforcesData, fetchLeetcodeData, fetchAtcoderData, fetchWithCache } from '../lib/api';
import { useInView } from '../lib/useInView';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CodeforcesLogo = () => <span style={{fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '0.9em'}}><span style={{color: '#333'}}>Code</span><span style={{color: '#3b82f6'}}>forces</span></span>;
const LeetCodeLogo = () => <span style={{fontFamily: 'Helvetica, sans-serif', fontWeight: 600, fontSize: '0.9em'}}><span style={{color: '#333'}}>Leet</span><span style={{color: '#eab308'}}>Code</span></span>;
const AtCoderLogo = () => <span style={{fontFamily: 'Verdana, sans-serif', fontWeight: 700, fontSize: '0.9em'}}><span style={{color: '#333'}}>At</span><span style={{color: '#10b981'}}>Coder</span></span>;

const CodeforcesIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="4" width="5" height="16" fill="#3b82f6"/>
    <rect x="9" y="10" width="5" height="10" fill="#3b82f6"/>
    <rect x="3" y="14" width="5" height="6" fill="#ef4444"/>
  </svg>
);
const LeetCodeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);
const AtCoderIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#222"/>
    <path d="M8 17L12 7L16 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 14H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const platformMeta = {
  codeforces: { name: 'Codeforces', color: '#3b82f6', rgb: '59, 130, 246', logo: <CodeforcesLogo />, icon: <CodeforcesIcon />, fetcher: fetchCodeforcesData },
  leetcode: { name: 'LeetCode', color: '#eab308', rgb: '234, 179, 8', logo: <LeetCodeLogo />, icon: <LeetCodeIcon />, fetcher: fetchLeetcodeData },
  atcoder: { name: 'AtCoder', color: '#22c55e', rgb: '34, 197, 94', logo: <AtCoderLogo />, icon: <AtCoderIcon />, fetcher: fetchAtcoderData }
};

function CustomTooltip({ active, payload, label, color }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '10px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{label}</p>
        {data.contest && <p style={{ margin: '5px 0', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.contest}</p>}
        <p style={{ margin: 0, color, fontWeight: 'bold' }}>Rating: {data.rating}</p>
      </div>
    );
  }
  return null;
}

function Skeleton({ width = '100%', height = '1.5rem', radius = '8px' }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius }} />;
}

function StatCard({ title, value, icon: Icon, color, rgb }) {
  return (
    <div className="glass hover-scale" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: '12px', background: `rgba(${rgb}, 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: '500' }}>{title}</p>
        <h3 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{value}</h3>
      </div>
    </div>
  );
}

function SubmissionRow({ sub, isBookmarked, onBookmark }) {
  return (
    <div className="hover-scale" style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '1rem', borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-card)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: sub.verdict === 'Accepted' || sub.verdict === 'OK' ? 'var(--accent-success)' : 'var(--accent-secondary)'
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '600', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.problem}</p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {sub.time}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Code2 size={14} /> {sub.lang}</span>
          </div>
        </div>
      </div>
      <button 
        onClick={() => onBookmark(sub)}
        style={{ padding: '0.5rem', color: isBookmarked ? '#f59e0b' : 'var(--text-muted)', transition: 'color 0.2s', flexShrink: 0 }}
        title={isBookmarked ? "Remove bookmark" : "Bookmark problem"}
      >
        <Star size={20} fill={isBookmarked ? '#f59e0b' : 'none'} />
      </button>
    </div>
  );
}

export default function Platform() {
  const { platformName } = useParams();
  const { handles: contextHandles, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('recent');
  const [bookmarks, setBookmarks] = useState({});
  const [chartRef, chartInView] = useInView();

  const meta = platformMeta[platformName] || platformMeta.codeforces;
  const handles = contextHandles || {};
  const handle = handles[platformName];

  const loadData = (force = false) => {
    if (!handle) {
      setError(`No ${meta.name} handle saved. Go back and set up your profile.`);
      setLoading(false);
      return;
    }

    if (!force) setLoading(true);
    setError('');

    fetchWithCache(
      `${platformName}_${handle}`,
      () => meta.fetcher(handle),
      (result) => {
        setData(result);
        setLoading(false);
      },
      force
    ).catch(err => {
      setError(err.message || 'Failed to fetch data.');
      setLoading(false);
    });
  };

  useEffect(() => {
    setData(null);
    setLoading(true);
    setError('');

    loadData();
    const loadBookmarks = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'bookmarks', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const allBookmarks = docSnap.data();
          setBookmarks(allBookmarks[platformName] || {});
        } else {
          setBookmarks({});
        }
      } catch (err) {
        console.error("Error loading bookmarks:", err);
        setBookmarks({});
      }
    };
    
    loadBookmarks();
  }, [platformName, handle, user]);

  const toggleBookmark = async (sub) => {
    if (!user) return; // Must be logged in

    const newBookmarks = { ...bookmarks };
    if (newBookmarks[sub.problem]) {
      delete newBookmarks[sub.problem];
    } else {
      newBookmarks[sub.problem] = sub;
    }
    
    // Update local state immediately for snappy UI
    setBookmarks(newBookmarks);
    
    // Persist to Firestore in the background
    try {
      const docRef = doc(db, 'bookmarks', user.uid);
      await setDoc(docRef, {
        [platformName]: newBookmarks
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save bookmark:", err);
      // Optional: rollback state if it fails, but for bookmarks this is fine
    }
  };

  if (loading && !data) return (
    <div className="animation-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Skeleton width="56px" height="56px" radius="50%" />
        <div>
          <Skeleton width="200px" height="1.75rem" />
          <Skeleton width="120px" height="1rem" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="glass" style={{ padding: '1.5rem' }}>
            <Skeleton width="40px" height="40px" radius="12px" />
            <Skeleton width="60%" height="0.9rem" />
            <Skeleton width="40%" height="2rem" />
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: '2rem' }}>
        <Skeleton width="200px" height="1.2rem" />
        <Skeleton width="100%" height="300px" radius="12px" />
      </div>
    </div>
  );

  if (error && !data) return (
    <div className="glass animation-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '1rem' }}>Data Unavailable</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
      <button onClick={() => loadData(true)} className="hover-scale" style={{
        padding: '0.75rem 1.5rem', background: 'var(--accent-primary)',
        color: 'white', borderRadius: '8px', fontWeight: '600'
      }}>
        <RefreshCw size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Retry
      </button>
    </div>
  );

  if (!data) return null;

  const ChartComponent = LineChart;
  const ChartElement = (
    <Line type="linear" dataKey="rating" stroke={meta.color} strokeWidth={2}
        dot={{ fill: meta.color, stroke: 'none', r: 3 }}
        activeDot={{ r: 6, fill: meta.color, stroke: 'none' }}
    />
  );

  return (
    <div className="animation-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `rgba(${meta.rgb}, 0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', overflow: 'hidden'
        }}>
          {data.avatar && data.avatar !== ''
            ? <img src={data.avatar} alt={data.handle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : meta.icon}
        </div>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.2rem' }}>{data.handle}</h2>
          <span style={{
            padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600',
            background: `rgba(${meta.rgb}, 0.1)`, border: `1px solid rgba(${meta.rgb}, 0.2)`, color: meta.color
          }}>
            {meta.logo} <span style={{marginLeft: '0.4rem', opacity: 0.8}}>· {data.rank}</span>
          </span>
        </div>
        <button 
          onClick={() => loadData(true)} 
          className="hover-scale"
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            color: 'var(--text-main)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          title="Force refresh data"
        >
          <RefreshCw size={18} className={loading ? "spinner-icon" : ""} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> 
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Solved" value={data.solved} icon={Target} color={meta.color} rgb={meta.rgb} />
        <StatCard title="Contests Given" value={data.contestsCount} icon={Trophy} color={meta.color} rgb={meta.rgb} />
        <StatCard title="Max Rating" value={data.maxRating} icon={Trophy} color={meta.color} rgb={meta.rgb} />
        <StatCard title="Current Rating" value={data.currentRating} icon={Activity} color={meta.color} rgb={meta.rgb} />
      </div>

      {/* Rating Chart — scroll triggered */}
      {data.chart && data.chart.length > 0 && (
        <div ref={chartRef} className="glass" style={{
          padding: '2rem', marginBottom: '2rem',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          opacity: chartInView ? 1 : 0,
          transform: chartInView ? 'translateY(0)' : 'translateY(40px)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Rating Progression
          </h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip color={meta.color} />} />
                {ChartElement}
              </ChartComponent>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Submissions / Bookmarks */}
      {(data.recentSubmissions.length > 0 || Object.keys(bookmarks).length > 0) && (
        <div className="glass animation-fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setActiveTab('recent')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'recent' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '1.1rem',
                paddingBottom: '0.75rem',
                borderBottom: activeTab === 'recent' ? `2px solid ${meta.color}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Recent Solved
            </button>
            <button
              onClick={() => setActiveTab('bookmarked')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'bookmarked' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '1.1rem',
                paddingBottom: '0.75rem',
                borderBottom: activeTab === 'bookmarked' ? `2px solid ${meta.color}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Bookmarks ({Object.keys(bookmarks).length})
            </button>
          </div>

          {activeTab === 'recent' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.recentSubmissions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No recent solved problems.</p>
              ) : (
                data.recentSubmissions.map((sub) => (
                  <SubmissionRow 
                    key={sub.id} 
                    sub={sub} 
                    isBookmarked={!!bookmarks[sub.problem]}
                    onBookmark={toggleBookmark}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'bookmarked' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Object.keys(bookmarks).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No bookmarks yet. Star a problem in the Recent tab!</p>
              ) : (
                Object.values(bookmarks).map((sub) => (
                  <SubmissionRow 
                    key={sub.id || sub.problem} 
                    sub={sub} 
                    isBookmarked={true}
                    onBookmark={toggleBookmark}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
