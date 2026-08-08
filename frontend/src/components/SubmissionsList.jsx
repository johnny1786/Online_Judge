import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle, Clock, FileCode2, Loader2 } from 'lucide-react';
import { submissionApi } from '../api';

export function SubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await submissionApi.list();
      setSubmissions(res.submissions || []);
    } catch (err) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <History size={20} color="#a5b4fc" />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Submission History</h1>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading submission history...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '24px', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <FileCode2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3>No submissions yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
            Choose a challenge from the Problems tab and submit your solution!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {submissions.map((sub) => (
            <div
              key={sub._id || sub.id}
              className="glass-panel"
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {sub.status === 'accepted' ? (
                  <CheckCircle2 size={24} color="#34d399" />
                ) : (
                  <XCircle size={24} color="#f87171" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {sub.problemId?.title || 'Problem Challenge'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Submitted {new Date(sub.createdAt).toLocaleString()} • Language: <strong style={{ color: 'var(--text-secondary)' }}>{sub.language}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span className={`badge badge-${sub.status === 'accepted' ? 'accepted' : 'wrong'}`}>
                  {sub.status.replace(/_/g, ' ')}
                </span>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                  Score: {sub.score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
