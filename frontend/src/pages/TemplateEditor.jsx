import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const proxyUrl = 'http://localhost:3001/api';

const TemplateEditor = () => {
  const { mainStyles } = useOutletContext();
  const [campaigns, setCampaigns] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ step_number: '', subject: '', body: '' });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${proxyUrl}/campaigns`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${proxyUrl}/campaigns/${editing.id}` : `${proxyUrl}/campaigns`;

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          step_number: parseInt(formData.step_number, 10)
        })
      });
      setEditing(null);
      setFormData({ step_number: '', subject: '', body: '' });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (campaign) => {
    setEditing(campaign);
    setFormData({
      step_number: campaign.step_number,
      subject: campaign.subject,
      body: campaign.body
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this step?')) return;
    try {
      await fetch(`${proxyUrl}/campaigns/${id}`, { method: 'DELETE' });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className={mainStyles.header}>
        <h2>Drip Campaign Templates</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <h3>{editing ? 'Edit template' : 'Add new template'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Step Number (Day)</label>
              <input 
                type="number" 
                name="step_number" 
                value={formData.step_number} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Subject Line</label>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Email Body (HTML supported)</label>
              <textarea 
                name="body" 
                value={formData.body} 
                onChange={handleChange} 
                required 
                rows={6}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className={mainStyles['btn-primary']}>
                {editing ? 'Update Template' : 'Save Template'}
              </button>
              {editing && (
                <button 
                  type="button" 
                  onClick={() => { setEditing(null); setFormData({ step_number: '', subject: '', body: '' }); }}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="table-card" style={{ padding: '0' }}>
          <table>
            <thead>
              <tr>
                <th>Step</th>
                <th>Subject</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 'bold' }}>Day {c.step_number}</td>
                  <td>{c.subject}</td>
                  <td>
                    <button style={{ marginRight: '0.5rem', background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer' }} onClick={() => handleEdit(c)}>Edit</button>
                    <button style={{ background: 'none', border: 'none', color: '#ff5630', cursor: 'pointer' }} onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No templates defined.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
