import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldAlert, Search, RefreshCw, BarChart2, CheckCircle, Clock } from 'lucide-react';

const proxyUrl = 'http://localhost:3001/api';

const Dashboard = () => {
  const { mainStyles } = useOutletContext();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Stats summaries
  const [stats, setStats] = useState({
    total: 0,
    highScoreCount: 0,
    newCount: 0,
    opportunityCount: 0
  });

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sortBy, sortOrder]); // Re-fetch on filter/sort changes

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Build search and filter query string parameters
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const res = await fetch(`${proxyUrl}/leads?${params.toString()}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setLeads(data);
        
        // Calculate statistics locally from the fetched array
        const total = data.length;
        const highScoreCount = data.filter(l => l.score >= 70).length;
        const newCount = data.filter(l => l.status === 'NEW').length;
        const opportunityCount = data.filter(l => l.status === 'OPPORTUNITY').length;
        
        setStats({ total, highScoreCount, newCount, opportunityCount });
      }
    } catch (err) {
      console.error('Failed to fetch leads for admin table:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const getStatusBadgeStyle = (status) => {
    const base = {
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-block',
    };

    switch (status) {
      case 'NEW':
        return { ...base, backgroundColor: '#f3f4f6', color: '#4b5563' };
      case 'QUALIFIED':
        return { ...base, backgroundColor: '#e0e7ff', color: '#4338ca' };
      case 'NURTURE':
        return { ...base, backgroundColor: '#fef3c7', color: '#d97706' };
      case 'OPPORTUNITY':
        return { ...base, backgroundColor: '#fae8ff', color: '#a21caf' };
      case 'CUSTOMER':
        return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
      case 'LOST':
        return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { ...base, backgroundColor: '#e5e7eb', color: '#374151' };
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to desc for new field
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className={mainStyles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Admin Lead Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>Real-time verified leads directory and scoring system.</p>
        </div>
        <button 
          onClick={fetchLeads} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--accent-bg, rgba(170, 59, 255, 0.1))',
            border: '1px solid var(--accent-border, rgba(170, 59, 255, 0.3))',
            color: 'var(--accent, #aa3bff)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Sync Directory
        </button>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { title: 'Total Subscriptions', count: stats.total, icon: <BarChart2 size={20} color="#6366f1" />, bg: 'rgba(99, 102, 241, 0.08)' },
          { title: 'High-Intent (Score ≥ 70)', count: stats.highScoreCount, icon: <CheckCircle size={20} color="#10b981" />, bg: 'rgba(16, 185, 129, 0.08)' },
          { title: 'Awaiting Action (NEW)', count: stats.newCount, icon: <Clock size={20} color="#f59e0b" />, bg: 'rgba(245, 158, 11, 0.08)' },
          { title: 'Deals in Pipeline', count: stats.opportunityCount, icon: <ShieldAlert size={20} color="#ec4899" />, bg: 'rgba(236, 72, 153, 0.08)' }
        ].map((card, idx) => (
          <div key={idx} style={{
            backgroundColor: 'var(--bg, #fff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted, #718096)' }}>{card.title}</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-h, #1a202c)' }}>{card.count}</h3>
            </div>
            <div style={{ padding: '8px', backgroundColor: card.bg, borderRadius: '8px' }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search Row */}
      <div style={{
        backgroundColor: 'var(--bg, #fff)',
        border: '1px solid var(--border, #e2e8f0)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flex: 1, minWidth: '280px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e0)',
              backgroundColor: 'var(--bg-dark, #f7fafc)',
              color: 'var(--text-h, #1a202c)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted, #a0aec0)' }} />
        </form>

        {/* Status Dropdown */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted, #718096)', fontWeight: '600' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e0)',
              backgroundColor: 'var(--bg, #fff)',
              color: 'var(--text-h, #1a202c)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Stages</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NURTURE">Nurture</option>
            <option value="OPPORTUNITY">Opportunity</option>
            <option value="CUSTOMER">Customer</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Directory Table */}
      <div className="table-card" style={{
        overflowX: 'auto',
        backgroundColor: 'var(--bg, #fff)',
        border: '1px solid var(--border, #e2e8f0)',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border, #e2e8f0)', backgroundColor: '#f8fafc' }}>
              <th onClick={() => handleSort('name')} style={tableHeaderStyle}>Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Phone</th>
              <th onClick={() => handleSort('company')} style={tableHeaderStyle}>Company {sortBy === 'company' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('score')} style={tableHeaderStyle}>Intent Score {sortBy === 'score' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th style={tableHeaderStyle}>Funnel Stage</th>
              <th onClick={() => handleSort('createdAt')} style={tableHeaderStyle}>Captured Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
              <th style={tableHeaderStyle}>Enrichment Source</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #718096)' }}>
                  <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                  <div>Syncing directory items...</div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #718096)' }}>
                  No lead directory items matching filters found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border, #edf2f7)', transition: 'background-color 0.1s' }} className="table-row-hover">
                  <td style={tableCellStyle}>{lead.name || 'Anonymous'}</td>
                  <td style={tableCellStyle}>
                    <a href={`mailto:${lead.email}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>
                      {lead.email}
                    </a>
                  </td>
                  <td style={tableCellStyle}>{lead.phone || 'N/A'}</td>
                  <td style={tableCellStyle}>{lead.company || 'N/A'}</td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontWeight: 'bold',
                        color: lead.score >= 70 ? '#10b981' : lead.score >= 40 ? '#f59e0b' : '#ef4444'
                      }}>
                        {lead.score}
                      </span>
                      <div style={{ width: '60px', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${lead.score}%`,
                          backgroundColor: lead.score >= 70 ? '#10b981' : lead.score >= 40 ? '#f59e0b' : '#ef4444',
                          height: '100%'
                        }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={getStatusBadgeStyle(lead.status)}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-muted, #718096)',
                      backgroundColor: 'rgba(160, 174, 192, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      {lead.enrichmentSource || 'None'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Spinning helper CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.2s linear infinite;
        }
        .table-row-hover:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
};

const tableHeaderStyle = {
  padding: '12px 16px',
  color: '#4a5568',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  userSelect: 'none',
  borderBottom: '1px solid #e2e8f0'
};

const tableCellStyle = {
  padding: '14px 16px',
  fontSize: '14px',
  color: '#2d3748',
  whiteSpace: 'nowrap'
};

export default Dashboard;
