import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, CheckCircle2, XCircle, Clock, Cpu, AlertTriangle, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { problemApi, submissionApi, getStoredToken } from '../api';

const DEFAULT_STARTER_CODE = {
  python: `def solve():\n    # Read input from stdin\n    import sys\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    # Write your solution here\n    print("0 1")\n\nsolve()`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Write your solution here\n    cout << "0 1" << endl;\n    return 0;\n}`,
  javascript: `const fs = require('fs');\n\nfunction solve() {\n  const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\n  // Write your solution here\n  console.log("0 1");\n}\n\nsolve();`,
};

export function Workspace({ slug, onBack, user, onRequireAuth }) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_STARTER_CODE.python);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);

  useEffect(() => {
    fetchProblemDetails();
  }, [slug]);

  // Connect Socket.IO for real-time verdict events
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected for live verdicts');
    });

    socket.on('verdict', (data) => {
      console.log('Real-time verdict received:', data);
      if (data.submissionId === submissionId || !submissionId) {
        setVerdict(data);
        setSubmitting(false);
      }
    });

    return () => socket.disconnect();
  }, [submissionId]);

  const fetchProblemDetails = async () => {
    setLoading(true);
    try {
      const res = await problemApi.get(slug);
      setProblem(res.problem);
    } catch (err) {
      setError(err.message || 'Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(DEFAULT_STARTER_CODE[lang] || '');
  };

  const handleSubmit = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    setSubmitting(true);
    setVerdict({ status: 'queued', message: 'Job enqueued in Redis worker...' });

    try {
      const res = await submissionApi.create({
        problemSlug: slug,
        language,
        code,
      });

      const sub = res.submission;
      setSubmissionId(sub.id);
      setVerdict({ status: 'running', message: 'Judging code in sandbox...' });

      // Poll as fallback if Socket.IO isn't immediate
      pollSubmission(sub.id);
    } catch (err) {
      setSubmitting(false);
      setVerdict({ status: 'internal_error', error: err.message });
    }
  };

  const pollSubmission = async (id) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await submissionApi.get(id);
        const sub = res.submission;
        if (sub.status !== 'queued' && sub.status !== 'running') {
          setVerdict(sub);
          setSubmitting(false);
          clearInterval(interval);
        }
      } catch {
        // keep polling up to 10 attempts
      }
      if (attempts >= 10) {
        clearInterval(interval);
        setSubmitting(false);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        <p>Loading problem workspace...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '32px' }} className="glass-panel">
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '16px', background: 'transparent' }}>
          <ArrowLeft size={16} /> Back to Problems
        </button>
        <div style={{ color: '#fb7185' }}>{error || 'Problem not found'}</div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Action Header */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{problem.title}</h2>
          <span className={`badge badge-${problem.difficulty}`}>{problem.difficulty}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              background: 'var(--bg-dark)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="python">Python 3 (3.12)</option>
            <option value="cpp">C++17 (gcc 13)</option>
            <option value="javascript">JavaScript (Node 20)</option>
          </select>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: 'var(--gradient-glow)',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="#fff" />}
            {submitting ? 'Judging...' : 'Submit Solution'}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Pane: Description & Examples */}
        <div style={{
          width: '45%',
          borderRight: '1px solid var(--border-color)',
          overflowY: 'auto',
          padding: '24px',
          background: 'rgba(15, 23, 42, 0.4)',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-cyan)' }}>
            Description
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', whitespace: 'pre-wrap', marginBottom: '24px' }}>
            {problem.description}
          </p>

          {/* Resource Constraints */}
          <div style={{
            display: 'flex',
            gap: '20px',
            background: 'var(--bg-dark)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            border: '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Clock size={16} color="var(--accent-amber)" />
              <span>Time Limit: <strong>{problem.timeLimit} ms</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Cpu size={16} color="var(--accent-cyan)" />
              <span>Memory Limit: <strong>{problem.memoryLimit} MB</strong></span>
            </div>
          </div>

          {/* Examples */}
          {problem.examples && problem.examples.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--accent-cyan)' }}>
                Examples
              </h3>
              {problem.examples.map((ex, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Example {idx + 1}:</div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: 'var(--accent-amber)' }}>Input:</span> {ex.input}
                  </div>
                  <div>
                    <span style={{ color: 'var(--accent-emerald)' }}>Output:</span> {ex.output}
                  </div>
                  {ex.explanation && (
                    <div style={{ marginTop: '8px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                      Explanation: {ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Code Editor & Verdict Panel */}
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column', background: '#070a12' }}>
          {/* Code Editor Header */}
          <div style={{
            padding: '10px 16px',
            background: '#0d1322',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>SOLUTION ({language.toUpperCase()})</span>
            <span>UTF-8</span>
          </div>

          {/* Code Textarea */}
          <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-editor-textarea"
              style={{ height: '100%' }}
              placeholder="// Write your solution code here..."
            />
          </div>

          {/* Real-time Verdict Bottom Panel */}
          {verdict && (
            <div style={{
              borderTop: '1px solid var(--border-color)',
              background: '#0f172a',
              padding: '16px 20px',
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {verdict.status === 'accepted' ? (
                    <CheckCircle2 size={22} color="#34d399" />
                  ) : verdict.status === 'queued' || verdict.status === 'running' ? (
                    <Loader2 size={22} color="#818cf8" className="animate-spin" />
                  ) : (
                    <XCircle size={22} color="#f87171" />
                  )}

                  <span style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Verdict: <span style={{
                      color: verdict.status === 'accepted' ? '#34d399' :
                             verdict.status === 'queued' || verdict.status === 'running' ? '#818cf8' : '#f87171'
                    }}>{verdict.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>

                {verdict.score !== undefined && (
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    Score: {verdict.score}%
                  </div>
                )}
              </div>

              {verdict.message && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{verdict.message}</div>
              )}

              {/* Per Test Case Breakdown */}
              {verdict.results && verdict.results.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {verdict.results.map((res, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <span>Test Case #{res.testCaseIndex + 1}</span>
                      <span className={`badge badge-${res.status === 'accepted' ? 'accepted' : 'wrong'}`}>
                        {res.status}
                      </span>
                      {res.stderr && (
                        <div style={{ color: '#f87171', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '4px' }}>
                          Error: {res.stderr}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
