import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchLead(id: string) {
  const res = await fetch(`${API_URL}/api/leads/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Failed to fetch lead');
  return res.json();
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => fetchLead(id!), enabled: !!id });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Lead not found</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>{data.firstName} {data.lastName}</h1>
      <div style={{ color: '#6B7280', marginBottom: 24 }}>{data.email} {data.phone && `• ${data.phone}`}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Card title="Score" value={data.score} />
        <Card title="Qualification" value={data.qualification} />
        <Card title="Status" value={data.status} />
        <Card title="Company" value={data.company || '-'} />
      </div>

      <h3 style={{ marginBottom: 12 }}>Activity</h3>
      <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        {(data.activities || []).map((activity: any) => (
          <div key={activity.id} style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ fontWeight: 600 }}>{activity.action}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{activity.description}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{new Date(activity.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
