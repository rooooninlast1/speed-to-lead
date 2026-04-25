import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchTemplates() {
  const res = await fetch(`${API_URL}/api/templates`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export default function Templates() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`${API_URL}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowForm(false);
      setName('');
      setSubject('');
      setBody('');
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Message Templates</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + New Template
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Body (HTML)</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }} />
          </div>
          <button onClick={() => mutation.mutate({ name, subject, body, channel: 'email' })} style={{ padding: '10px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Create
          </button>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data?.map((t: any) => (
            <div key={t.id} style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
              <div style={{ fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{t.subject}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
