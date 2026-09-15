import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Platform from './pages/Platform';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase';

function App() {
  const { user, handles, loading } = useAuth();
  
  // A temporary state if the user finishes profile setup but it hasn't synced from Firestore yet
  const [localProfileComplete, setLocalProfileComplete] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLocalProfileComplete(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleProfileComplete = () => {
    setLocalProfileComplete(true);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const profileComplete = handles !== null || localProfileComplete;

  if (!profileComplete) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <Router>
      <div className="app-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Navbar onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/platform/:platformName" element={<Platform />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
