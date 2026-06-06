import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Target, Users, Calendar, DollarSign, Activity, ShieldAlert } from 'lucide-react';

const proxyUrl = 'http://localhost:3001/api';

const timeAgo = (dateStr) => {
  const diffMs = new Date() - new Date(dateStr);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

const DashboardOverview = () => {
  const { mainStyles } = useOutletContext();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${proxyUrl}/leads`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading funnel data...</div>;

  // 1. The Big Numbers
  const totalLeads = leads.length;
  const activeDrips = leads.filter(l => l.status === 'NEW' || l.status === 'CONTACTED').length;
  const meetingsSet = leads.filter(l => l.status === 'MEETING_SCHEDULED').length;
  const insecureSites = leads.filter(l => l.security_note).length;

  // 2. Funnel Stages
  const emailed = leads.filter(l => l.status !== 'NEW').length;
  const called = meetingsSet + leads.filter(l => ['FOLLOW_UP_CALL', 'QUALIFIED', 'CLIENT_COMPLETED'].includes(l.status)).length;
  const closed = leads.filter(l => l.status === 'CLIENT_COMPLETED').length;

  // Calculate percentages relative to the total top of funnel for the visual UI
  const getWidth = (count) => totalLeads === 0 ? 0 : Math.max(5, (count / totalLeads) * 100);

  // 3. Recent Activity (Sort by updatedAt)
  const recentActivity = [...leads]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div>
      <div className={mainStyles.header}>
        <h2>Sales Funnel Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>Overview of your QuentroNova outbound pipeline.</p>
      </div>

      {/* Row 1: The Big Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { title: 'Total Leads', count: totalLeads, icon: <Users size={24} color="var(--primary-blue)" /> },
          { title: 'Active Drips', count: activeDrips, icon: <Activity size={24} color="#f59e0b" /> },
          { title: 'Insecure Sites', count: insecureSites, icon: <ShieldAlert size={24} color="#ef4444" /> },
          { title: 'Meetings Set', count: meetingsSet, icon: <Calendar size={24} color="#10b981" /> },
        ].map((card, i) => (
          <div key={i} className="table-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>{card.title}</p>
              <h3 style={{ fontSize: '2rem', color: 'var(--text-dark)' }}>{card.count}</h3>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'var(--bg-gray)', borderRadius: 'var(--radius)' }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Row 2, Col 1: The Funnel Chart */}
        <div className="table-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '2rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} color="var(--primary-blue)" /> Pipeline Conversion Funnel
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { label: 'Scraped / Inbound', count: totalLeads, color: 'var(--border-color)' },
              { label: 'Emailed (Drip Started)', count: emailed, color: '#93c5fd' },
              { label: 'Called (Power Hour)', count: called, color: 'var(--primary-blue)' },
              { label: 'Closed (Client Completed)', count: closed, color: '#10b981' },
            ].map((stage, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
                  <span>{stage.label}</span>
                  <span>{stage.count}</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--bg-gray)', height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${getWidth(stage.count)}%`, backgroundColor: stage.color, height: '100%', transition: 'width 1s ease-out' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2, Col 2: Recent Activity Feed */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)', fontSize: '1.1rem' }}>Activity Feed</h3>
          {recentActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent activity.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentActivity.map(lead => (
                <div key={lead.id} style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: 'bold' }}>
                    {lead.first_name || 'Prospect'} {lead.last_name || ''} 
                    <span style={{ fontWeight: 'normal' }}> moved to </span> 
                    <span style={{ color: 'var(--primary-blue)' }}>{lead.status}</span>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {timeAgo(lead.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
