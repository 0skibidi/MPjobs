import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contex/AuthContext';

const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, refreshAuth, checkForToken, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  // Check token presence on mount and when auth state changes
  useEffect(() => {
    setHasToken(checkForToken());
  }, [isAuthenticated, checkForToken]);

  const handleRefresh = async () => {
    setChecking(true);
    setMessage('');
    try {
      await refreshAuth();
      setMessage('Authentication refreshed successfully');
      setHasToken(checkForToken());
    } catch (error) {
      setMessage('Authentication failed. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setChecking(false);
    }
  };

  const handleFixAuth = () => {
    logout();
    setMessage('Authentication reset. Redirecting to login...');
    setTimeout(() => navigate('/login'), 1500);
  };

  // Check for inconsistent state
  const hasAuthInconsistency = isAuthenticated !== hasToken;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-medium mb-2">Authentication Status</h2>
      <div className="flex flex-col">
        <div className="mb-2">
          <p>
            <span className="font-medium">State:</span>{' '}
            {isAuthenticated ? (
              <span className="text-green-600">Authenticated</span>
            ) : (
              <span className="text-red-600">Not authenticated</span>
            )}
          </p>
          <p>
            <span className="font-medium">Token:</span>{' '}
            {hasToken ? (
              <span className="text-green-600">Present</span>
            ) : (
              <span className="text-red-600">Missing</span>
            )}
          </p>
          {user && (
            <p>
              <span className="font-medium">User:</span> {user.name} ({user.role})
            </p>
          )}
          {hasAuthInconsistency && (
            <p className="text-red-600 font-bold mt-2">
              Warning: Authentication state is inconsistent with token presence.
            </p>
          )}
          {message && (
            <p className={message.includes('failed') || message.includes('reset') ? 'text-red-600' : 'text-green-600'}>
              {message}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {checking ? 'Checking...' : 'Refresh Authentication'}
          </button>
          {hasAuthInconsistency && (
            <button
              onClick={handleFixAuth}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Fix Auth State
            </button>
          )}
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-[#B8A361] text-white rounded-md hover:bg-[#a08c4a]"
            >
              Log In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthStatus; 