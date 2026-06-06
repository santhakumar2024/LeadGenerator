import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const proxyUrl = 'http://localhost:3001/api';

const Dashboard = () => {
  const { mainStyles } = useOutletContext();
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeLeads: 0,
    newLeads: 0,
    replyRate: 0,
  });

  useEffect(() => {
    fetch(`${proxyUrl}/dashboard/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div className={mainStyles.header}>
        <h2>Dashboard</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Leads</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalLeads}</div>
        </div>
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Sequences</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeLeads}</div>
        </div>
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>New Leads</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.newLeads}</div>
        </div>
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Reply Rate</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-green)' }}>{stats.replyRate}%</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
