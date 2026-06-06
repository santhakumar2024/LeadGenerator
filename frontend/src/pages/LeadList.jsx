import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import ManualAddLead from '../components/ManualAddLead';
import '../Leads.css';

const proxyUrl = 'http://localhost:3001/api';

const LeadList = () => {
  const { mainStyles } = useOutletContext();
  const [leads, setLeads] = useState([]);
  const [gmapsQuery, setGmapsQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${proxyUrl}/leads`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
    }
  };

  const togglePause = async (lead) => {
    const newStatus = lead.status === 'PAUSED' ? 'CONTACTED' : 'PAUSED';
    try {
      await fetch(`${proxyUrl}/leads/${lead.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchLeads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGmapsScrape = async () => {
    if (!gmapsQuery) return alert('Please enter at least one search query');
    
    // Split by newlines and filter empty lines
    const queries = gmapsQuery.split('\n').map(q => q.trim()).filter(q => q.length > 0);
    if (queries.length === 0) return alert('Please enter at least one valid search query');

    setIsScraping(true);
    let totalAdded = 0;
    
    try {
      for (const query of queries) {
        // We notify the UI of current progress (could be improved with a progress bar, but for now console/alert is fine)
        const res = await fetch(`${proxyUrl}/leads/scrape-gmaps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchQuery: query })
        });
        const result = await res.json();
        totalAdded += result.addedCount;
        fetchLeads(); // Refresh table after each query to show progress
      }
      alert(`Bulk scrape complete! Total new leads added: ${totalAdded}`);
      setGmapsQuery('');
    } catch (err) {
      console.error(err);
      alert('Bulk scrape failed. Check console for details.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleClearLeads = async () => {
    if (!window.confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      await fetch(`${proxyUrl}/leads`, { method: 'DELETE' });
      alert('All leads cleared!');
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert('Failed to clear leads.');
    } finally {
      setIsClearing(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'NEW': return 'status-badge status-pending';
      case 'CONTACTED': return 'status-badge status-active';
      case 'REPLIED': return 'status-badge status-active';
      default: return 'status-badge';
    }
  };

  return (
    <div>
      <div className={mainStyles.header}>
        <h2>Lead Management</h2>
      </div>

      <ManualAddLead onLeadAdded={fetchLeads} />

      {/* Google Maps Scraper UI */}
      <div className="table-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Google Maps Lead Hunter (Multi-Query)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Enter one search term per line (e.g., "plumbers Miami" then "gyms Miami" on next line). The hunter will process them sequentially.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <textarea 
            placeholder={"e.g.\nPet Grooming Miami\nSmall Gyms Miami\nAquariums Miami"}
            value={gmapsQuery}
            onChange={(e) => setGmapsQuery(e.target.value)}
            rows={4}
            style={{ 
              width: '100%', 
              padding: '0.8rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-dark)',
              color: 'var(--text-main)',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <button 
            className={mainStyles['btn-primary']} 
            onClick={handleGmapsScrape}
            disabled={isScraping}
            style={{ alignSelf: 'flex-start', padding: '1rem 2rem' }}
          >
            {isScraping ? 'Hunting in progress...' : 'Start Global Lead Hunter'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Active Leads</h3>
        <button 
          onClick={handleClearLeads}
          disabled={isClearing}
          style={{ 
            backgroundColor: '#ff4d4d', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          {isClearing ? 'Clearing...' : 'Clear All Leads'}
        </button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Lead Email</th>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Step</th>
              <th>Last Contacted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.email.includes('@placeholder.com') ? <span style={{color: 'var(--text-muted)'}}>No Email</span> : lead.email}</td>
                <td>{lead.name || 'N/A'}</td>
                <td>{lead.company_name || 'N/A'}</td>
                <td>{lead.phone || 'N/A'}</td>
                <td>
                  <span className={getStatusBadgeClass(lead.status)}>
                    {lead.status}
                  </span>
                </td>
                <td>{lead.step_count}</td>
                <td>
                  {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : 'Never'}
                </td>
                <td>
                  {(lead.status === 'CONTACTED' || lead.status === 'PAUSED' || lead.status === 'NEW') && (
                    <button 
                      className={mainStyles['btn-primary']} 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: lead.status === 'PAUSED' ? 'var(--success-green)' : 'var(--text-muted)' }}
                      onClick={() => togglePause(lead)}
                    >
                      {lead.status === 'PAUSED' ? 'Resume' : 'Pause'} Automation
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No leads found. Waiting for incoming emails...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadList;
