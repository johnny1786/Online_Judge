import React, { useState, useEffect } from 'react';
import { Search, Tag, ArrowRight, Code2, CheckCircle2, Clock } from 'lucide-react';
import { problemApi } from '../api';

export function ProblemList({ onSelectProblem }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProblems();
  }, [difficultyFilter]);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await problemApi.list(params);
      setProblems(res.problems || []);
    } catch (err) {
      setError(err.message || 'Failed to load problems');
    } finally {
      setLoading(false);
    }
  };

  const filtered = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px' }}>
          <span style={{
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '9999px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            AI-Powered Online Judge
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '12px 0 16px', lineHeight: 1.2 }}>
            Master Algorithms with <span className="gradient-text">Real-Time Judging</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Solve challenges in C++, Python, or JavaScript. Code is executed inside hardened Docker sandboxes with sub-millisecond execution tracking.
          </p>
        </div>
      </div>

      {/* Controls Bar: Filters & Search */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        {/* Difficulty Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'easy', 'medium', 'hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: difficultyFilter === diff ? 'var(--accent-primary)' : 'rgba(30, 41, 59, 0.6)',
                color: difficultyFilter === diff ? '#ffffff' : 'var(--text-secondary)',
                border: difficultyFilter === diff ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                transition: 'all 0.2s',
              }}
            >
              {diff || 'All Difficulties'}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {/* Problems List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Code2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading problems...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '32px', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', borderRadius: 'var(--radius-lg)' }}>
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <Code2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3>No problems found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((problem) => (
            <div
              key={problem.id || problem.slug}
              onClick={() => onSelectProblem(problem.slug)}
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{problem.title}</h3>
                  <span className={`badge badge-${problem.difficulty}`}>
                    {problem.difficulty}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Time Limit: {problem.timeLimit}ms
                  </span>
                  <span>•</span>
                  <span>Memory Limit: {problem.memoryLimit}MB</span>
                  
                  {problem.tags && problem.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {problem.tags.map((t) => (
                          <span key={t} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                          }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Solve Challenge <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
