import React, { useState, useEffect } from 'react';

const proxyUrl = 'http://localhost:3001/api';

const ExitIntentPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleMouseLeave = (e) => {
      // clientY < 20 indicates mouse moving towards browser address bar/tab bar
      if (e.clientY < 20) {
        const hasSeenPopup = sessionStorage.getItem('exit_intent_seen');
        if (!hasSeenPopup) {
          setIsOpen(true);
          sessionStorage.setItem('exit_intent_seen', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setErrorMsg('Email is required.');

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${proxyUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || null,
          email,
          source: 'Exit Intent Popup',
          consent: true,
          answers: {
            leadMagnetRequested: 'Outbound Automation Playbook'
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 3000); // Auto close after 3 seconds
      } else {
        setErrorMsg(data.message || data.error || 'Failed to submit email. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting exit-intent lead:', err);
      setErrorMsg('Server connection failed. Please check your console.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={handleClose} style={styles.closeBtn} aria-label="Close modal">&times;</button>
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} style={styles.container}>
            <div style={styles.badge}>🎁 FREE RESOURCE</div>
            <h2 style={styles.title}>Wait! Don't Leave Empty Handed!</h2>
            <p style={styles.subtitle}>
              Get our <strong>Outbound Automation Playbook</strong> (valued at $97) absolutely free. 
              Learn how we scaled our lead gen to 100+ meetings/month.
            </p>

            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {errorMsg && <p style={styles.error}>{errorMsg}</p>}

            <button type="submit" disabled={isLoading} style={styles.submitBtn}>
              {isLoading ? 'Sending Playbook...' : 'Send Me My Free Playbook 🚀'}
            </button>
            
            <p style={styles.footerNote}>Zero spam. Unsubscribe at any time.</p>
          </form>
        ) : (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>🎉</div>
            <h2 style={styles.title}>It's On Its Way!</h2>
            <p style={styles.subtitle}>
              We've sent the <strong>Outbound Automation Playbook</strong> to <strong>{email}</strong>. 
              Check your inbox shortly!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Elegant, premium inline styles (glassmorphism details + clean colors)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 20, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    animation: 'fadeIn 0.3s ease-out',
  },
  modal: {
    position: 'relative',
    backgroundColor: 'var(--bg, #fff)',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    width: '520px',
    maxWidth: '90%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    boxSizing: 'border-box',
    animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: 'var(--text-muted, #718096)',
    transition: 'color 0.2s',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
    padding: '4px 12px',
    borderRadius: '9999px',
    marginBottom: '1rem',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--text-h, #1a202c)',
    margin: '0 0 0.75rem 0',
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: '15px',
    color: 'var(--text, #4a5568)',
    lineHeight: '1.5',
    margin: '0 0 1.5rem 0',
  },
  inputGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border, #cbd5e0)',
    backgroundColor: 'var(--bg, #fff)',
    color: 'var(--text-h, #1a202c)',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#e53e3e',
    fontSize: '13px',
    margin: '0 0 1rem 0',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: '8px',
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
    transition: 'transform 0.1s active, background-color 0.2s',
  },
  footerNote: {
    fontSize: '12px',
    color: 'var(--text-muted, #718096)',
    marginTop: '0.75rem',
    margin: '0.75rem 0 0 0',
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1.5rem 0',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '1rem',
  }
};

export default ExitIntentPopup;
