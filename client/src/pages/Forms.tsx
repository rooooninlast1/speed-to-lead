import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchForms() {
  const res = await fetch(`${API_URL}/api/forms`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  if (!res.ok) throw new Error('Failed to fetch forms');
  return res.json();
}

export default function Forms() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['forms'], queryFn: fetchForms });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${API_URL}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create form');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setShowForm(false);
      setName('');
      setEndpoint('');
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Forms</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + New Form
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Endpoint Slug</label>
            <input value={endpoint} onChange={e => setEndpoint(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }} />
          </div>
          <button onClick={() => mutation.mutate({ name, endpoint })} style={{ padding: '10px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Create
          </button>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {data?.map((form: any) => (
            <div key={form.id} style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{form.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>/{form.endpoint}</div>
              <div style={{ fontSize: 12 }}>
                Status: <span style={{ color: form.isActive ? '#10B981' : '#EF4444', fontWeight: 600 }}>{form.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
