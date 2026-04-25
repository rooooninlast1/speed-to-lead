import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchLeads(search: string, page: number) {
  const params = new URLSearchParams({ search, page: String(page), limit: '25' });
  const res = await fetch(`${API_URL}/api/leads?${params}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ['leads', search, page], queryFn: () => fetchLeads(search, page) });
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Leads</h1>
        <input
          placeholder="Search leads..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB', width: 260 }}
        />
      </div>

      {isLoading ? <div>Loading...</div> : (
        <>
          <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: '#6B7280' }}>Name</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: '#6B7280' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: '#6B7280' }}>Score</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: '#6B7280' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, textTransform: 'uppercase', color: '#6B7280' }}>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {data?.leads?.map((lead: any) => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '12px 16px' }}>{lead.firstName} {lead.lastName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{lead.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: lead.score >= 60 ? '#D1FAE5' : '#F3F4F6', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {lead.score}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{lead.status}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>{lead.assignedTo?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 12px' }}>Prev</button>
            <span style={{ padding: '8px 12px' }}>Page {page} of {data?.pagination?.totalPages || 1}</span>
            <button disabled={page >= (data?.pagination?.totalPages || 1)} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 12px' }}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
