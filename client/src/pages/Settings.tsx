import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Settings</h1>
      <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Name</div>
          <div style={{ fontSize: 18, marginTop: 4 }}>{user?.name}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Email</div>
          <div style={{ fontSize: 18, marginTop: 4 }}>{user?.email}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Role</div>
          <div style={{ fontSize: 18, marginTop: 4, textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
      </div>
    </div>
  );
}
