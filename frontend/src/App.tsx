import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { FinderWindow } from './components/Finder/FinderWindow';
import { ShieldIcon } from './assets/icons';

// API base: in production we serve same-origin, in development we use local 8080 proxy or explicit address
const API_BASE = ''; 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('webvault_dark_mode');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Theme States
  const [themeData, setThemeData] = useState<any>(null);
  const [activeTheme, setActiveTheme] = useState<string>('sonoma');

  // 1. Check Authenticated Session on Mount
  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/status`);
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setUser(data.user || 'admin');
        setDisplayName(data.displayName || 'Administrator');
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  };

  // Fetch Theme JSON List
  const fetchTheme = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/theme`);
      const data = await res.json();
      if (res.ok && data.themes) {
        setThemeData(data);
        setActiveTheme(data.activeTheme || 'sonoma');
      }
    } catch (e) {
      console.error('Failed to fetch theme:', e);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    fetchTheme();
  }, []);

  // 2. Sync Light/Dark themes class list on document body and persist state
  useEffect(() => {
    localStorage.setItem('webvault_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // 3. Inject colors dynamically from JSON themes configuration
  useEffect(() => {
    if (!themeData || !themeData.themes[activeTheme]) return;
    const theme = themeData.themes[activeTheme];
    const mode = isDarkMode ? 'dark' : 'light';
    const colors = theme.colors[mode];
    
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    
    // Reset inline styles first to avoid leakages on both html and body tags
    htmlEl.removeAttribute('style');
    bodyEl.removeAttribute('style');
    
    // Inject theme JSON colors to override variables on both elements
    Object.entries(colors).forEach(([variable, value]) => {
      htmlEl.style.setProperty(variable, value as string);
      bodyEl.style.setProperty(variable, value as string);
    });
  }, [activeTheme, isDarkMode, themeData]);

  const handleLoginSuccess = () => {
    checkAuthStatus();
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setIsAuthenticated(false);
    setUser('');
    setDisplayName('');
  };

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#1c1c1e', color: 'white', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <ShieldIcon size={48} style={{ color: '#0a84ff' }} />
          <div style={{ fontSize: '15px', fontWeight: 500 }}>Initializing Secure Connection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="desktop-container">
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} apiBase={API_BASE} />
      ) : (
        <FinderWindow 
          apiBase={API_BASE} 
          onLogout={handleLogout} 
          isDarkMode={isDarkMode} 
          onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
          user={user}
          setUser={setUser}
          displayName={displayName}
          setDisplayName={setDisplayName}
          themeData={themeData}
          activeTheme={activeTheme}
          onSelectTheme={async (themeKey: string) => {
            // Optimistic update for instant visual feedback!
            setActiveTheme(themeKey);
            
            try {
              const res = await fetch(`${API_BASE}/api/theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeTheme: themeKey })
              });
              if (res.ok) {
                if (themeData) {
                  setThemeData({ ...themeData, activeTheme: themeKey });
                }
              } else {
                console.error('Theme persist failed on backend, rolling back...');
                if (themeData && themeData.activeTheme) {
                  setActiveTheme(themeData.activeTheme);
                }
              }
            } catch (e) {
              console.error('Failed to update active theme:', e);
              if (themeData && themeData.activeTheme) {
                setActiveTheme(themeData.activeTheme);
              }
            }
          }}
        />
      )}
    </div>
  );
}
