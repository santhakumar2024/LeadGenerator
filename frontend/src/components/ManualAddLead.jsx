import React, { useState } from 'react';
import mainStyles from '../MainContent.module.css';
import { Sparkles } from 'lucide-react';

const proxyUrl = 'http://localhost:3001/api';

const ManualAddLead = ({ onLeadAdded }) => {
  const [activeTab, setActiveTab] = useState('scraper'); // 'scraper' or 'ai'

  // Scraper State
  const [url, setUrl] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [scraping, setScraping] = useState(false);

  // AI Manual Lead State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [icebreaker, setIcebreaker] = useState('');
  
  const [aiGenerating, setAiGenerating] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setScraping(true);
    setScrapeStatus('Scraping in progress...');
    
    try {
      const res = await fetch(`${proxyUrl}/leads/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      if (data.success) {
        setScrapeStatus(`✅ Success! Found ${data.emailsFound} emails, added ${data.newLeadsAdded} new leads.`);
        if (onLeadAdded) onLeadAdded();
      } else {
        setScrapeStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setScrapeStatus(`❌ Request failed: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    if (!bio) {
      setAiStatus('❌ Please enter a bio first.');
      return;
    }

    setAiGenerating(true);
    setAiStatus('Generating hyper-personalized icebreaker...');

    try {
      const res = await fetch(`${proxyUrl}/ai/icebreaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio })
      });
      const data = await res.json();

      if (data.success) {
        setIcebreaker(data.icebreaker);
        setAiStatus('✅ Icebreaker generated successfully!');
      } else {
        setAiStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setAiStatus(`❌ Request failed: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!email) {
      setAiStatus('❌ Email is required to save the lead.');
      return;
    }

    setSavingLead(true);
    setAiStatus('Saving lead...');

    try {
      const res = await fetch(`${proxyUrl}/leads/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: firstName,
          company_name: companyName,
          ai_icebreaker: icebreaker
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiStatus('✅ Lead saved and injected into queue!');
        // Reset form
        setEmail(''); setFirstName(''); setCompanyName(''); setBio(''); setIcebreaker('');
        if (onLeadAdded) onLeadAdded();
      } else {
        setAiStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setAiStatus(`❌ Save failed: ${err.message}`);
    } finally {
      setSavingLead(false);
    }
  };

  return (
    <div className="table-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      
      {/* Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('scraper')}
          style={{ 
            padding: '1rem 2rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'scraper' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'scraper' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: activeTab === 'scraper' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Automatic (Web Scraper)
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          style={{ 
            padding: '1rem 2rem', 
            background: 'none', 
            border: 'none', 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: activeTab === 'ai' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'ai' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: activeTab === 'ai' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          <Sparkles size={18} />
          Manual (AI Personalization)
        </button>
      </div>

      {activeTab === 'scraper' ? (
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-dark)' }}>Lead Hunter</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Enter a target website URL to automatically extract and import new email leads into QuentroNova.
          </p>
          <form onSubmit={handleScrape} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="url" 
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
            />
            <button type="submit" className={mainStyles['btn-primary']} disabled={scraping} style={{ opacity: scraping ? 0.7 : 1 }}>
              {scraping ? 'Hunting...' : 'Start Scraper'}
            </button>
          </form>
          {scrapeStatus && (
            <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: 'var(--bg-gray)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: scrapeStatus.includes('Error') ? 'var(--text-dark)' : 'var(--success-green)' }}>
              {scrapeStatus}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-dark)' }}>Hyper-Personalize Lead</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Input prospect details and their LinkedIn bio. Gemini AI will construct the perfect opening line.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Column: Data Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="email" placeholder="Lead Email *" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" placeholder="First Name" style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                />
                <input 
                  type="text" placeholder="Company" style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <textarea 
                placeholder="Paste LinkedIn Bio or Profile Text here..." rows="4"
                value={bio} onChange={(e) => setBio(e.target.value)}
                style={{ padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', resize: 'vertical' }}
              />
              <button 
                className={mainStyles['btn-primary']} 
                onClick={handleGenerateAI}
                disabled={aiGenerating}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', opacity: aiGenerating ? 0.7 : 1 }}
              >
                <Sparkles size={16} /> {aiGenerating ? 'Processing with Gemini...' : 'Generate Icebreaker'}
              </button>
            </div>

            {/* Right Column: AI Output & Save */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>AI Generated Hook (Editable)</label>
              <textarea 
                placeholder="Generated icebreaker will appear here..." 
                rows="4"
                value={icebreaker}
                onChange={(e) => setIcebreaker(e.target.value)}
                style={{ padding: '0.6rem', border: '1px solid #8b5cf6', borderRadius: 'var(--radius)', backgroundColor: '#f5f3ff', resize: 'vertical', minHeight: '110px' }}
              />
              <button 
                className={mainStyles['btn-primary']} 
                onClick={handleSaveLead}
                disabled={savingLead || !email}
                style={{ opacity: (savingLead || !email) ? 0.7 : 1 }}
              >
                {savingLead ? 'Saving...' : 'Save Lead'}
              </button>
            </div>
          </div>

          {aiStatus && (
            <div style={{ marginTop: '1rem', padding: '0.8rem', backgroundColor: 'var(--bg-gray)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: aiStatus.includes('Error') || aiStatus.includes('❌') ? 'var(--text-dark)' : 'var(--success-green)' }}>
              {aiStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualAddLead;
