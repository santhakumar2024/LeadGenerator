import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const proxyUrl = 'http://localhost:3001/api';

const ColdCallQueue = () => {
  const { mainStyles } = useOutletContext();
  const [leads, setLeads] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [callsToday, setCallsToday] = useState(0);
  const dailyGoal = 20;

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${proxyUrl}/leads`);
      const data = await res.json();
      // Only keep leads that need reaching out (NEW, FOLLOW_UP_CALL)
      const callQueue = data.filter(l => l.status === 'NEW' || l.status === 'FOLLOW_UP_CALL');
      setLeads(callQueue);
    } catch (err) {
      console.error(err);
    }
  };

  const currentLead = leads[currentIndex];

  const updateLeadAndNext = async (leadId, status, followUpDate = null) => {
    try {
      await fetch(`${proxyUrl}/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          follow_up_at: followUpDate ? followUpDate.toISOString() : undefined 
        })
      });
      // Skip to next lead
      setCallsToday(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallNow = () => {
    if (currentLead.phone) {
      window.location.href = 'tel:' + currentLead.phone;
    } else {
      alert("No phone number found for this lead.");
    }
  };

  const getSalesScript = (companyType) => {
    const type = (companyType || '').toLowerCase();
    if (type.includes('saas') || type.includes('software')) {
      return "Hi, I noticed you're in SaaS—what's your strategy for combating churn right now?";
    } else if (type.includes('agency') || type.includes('marketing')) {
      return "Hi, as an agency, how are you scaling your client acquisition without adding overhead?";
    } else {
      return "Hi, QuentroNova helps businesses automate their outbound sales. Are you currently doing cold outreach?";
    }
  };

  return (
    <div>
      <div className={mainStyles.header} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <h2>Power Hour Dashboard</h2>
        <div style={{ width: '100%', maxWidth: '300px', marginTop: '1rem', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden', height: '10px' }}>
          <div style={{ width: `${Math.min((callsToday / dailyGoal) * 100, 100)}%`, background: 'var(--success-green)', height: '100%', transition: 'width 0.3s ease' }}></div>
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Calls Made Today: {callsToday} / Goal: {dailyGoal}
        </p>
      </div>

      {currentLead ? (
        <div className="table-card" style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
            {currentLead.first_name || 'No Name'} {currentLead.last_name || ''}
          </h1>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'normal', marginBottom: '0.2rem' }}>
            {currentLead.job_title || 'Unknown Title'}
          </h3>
          <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-blue)', marginBottom: '2rem' }}>
            @ {currentLead.company_name || 'Unknown Company'}
          </h4>

          <div style={{ padding: '1.5rem', background: '#ebf2ff', borderRadius: 'var(--radius)', marginBottom: '2rem', textAlign: 'left', borderLeft: '4px solid var(--primary-blue)' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--primary-blue)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Opening Line:</strong>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>
              "{getSalesScript(currentLead.company_type)}"
            </p>
          </div>

          <button 
            onClick={handleCallNow}
            style={{ padding: '1rem 3rem', fontSize: '1.25rem', backgroundColor: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '2rem', boxShadow: '0 4px 14px 0 rgba(0,82,204,0.39)' }}
          >
            📞 CALL NOW
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => updateLeadAndNext(currentLead.id, 'FOLLOW_UP_CALL')}
              style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-gray)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text-dark)' }}
            >
              No Answer
            </button>
            <button 
              onClick={() => {
                const fourHoursLater = new Date();
                fourHoursLater.setHours(fourHoursLater.getHours() + 4);
                updateLeadAndNext(currentLead.id, 'FOLLOW_UP_CALL', fourHoursLater);
              }}
              style={{ padding: '0.6rem 1.2rem', background: 'var(--bg-gray)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text-dark)' }}
            >
              Gatekeeper / Busy
            </button>
            <button 
              onClick={() => updateLeadAndNext(currentLead.id, 'QUALIFIED')}
              style={{ padding: '0.6rem 1.2rem', background: 'var(--success-green)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
            >
              Meeting Set! 🎉
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
          <h3>🎉 Queue Completed!</h3>
          <p>You have hit all your pending cold calls.</p>
        </div>
      )}
    </div>
  );
};

export default ColdCallQueue;
