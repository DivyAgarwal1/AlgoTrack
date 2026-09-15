import React, { useState, useEffect } from 'react';
import { Code2, ArrowRight, User } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const platforms = [
  {
    id: 'codeforces',
    name: 'Codeforces',
    placeholder: 'e.g. tourist',
    color: '#6C5DD3',
    bg: 'rgba(108, 93, 211, 0.1)',
    logo: '💜'
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    placeholder: 'e.g. neal_wu',
    color: '#FFC107',
    bg: 'rgba(255, 193, 7, 0.1)',
    logo: '💛'
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    placeholder: 'e.g. tourist',
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.1)',
    logo: '💚'
  }
];

export default function ProfileSetup({ onComplete }) {
  const { user, handles: existingHandles } = useAuth();
  const [handles, setHandles] = useState({ codeforces: '', leetcode: '', atcoder: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingHandles) {
      setHandles(prev => ({ ...prev, ...existingHandles }));
    }
  }, [existingHandles]);

  const handleChange = (id, value) => {
    setHandles(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = Object.values(handles).some(v => v.trim() !== '');
    if (!filled) {
      setError('Please enter at least one platform handle.');
      return;
    }
    setLoading(true);
    try {
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { handles }, { merge: true });
      }
      onComplete(handles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      if (user) {
        // Just save an empty handles object so we know they've seen this page
        await setDoc(doc(db, 'users', user.uid), { handles: handles }, { merge: true });
      }
      onComplete(handles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animation-fade-in">
      <div className="glass auth-card" style={{ maxWidth: '540px' }}>
        <div className="auth-header">
          <Code2 size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2 className="gradient-text">Link Your Platforms</h2>
          <p className="text-muted">Enter your usernames below. We'll fetch your real stats from each platform.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,117,76,0.1)', border: '1px solid var(--accent-secondary)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'var(--accent-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {platforms.map(p => (
            <div key={p.id}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                <span>{p.logo}</span> {p.name}
              </label>
              <div className="input-group">
                <User size={20} className="input-icon" />
                <input
                  type="text"
                  placeholder={p.placeholder}
                  value={handles[p.id] || ''}
                  onChange={e => handleChange(p.id, e.target.value)}
                  style={{ borderColor: handles[p.id] ? p.color : undefined }}
                />
              </div>
            </div>
          ))}

          <button type="submit" className="auth-submit hover-scale" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Saving...' : 'Go to Dashboard'}
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
