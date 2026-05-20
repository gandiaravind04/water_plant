import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Droplet, LayoutDashboard, ClipboardList, Settings, LogOut, Plus, Sun, Moon, Languages } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Owner';
  const { theme, toggleTheme, lang, toggleLang, t } = useApp();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar glass-panel desktop-only">
        <div className="sidebar-logo glow-text-cyan">
          <Droplet size={28} fill="currentColor" />
          <span>Manjira</span>
        </div>

        {/* Desktop Quick Action */}
        <div style={{ padding: '0 0 16px 0' }}>
          <button
            onClick={() => navigate('/records?action=issue')}
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            <Plus size={18} />
            <span>{t.logDistribution}</span>
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>{t.dashboard}</span>
          </NavLink>
          <NavLink to="/records" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <ClipboardList size={20} />
            <span>{t.records}</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>{t.settings}</span>
          </NavLink>
        </div>

        {/* Theme & Language Toggles */}
        <div style={{ display: 'flex', gap: '8px', margin: '16px 0 12px' }}>
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
            title={theme === 'dark' ? t.lightMode : t.darkMode}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
          </button>
          <button
            onClick={toggleLang}
            className="btn-secondary"
            style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Languages size={16} />
            <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
          <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t.loggedInAs}: <strong className="glow-text-cyan">{username}</strong>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px' }}
          >
            <LogOut size={18} />
            <span>{t.signOut}</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-nav mobile-only">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={22} />
          <span>{t.dashboard}</span>
        </NavLink>

        <NavLink to="/records" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <ClipboardList size={22} />
          <span>{t.records}</span>
        </NavLink>

        {/* Center Floating Plus Button */}
        <NavLink to="/records?action=issue" className="action-btn-float">
          <div className="plus-btn-inner">
            <Plus size={24} />
          </div>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={22} />
          <span>{t.settings}</span>
        </NavLink>

        <button onClick={handleLogout} className="mobile-nav-btn">
          <LogOut size={22} />
          <span>{t.signOut.split(' ')[0]}</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
