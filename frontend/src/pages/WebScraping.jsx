import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

const proxyUrl = 'http://localhost:3001/api';

const WebScraping = () => {
    const { mainStyles } = useOutletContext();
    const [query, setQuery] = useState('');
    const [scraping, setScraping] = useState(false);
    const [results, setResults] = useState([]);
    const [message, setMessage] = useState('');

    const handleScrape = async (e) => {
        e.preventDefault();
        if (!query) return;

        setScraping(true);
        setMessage('Scraping session started. This may take a few minutes...');
        
        try {
            const response = await fetch(`${proxyUrl}/leads/scrape-gmaps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            setMessage(data.message);
            
            // Poll for results after a delay
            setTimeout(fetchLeads, 5000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to start scraping.');
        } finally {
            setScraping(false);
        }
    };

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${proxyUrl}/leads`);
            const data = await response.json();
            setResults(data.slice(0, 10)); // Show most recent 10
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <div className={mainStyles.header}>
                <h2>Web Scraping Control</h2>
                <p style={{ color: 'var(--text-muted)' }}>Search and generate leads from Google Maps automatically.</p>
            </div>

            <div className="table-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <form onSubmit={handleScrape} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input 
                            type="text" 
                            className="input-field"
                            placeholder="e.g., Plumbers in Chicago, Software companies in Berlin"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{ paddingLeft: '40px', width: '100%', marginBottom: 0 }}
                            disabled={scraping}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="button-primary" 
                        disabled={scraping || !query}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                    >
                        {scraping ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                        {scraping ? 'Searching...' : 'Start Scraping'}
                    </button>
                </form>
                {message && (
                    <p style={{ marginTop: '1rem', color: 'var(--accent)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={16} /> {message}
                    </p>
                )}
            </div>

            <div className="table-card">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Recent Extraction Results</h3>
                    <button onClick={fetchLeads} className="button-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Refresh</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '1rem' }}>Company</th>
                                <th style={{ padding: '1rem' }}>Owner</th>
                                <th style={{ padding: '1rem' }}>Contact Info</th>
                                <th style={{ padding: '1rem' }}>Type</th>
                                <th style={{ padding: '1rem' }}>Security Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No results yet. Start a scraping session to find leads.
                                    </td>
                                </tr>
                            ) : results.map(lead => {
                                const answers = lead.answers || {};
                                return (
                                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>{lead.company || 'Unknown'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{answers.website || 'No website'}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{answers.owner || 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{lead.email}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.phone}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--bg-gray)', color: 'var(--text-dark)' }}>
                                                {answers.company_type || 'General'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {answers.security_note ? (
                                                <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                                                    <ShieldAlert size={14} /> Insecure
                                                </div>
                                            ) : (
                                                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                                                    <CheckCircle2 size={14} /> Secure
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WebScraping;
