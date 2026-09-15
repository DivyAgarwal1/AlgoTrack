import React from 'react';
import { LogOut, Code2, User as UserIcon, Calendar as CalendarIcon, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const { user } = useAuth();

  const NavLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
          fontWeight: isActive ? '600' : '500',
          transition: 'all 0.2s ease',
          textDecoration: 'none'
        }}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <nav className="glass" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      marginBottom: '2rem',
      background: '#ffffff'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: '#333', letterSpacing: '-0.5px' }}>
          Algo<span style={{color: 'var(--accent-primary)'}}>Track</span>
        </h1>
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <NavLink to="/calendar" icon={CalendarIcon} label="Calendar" />
        <NavLink to="/platform/codeforces" icon={Target} label="Codeforces" />
        <NavLink to="/platform/leetcode" icon={Target} label="LeetCode" />
        <NavLink to="/platform/atcoder" icon={Target} label="AtCoder" />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <UserIcon size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user?.displayName || user?.email || 'User'}</span>
        </div>

        <button 
          onClick={onLogout}
          className="hover-scale"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            padding: '0.4rem 0.8rem',
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            color: '#dc3545',
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '0.85rem'
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
