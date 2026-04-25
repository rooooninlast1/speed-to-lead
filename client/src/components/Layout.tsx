import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside
        style={{
          width: 240,
          background: '#111827',
          color: '#fff',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 32 }}>Speed to Lead</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <NavItem to="/dashboard">Dashboard</NavItem>
          <NavItem to="/leads">Leads</NavItem>
          <NavItem to="/forms">Forms</NavItem>
          <NavItem to="/routing">Routing Rules</NavItem>
          <NavItem to="/templates">Templates</NavItem>
          <NavItem to="/settings">Settings</NavItem>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid #374151' }}>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{user.email}</div>
          <button
            onClick={logout}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: '1px solid #374151',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, overflow: 'auto', background: '#F3F4F6' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        color: isActive ? '#60A5FA' : '#D1D5DB',
        textDecoration: 'none',
        fontWeight: isActive ? 600 : 400,
        padding: '8px 12px',
        borderRadius: 6,
        background: isActive ? 'rgba(96,165,250,0.15)' : 'transparent',
      })}
    >
      {children}
    </NavLink>
  );
}
