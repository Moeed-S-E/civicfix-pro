import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  UserRound
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  fetchIssueStats,
  fetchIssues,
  getApiErrorMessage,
  loginAdmin,
  logoutAdmin,
  updateIssueStatus
} from '../api/issues.js';

const statusOptions = ['Pending', 'In Progress', 'Resolved'];

// Chart colour palettes — green family for categories, status-specific for pie
const chartColors  = ['#1e5b46', '#75a84b', '#a8cf5b', '#d2e6a8'];
const statusColors = ['#d49a32', '#4b83b6', '#4b9a62'];

/** Format a date string to a human-readable locale-aware string. */
function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
}

// ---------------------------------------------------------------------------
// AdminDashboard component
// ---------------------------------------------------------------------------
function AdminDashboard({
  authenticated,
  authError,
  authLoading,
  onAuthChange,
  onAuthErrorChange
}) {
  // --- data state ---
  const [stats,  setStats]  = useState(null);
  const [issues, setIssues] = useState([]);

  // --- login form state ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // --- loading / error state ---
  const [isSigningIn,  setIsSigningIn]  = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [loadError,    setLoadError]    = useState('');
  const [actionError,  setActionError]  = useState('');

  /**
   * actionSuccess — string shown in the success toast after a status update.
   * Empty string = no toast.  Auto-cleared after 4 seconds by a useEffect.
   */
  const [actionSuccess, setActionSuccess] = useState('');

  // ID of the report whose status is currently being saved (shows spinner)
  const [updatingId, setUpdatingId] = useState('');

  /**
   * CONCEPT: useRef
   * A ref is a mutable container whose .current property persists across
   * renders without triggering a re-render when it changes.
   * We use it as a request-cancellation counter.
   */
  const dashboardRequest = useRef(0);

  // ---------------------------------------------------------------------------
  // Auto-dismiss success toast
  // ---------------------------------------------------------------------------
  /**
   * CONCEPT: useEffect + cleanup for auto-dismiss
   * When actionSuccess is set to a non-empty string, this effect schedules a
   * timer to clear it after 4 seconds.  The cleanup function clears the timer
   * if actionSuccess changes again before the 4 seconds elapse (e.g. another
   * status update fires) — prevents stacking timers.
   */
  useEffect(() => {
    if (!actionSuccess) return;
    const timer = setTimeout(() => setActionSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccess]);

  // ---------------------------------------------------------------------------
  // Load dashboard data
  // ---------------------------------------------------------------------------
  const loadDashboard = useCallback(async () => {
    if (!authenticated) return;

    // Increment the counter and capture this request's "ticket"
    const requestId = ++dashboardRequest.current;
    setIsLoading(true);
    setLoadError('');

    try {
      /**
       * CONCEPT: Promise.all — parallel requests
       * fetchIssueStats() and fetchIssues() are independent calls.
       * Running them together takes max(t1, t2) time instead of t1 + t2.
       */
      const [nextStats, nextIssues] = await Promise.all([
        fetchIssueStats(),
        fetchIssues()
      ]);

      // Stale-closure guard: ignore if a newer request has started
      if (requestId !== dashboardRequest.current) return;

      setStats(nextStats);
      setIssues(nextIssues);
    } catch (error) {
      if (requestId !== dashboardRequest.current) return;
      setLoadError(getApiErrorMessage(error, 'Could not load dashboard data.'));

      // Session expired mid-session — force sign-out
      if (error.response?.status === 401) {
        dashboardRequest.current += 1;
        onAuthChange(false);
        setStats(null);
        setIssues([]);
        setIsLoading(false);
      }
    } finally {
      // Only update loading state if we are still the most recent request
      if (requestId === dashboardRequest.current) {
        setIsLoading(false);
      }
    }
  }, [authenticated, onAuthChange]);

  // ---------------------------------------------------------------------------
  // Auto-load + 30-second refresh interval
  // ---------------------------------------------------------------------------
  /**
   * CONCEPT: useEffect with cleanup
   * When authenticated becomes true (user signs in) we load data immediately
   * and then poll every 30 seconds.
   * The cleanup function runs when authenticated changes (e.g. sign-out) or
   * when the component unmounts, clearing the interval and invalidating any
   * in-flight request.
   */
  useEffect(() => {
    if (authenticated) {
      loadDashboard();
      const refreshInterval = window.setInterval(loadDashboard, 30_000);
      return () => {
        window.clearInterval(refreshInterval);
        dashboardRequest.current += 1;   // discard any pending responses
      };
    } else if (!authLoading) {
      // Reset everything when signed out
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

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

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

  /**
   * handleStatusChange — called when the admin changes the <select> value.
   * Sets updatingId so the matching row shows a spinner while the PATCH
   * request is in-flight, then reloads the dashboard to reflect the change.
   * Shows a brief success toast on completion.
   */
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
      // Reload so the charts and table reflect the new status
      await loadDashboard();
      // Brief success feedback — auto-dismissed by the useEffect above
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

  // ---------------------------------------------------------------------------
  // Derived data for charts
  // ---------------------------------------------------------------------------
  const cards = stats ? [
    { label: 'Total reports',  value: stats.total,              icon: ClipboardList, detail: 'All community reports',  color: 'card-green' },
    { label: 'Pending review', value: stats.byStatus.pending,   icon: AlertCircle,   detail: 'Waiting for attention',  color: 'card-amber' },
    { label: 'In progress',    value: stats.byStatus.inProgress, icon: Activity,     detail: 'Being worked on',        color: 'card-blue'  },
    { label: 'Resolved',       value: stats.byStatus.resolved,   icon: CheckCircle2, detail: 'Issues taken care of',   color: 'card-lime'  }
  ] : [];

  const statusChartData = stats ? [
    { name: 'Pending',     value: stats.byStatus.pending     },
    { name: 'In Progress', value: stats.byStatus.inProgress  },
    { name: 'Resolved',    value: stats.byStatus.resolved    }
  ] : [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto min-h-[75vh] max-w-7xl px-5 py-10 sm:px-8 lg:py-14">

      {/* Page header */}
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

      {/* Load error banner */}
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

      {/* --- auth loading state --- */}
      {authLoading ? (
        <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-ink/55">
          <LoaderCircle aria-hidden="true" className="animate-spin" size={20} />
          Checking admin session…
        </div>

      ) : !authenticated ? (
        /* --- login form --- */
        <section className="dashboard-panel mx-auto mt-10 max-w-lg">
          <div className="flex items-start gap-4">
            <span className="kpi-icon"><UserRound size={18} /></span>
            <div>
              <h2 className="text-lg font-extrabold">Admin sign in</h2>
              <p className="mt-1 text-sm leading-6 text-ink/50">
                Sign in to access private report details, analytics, and moderation tools.
              </p>
            </div>
          </div>

          <form className="mt-5" onSubmit={handleLogin} noValidate>
            <label className="field-label" htmlFor="admin-username">Username</label>
            <input
              autoComplete="username"
              className="field-input"
              id="admin-username"
              onChange={(event) => { setUsername(event.target.value); setActionError(''); }}
              placeholder="Enter your username"
              required
              type="text"
              value={username}
            />

            <label className="field-label mt-4" htmlFor="admin-password">Password</label>
            <input
              autoComplete="current-password"
              className="field-input"
              id="admin-password"
              onChange={(event) => { setPassword(event.target.value); setActionError(''); }}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />

            <p className="mt-3 text-xs leading-5 text-ink/45">
              Your secure session expires after one hour.
            </p>

            <button className="submit-button mt-5" disabled={isSigningIn} type="submit">
              {isSigningIn
                ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> Signing in…</>
                : <><LogIn aria-hidden="true" size={17} /> Sign in</>
              }
            </button>
          </form>

          {authError   && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{authError}</p>}
          {actionError && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}
        </section>

      ) : isLoading && !stats ? (
        /* --- initial dashboard load spinner --- */
        <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl bg-white py-16 text-ink/55">
          <LoaderCircle aria-hidden="true" className="animate-spin" size={20} /> Loading dashboard…
        </div>

      ) : stats && (
        /* --- authenticated dashboard --- */
        <>
          {/* KPI cards — responsive 2-col → 4-col grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, detail, color }) => (
              <article className={`kpi-card ${color}`} key={label}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink/60">{label}</span>
                  <span className="kpi-icon"><Icon aria-hidden="true" size={18} /></span>
                </div>
                <p className="mt-4 text-4xl font-extrabold tracking-tight">{value}</p>
                <p className="mt-1 text-xs font-medium text-ink/50">{detail}</p>
                <span className="kpi-trend">
                  {value > 0
                    ? <ArrowUpRight aria-hidden="true" size={14} />
                    : <ArrowDownRight aria-hidden="true" size={14} />
                  } Live count
                </span>
              </article>
            ))}
          </div>

          {/* Charts — stacks on mobile, side-by-side on lg */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">

            {/* Bar chart: issues by category */}
            <section className="dashboard-panel">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold">Issues by category</h2>
                  <p className="mt-1 text-sm text-ink/50">Reports grouped by the kind of issue</p>
                </div>
                <span className="category-label">ALL TIME</span>
              </div>
              <div className="h-72 w-full">
                {stats.byCategory.every(({ count }) => count === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-ink/45">
                    Category data will appear when reports come in.
                  </div>
                ) : (
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart
                      data={stats.byCategory}
                      margin={{ top: 8, right: 12, left: -18, bottom: 4 }}
                    >
                      <CartesianGrid stroke="#e9eee9" strokeDasharray="4 4" vertical={false} />
                      <XAxis
                        axisLine={false}
                        dataKey="category"
                        tick={{ fill: '#64766e', fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tick={{ fill: '#84928c', fontSize: 12 }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          border: '1px solid #e8eee8',
                          borderRadius: 12,
                          boxShadow: '0 8px 24px rgba(24,51,44,.08)'
                        }}
                        cursor={{ fill: '#f3f7f0' }}
                      />
                      <Bar dataKey="count" name="Reports" radius={[7, 7, 0, 0]}>
                        {stats.byCategory.map((entry, index) => (
                          <Cell
                            fill={chartColors[index % chartColors.length]}
                            key={entry.category}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Pie chart: reports by status */}
            <section className="dashboard-panel">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold">Reports by status</h2>
                <p className="mt-1 text-sm text-ink/50">Current progress across all reports</p>
              </div>
              <div className="h-72 w-full">
                {statusChartData.every(({ value }) => value === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-ink/45">
                    Status data will appear when reports come in.
                  </div>
                ) : (
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        innerRadius={55}
                        nameKey="name"
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell fill={statusColors[index]} key={entry.name} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          border: '1px solid #e8eee8',
                          borderRadius: 12,
                          boxShadow: '0 8px 24px rgba(24,51,44,.08)'
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>
          </div>

          {/* Status update feedback banners */}
          {actionError && (
            <p
              className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {actionError}
            </p>
          )}

          {/*
            Success toast — appears after a status update, auto-dismissed after 4s.
            role="status" announces the message to screen readers without
            interrupting them (less urgent than role="alert").
          */}
          {actionSuccess && (
            <div
              className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
              role="status"
            >
              <CheckCircle2 aria-hidden="true" size={17} />
              {actionSuccess}
            </div>
          )}

          {/* Reports table */}
          <section className="dashboard-panel mt-6 p-0">
            <div className="flex flex-col gap-3 border-b border-ink/5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-extrabold">Community reports</h2>
                <p className="mt-1 text-sm text-ink/50">{issues.length} reports · newest first</p>
              </div>
              <span className="category-label">LIVE MODERATION</span>
            </div>

            {issues.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ClipboardList aria-hidden="true" className="mx-auto text-ink/25" size={28} />
                <p className="mt-3 font-bold">No reports to moderate</p>
                <p className="mt-1 text-sm text-ink/50">New community reports will show up here.</p>
              </div>
            ) : (
              /*
               * overflow-x-auto + min-w-[760px] — the table scrolls
               * horizontally on small screens instead of breaking layout.
               * This is a simple, reliable pattern for data tables on mobile.
               */
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-ink/5 text-xs uppercase tracking-wider text-ink/45">
                      <th className="px-6 py-3 font-bold">Report</th>
                      <th className="px-5 py-3 font-bold">Category</th>
                      <th className="px-5 py-3 font-bold">Location</th>
                      <th className="px-5 py-3 font-bold">Date</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr className="border-b border-ink/5 last:border-0" key={issue._id}>
                        <td className="max-w-sm px-6 py-4">
                          <p className="truncate text-sm font-bold">{issue.title}</p>
                          <p className="mt-1 truncate text-xs text-ink/45">{issue.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="category-label">{issue.category}</span>
                        </td>
                        <td className="max-w-48 px-5 py-4 text-sm text-ink/60">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin aria-hidden="true" size={14} />{issue.location}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-ink/55">
                          {formatDate(issue.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          {/*
                            Status select — disabled while another update is
                            in-flight (updatingId !== '') to prevent concurrent
                            changes.  A per-row spinner makes it clear which
                            row is updating.
                          */}
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Change status for ${issue.title}`}
                              className="status-select"
                              disabled={!authenticated || Boolean(updatingId)}
                              onChange={(event) =>
                                handleStatusChange(issue._id, event.target.value)
                              }
                              value={issue.status}
                            >
                              {statusOptions.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                            {updatingId === issue._id && (
                              <LoaderCircle
                                aria-label="Saving…"
                                className="animate-spin text-forest"
                                size={15}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
