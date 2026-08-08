import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProblemList } from './components/ProblemList';
import { Workspace } from './components/Workspace';
import { SubmissionsList } from './components/SubmissionsList';
import { AuthModal } from './components/AuthModal';
import { CreateProblemModal } from './components/CreateProblemModal';
import { authApi, getStoredUser, setStoredUser, setStoredToken } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState('problems');
  const [selectedProblemSlug, setSelectedProblemSlug] = useState(null);
  const [user, setUser] = useState(getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateProblemModal, setShowCreateProblemModal] = useState(false);

  useEffect(() => {
    // Verify token on mount
    authApi.me()
      .then((res) => {
        setUser(res.user);
        setStoredUser(res.user);
      })
      .catch(() => {
        setUser(null);
        setStoredUser(null);
        setStoredToken(null);
      });
  }, []);

  const handleSelectProblem = (slug) => {
    setSelectedProblemSlug(slug);
    setActiveTab('workspace');
  };

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    setStoredUser(null);
    setStoredToken(null);
    setUser(null);
    if (activeTab === 'submissions') setActiveTab('problems');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'workspace') setSelectedProblemSlug(null);
        }}
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenCreateProblem={() => setShowCreateProblemModal(true)}
      />

      <main>
        {activeTab === 'problems' && (
          <ProblemList onSelectProblem={handleSelectProblem} />
        )}

        {activeTab === 'workspace' && selectedProblemSlug && (
          <Workspace
            slug={selectedProblemSlug}
            onBack={() => {
              setActiveTab('problems');
              setSelectedProblemSlug(null);
            }}
            user={user}
            onRequireAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsList />
        )}
      </main>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(loggedUser) => setUser(loggedUser)}
        />
      )}

      {showCreateProblemModal && (
        <CreateProblemModal
          onClose={() => setShowCreateProblemModal(false)}
          onSuccess={() => {
            setActiveTab('problems');
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default App;
