import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: '#fff', padding: 40, borderRadius: 12, width: 360, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
      >
        <h2 style={{ marginBottom: 24 }}>Sign In</h2>
        {error && <div style={{ color: '#EF4444', marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }}
            required
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }}
            required
          />
        </div>
        <button
          type="submit"
          style={{ width: '100%', padding: 12, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
        >
          Sign In
        </button>
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
          Don't have an account?{' '}
          <a href="#" onClick={() => navigate('/register')} style={{ color: '#4F46E5', fontWeight: 600 }}>
            Register
          </a>
        </div>
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
          Demo: admin@demo.com / password123
        </div>
      </form>
    </div>
  );
}
