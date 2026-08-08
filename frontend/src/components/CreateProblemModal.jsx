import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { problemApi } from '../api';

export function CreateProblemModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description: '',
    difficulty: 'easy',
    tags: 'array, math',
    timeLimit: 2000,
    memoryLimit: 256,
    status: 'published',
  });

  const [testCases, setTestCases] = useState([
    { input: '2 7 11 15\n9', expectedOutput: '0 1' },
  ]);

  const [examples, setExamples] = useState([
    { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  const handleRemoveTestCase = (idx) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        timeLimit: parseInt(formData.timeLimit),
        memoryLimit: parseInt(formData.memoryLimit),
        testCases,
        examples,
      };

      await problemApi.create(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Add New Problem</h2>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Title</label>
              <input
                type="text" required placeholder="Two Sum"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value;
                  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setFormData({ ...formData, title, slug });
                }}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>URL Slug</label>
              <input
                type="text" required placeholder="two-sum"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              required rows={4} placeholder="Problem description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tags (comma-separated)</label>
              <input
                type="text" placeholder="array, math"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
              />
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>Judge Test Cases</label>
              <button type="button" onClick={handleAddTestCase} style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', background: 'transparent', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Plus size={14} /> Add Test Case
              </button>
            </div>

            {testCases.map((tc, idx) => (
              <div key={idx} style={{ background: 'var(--bg-dark)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input #{idx + 1}</span>
                    <textarea
                      rows={2} value={tc.input}
                      onChange={(e) => {
                        const copy = [...testCases];
                        copy[idx].input = e.target.value;
                        setTestCases(copy);
                      }}
                      style={{ width: '100%', padding: '6px', background: '#090d16', border: '1px solid var(--border-color)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expected Output #{idx + 1}</span>
                    <textarea
                      rows={2} value={tc.expectedOutput}
                      onChange={(e) => {
                        const copy = [...testCases];
                        copy[idx].expectedOutput = e.target.value;
                        setTestCases(copy);
                      }}
                      style={{ width: '100%', padding: '6px', background: '#090d16', border: '1px solid var(--border-color)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                    />
                  </div>
                  {testCases.length > 1 && (
                    <button type="button" onClick={() => handleRemoveTestCase(idx)} style={{ background: 'transparent', color: '#f87171', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              background: 'var(--gradient-glow)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-md)', fontWeight: 700, marginTop: '12px',
            }}
          >
            {loading ? 'Publishing...' : 'Publish Problem'}
          </button>
        </form>
      </div>
    </div>
  );
}
