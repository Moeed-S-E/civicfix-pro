import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, LogOut, RefreshCw } from 'lucide-react';
import {
  fetchIssueStats,
  fetchIssues,
  getApiErrorMessage,
  loginAdmin,
  logoutAdmin,
  updateIssueStatus
} from '../api/issues.js';
import AdminLoginForm from '../components/AdminLoginForm.jsx';
import DashboardAnalytics from '../components/DashboardAnalytics.jsx';
import IssueModerationTable from '../components/IssueModerationTable.jsx';

function AdminDashboard({
  authenticated,
  authError,
  authLoading,
  onAuthChange,
  onAuthErrorChange
}) {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const dashboardRequest = useRef(0);

  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => setActionSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  const loadDashboard = useCallback(async () => {
    if (!authenticated) return;

    const requestId = ++dashboardRequest.current;
    setIsLoading(true);
    setLoadError('');

    try {
      const [nextStats, nextIssues] = await Promise.all([
        fetchIssueStats(),
        fetchIssues()
      ]);

      if (requestId !== dashboardRequest.current) return;
      setStats(nextStats);
      setIssues(nextIssues);
    } catch (error) {
      if (requestId !== dashboardRequest.current) return;
      setLoadError(getApiErrorMessage(error, 'Could not load dashboard data.'));

      if (error.response?.status === 401) {
        dashboardRequest.current += 1;
        onAuthChange(false);
        setStats(null);
        setIssues([]);
        setIsLoading(false);
      }
    } finally {
      if (requestId === dashboardRequest.current) {
        setIsLoading(false);
      }
    }
  }, [authenticated, onAuthChange]);

  useEffect(() => {
    if (authenticated) {
      loadDashboard();
      const refreshInterval = window.setInterval(loadDashboard, 30_000);
      return () => {
        window.clearInterval(refreshInterval);
        dashboardRequest.current += 1;
      };
    } else if (!authLoading) {
      dashboardRequest.current += 1;
      setStats(null);
      setIssues([]);
      setLoadError('');
      setActionError('');
      setActionSuccess('');
      setIsLoading(false);
    }
    return () => { dashboardRequest.current += 1; };
  }, [authenticated, authLoading, loadDashboard]);

  async function handleLogin(event) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setActionError('Enter your username and password to sign in.');
      return;
    }

    setIsSigningIn(true);
    setActionError('');
    try {
      await loginAdmin({ username: username.trim(), password });
      setPassword('');
      onAuthErrorChange('');
      onAuthChange(true);
    } catch (error) {
      setActionError(
        getApiErrorMessage(error, 'Could not sign in. Check your username and password.')
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await logoutAdmin();
      dashboardRequest.current += 1;
      setStats(null);
      setIssues([]);
      setLoadError('');
      setActionError('');
      setActionSuccess('');
      setIsLoading(false);
      onAuthChange(false);
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Could not sign out. Please try again.'));
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleStatusChange(issueId, status) {
    if (!authenticated) {
      setActionError('Sign in before changing a report status.');
      return;
    }

    setUpdatingId(issueId);
    setActionError('');
    setActionSuccess('');

    try {
      await updateIssueStatus(issueId, status);
      await loadDashboard();
      setActionSuccess(`Status updated to "${status}".`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Could not update this report.'));
      if (error.response?.status === 401) {
        await handleLogout();
      }
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="eyebrow">CIVICFIX PRO / OVERVIEW</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 text-ink/55">A clear view of what your community needs.</p>
        </div>
        {authenticated && (
          <div className="flex flex-wrap gap-2">
            <button
              className="refresh-button"
              disabled={isLoading}
              onClick={() => loadDashboard()}
              type="button"
            >
              <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} /> Refresh data
            </button>
            <button
              className="refresh-button"
              disabled={Boolean(updatingId) || isSigningOut}
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>

      {loadError && (
        <div
          className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span>{loadError}</span>
          <button className="font-bold underline" onClick={() => loadDashboard()} type="button">
            Try again
          </button>
        </div>
      )}

      {authLoading ? (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-ink/55">
          <LoaderCircle aria-hidden="true" className="animate-spin" size={20} />
          Checking admin session…
        </div>
      ) : !authenticated ? (
        <AdminLoginForm
          actionError={actionError}
          authError={authError}
          isSigningIn={isSigningIn}
          onActionErrorChange={setActionError}
          onSubmit={handleLogin}
          password={password}
          setPassword={setPassword}
          setUsername={setUsername}
          username={username}
        />
      ) : isLoading && !stats ? (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-ink/55">
          <LoaderCircle aria-hidden="true" className="animate-spin" size={20} /> Loading dashboard…
        </div>
      ) : stats && (
        <>
          <DashboardAnalytics stats={stats} />

          {actionError && (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {actionError}
            </p>
          )}

          {actionSuccess && (
            <div
              className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
              role="status"
            >
              <CheckCircle2 aria-hidden="true" size={17} />
              {actionSuccess}
            </div>
          )}

          <IssueModerationTable
            authenticated={authenticated}
            issues={issues}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
