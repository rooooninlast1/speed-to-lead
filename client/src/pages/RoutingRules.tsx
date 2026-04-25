import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchRules() {
  const res = await fetch(`${API_URL}/api/routing`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

export default function RoutingRules() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['routing'], queryFn: fetchRules });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [action, setAction] = useState('assign_to_user');

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`${API_URL}/api/routing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing'] });
      setShowForm(false);
      setName('');
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Routing Rules</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          + New Rule
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Rule Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Action</label>
            <select value={action} onChange={e => setAction(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #D1D5DB' }}>
              <option value="assign_to_user">Assign to User</option>
              <option value="round_robin">Round Robin</option>
            </select>
          </div>
          <button onClick={() => mutation.mutate({ name, action, conditions: {} })} style={{ padding: '10px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Create
          </button>
        </div>
      )}

      {isLoading ? <div>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data?.map((rule: any) => (
            <div key={rule.id} style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700 }}>{rule.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Priority: {rule.priority}</div>
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Action: {rule.action}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
