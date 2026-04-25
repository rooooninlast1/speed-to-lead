import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchStats() {
  const res = await fetch(`${API_URL}/api/dashboard/stats`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = io(API_URL || '', { auth: { token } });
    socket.on('new_lead', (lead) => {
      console.log('New lead received:', lead);
    });
    socket.on('notification', (n) => {
      console.log('Notification:', n);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard title="Total Leads" value={data?.totalLeads || 0} />
        <StatCard title="Today" value={data?.todayLeads || 0} />
        <StatCard title="Hot Leads" value={data?.hotLeads || 0} />
        <StatCard title="Conversion Rate" value={`${data?.conversionRate || 0}%`} />
        <StatCard title="Avg Response Time" value={data?.avgResponseTime || '0s'} />
      </div>

      <h2 style={{ marginTop: 32, marginBottom: 16 }}>Recent Leads</h2>
      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        {(data?.recentLeads || []).map((lead: any) => (
          <div key={lead.id} style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{lead.firstName} {lead.lastName}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{lead.email}</div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              {lead.assignedTo ? `Assigned to ${lead.assignedTo.name}` : 'Unassigned'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
