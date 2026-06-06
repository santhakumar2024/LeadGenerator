import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const proxyUrl = 'http://localhost:3001/api';

const ScheduleMeeting = () => {
  const { leadId } = useParams();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) return;

    setLoading(true);
    setStatus('Scheduling your meeting...');

    try {
      // Combine date and time
      const datetime = new Date(`${date}T${time}`);
      
      const res = await fetch(`${proxyUrl}/meetings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, date: datetime.toISOString() })
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Success! Check your inbox for the calendar invite.');
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="table-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary-blue)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>QuentroNova</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Schedule your discovery call.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Select Date:</label>
            <input 
              type="date" 
              required 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Select Time:</label>
            <input 
              type="time" 
              required 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--primary-blue)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Confirming...' : 'Confirm Meeting'}
          </button>
        </form>

        {status && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f5ff', color: 'var(--text-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleMeeting;
