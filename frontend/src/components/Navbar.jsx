import React from 'react';
import { Terminal, Code2, History, PlusCircle, LogOut, User, ShieldCheck } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, onOpenCreateProblem }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Brand Logo */}
      <div 
        onClick={() => setActiveTab('problems')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--gradient-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
        }}>
          <Terminal size={22} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            OJ<span className="gradient-text">X</span>
          </span>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            padding: '2px 6px',
            borderRadius: '4px',
            marginLeft: '6px',
            fontWeight: 600
          }}>
            v0.1
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('problems')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'problems' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'problems' ? '#a5b4fc' : 'var(--text-secondary)',
            fontWeight: activeTab === 'problems' ? 600 : 500,
            transition: 'all 0.2s',
          }}
        >
          <Code2 size={18} />
          Problems
        </button>

        {user && (
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'submissions' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'submissions' ? '#a5b4fc' : 'var(--text-secondary)',
              fontWeight: activeTab === 'submissions' ? 600 : 500,
              transition: 'all 0.2s',
            }}
          >
            <History size={18} />
            My Submissions
          </button>
        )}
      </nav>

      {/* User / Auth Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user?.role === 'admin' && (
          <button
            onClick={onOpenCreateProblem}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <PlusCircle size={16} />
            Add Problem
          </button>
        )}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}>
              <User size={16} color="#a5b4fc" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.username}</span>
              {user.role === 'admin' && (
                <span title="Admin Role" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ShieldCheck size={14} color="#34d399" />
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              title="Log Out"
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#fb7185',
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              background: 'var(--gradient-glow)',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            }}
          >
            Sign In / Sign Up
          </button>
        )}
      </div>
    </header>
  );
}
