import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Leaf, MapPin, ShieldCheck } from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom';
import {
  fetchAdminSession,
  fetchPublicIssue,
  fetchPublicIssues,
  getApiErrorMessage
} from './api/issues.js';
import IssueReportForm from './components/IssueReportForm.jsx';

const AdminDashboard = lazy(() => import('./components/AdminDashboard.jsx'));

function CommunityPage() {
  const [issues,    setIssues]    = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadIssues = useCallback(async () => {
    setLoadError('');
    try {
      setIssues(await fetchPublicIssues());
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Could not load reports.'));
    } finally {
      // isLoading → false whether the request succeeded or failed
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
    const refreshInterval = window.setInterval(loadIssues, 30_000);
    return () => window.clearInterval(refreshInterval);   // cleanup on unmount
  }, [loadIssues]);

  return (
    <>
      {/* Hero section — responsive grid that stacks on mobile, side-by-side on lg */}
      <section className="hero-pattern">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <span className="eyebrow"><MapPin size={14} /> COMMUNITY-POWERED CHANGE</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Stronger streets <span className="text-forest">start here.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink/65">
              Spot something that needs fixing? Let your local team know.
              Every report brings us one step closer to a better neighborhood.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-ink/65">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={17} className="text-forest" /> Reports go to your local team
              </span>
              <span className="inline-flex items-center gap-2">
                <ArrowUpRight size={17} className="text-forest" /> Track community reports
              </span>
            </div>
          </div>
          {/* onCreated is a callback: the form calls it after a successful submit */}
          <IssueReportForm onCreated={loadIssues} />
        </div>
      </section>

      {/* Community feed */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">COMMUNITY PULSE</span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Recent reports</h2>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/60 shadow-sm">
            {issues.length} {issues.length === 1 ? 'report' : 'reports'} in the community
          </span>
        </div>

        {/* Error banner with retry */}
        {loadError && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <span>{loadError}</span>
            <button className="font-bold underline" onClick={loadIssues} type="button">
              Try again
            </button>
          </div>
        )}

        {/* Loading / empty / populated states */}
        {isLoading ? (
          <div className="rounded-2xl border border-ink/5 bg-white px-6 py-12 text-center text-ink/55">
            Loading community reports…
          </div>
        ) : issues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/20 bg-white/70 px-6 py-12 text-center">
            <p className="font-bold">No reports yet</p>
            <p className="mt-1 text-sm text-ink/55">Be the first to let your community know what needs attention.</p>
          </div>
        ) : (
          /* Responsive issue grid: 1 col → 2 col → 3 col */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {issues.map((issue) => (
              <Link
                aria-label={`View report: ${issue.title}`}
                className="issue-card block transition-colors hover:border-forest/30 focus-visible:outline-forest"
                key={issue._id}
                to={`/reports/${issue._id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="category-label">{issue.category}</span>
                  <span className={`status-badge ${{
                    Pending:     'status-pending',
                    'In Progress': 'status-progress',
                    Resolved:    'status-resolved'
                  }[issue.status] ?? 'status-pending'}`}>
                    {issue.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{issue.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/60">{issue.description}</p>
                <div className="mt-4 flex min-w-0 items-center gap-1.5 text-sm text-ink/55">
                  <MapPin aria-hidden="true" className="shrink-0" size={15} />
                  <span className="truncate">{issue.location}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-4 text-xs font-medium">
                  <time className="text-ink/50" dateTime={issue.createdAt}>
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(issue.createdAt))}
                  </time>
                  <span className="font-bold text-forest">View status <ArrowUpRight aria-hidden="true" size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-3 text-sm font-bold transition hover:border-forest hover:text-forest"
            to="/admin"
          >
            Admin dashboard <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// PublicReportDetail — single report page at "/reports/:issueId"
// ---------------------------------------------------------------------------
/**
 * CONCEPT: useParams
 * Extracts named URL segments defined in <Route path="/reports/:issueId">.
 * issueId becomes the string after /reports/ in the current URL.
 */
function PublicReportDetail() {
  const { issueId } = useParams();
  const [issue,     setIssue]     = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  /**
   * CONCEPT: useEffect cleanup with active flag
   * If the user navigates away before the fetch resolves, the component
   * unmounts.  Setting `active = false` in the cleanup prevents the `.then()`
   * callback from calling setIssue/setError on an unmounted component, which
   * would produce a React warning.
   * This is a lightweight alternative to AbortController for simple cases.
   */
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');

    fetchPublicIssue(issueId)
      .then((report) => {
        if (active) setIssue(report);
      })
      .catch((fetchError) => {
        if (active) setError(getApiErrorMessage(fetchError, 'Could not load this report.'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };   // cleanup: ignore stale responses
  }, [issueId]);   // re-fetch if the URL param changes

  const statusClass = {
    Pending:       'status-pending',
    'In Progress': 'status-progress',
    Resolved:      'status-resolved'
  }[issue?.status] ?? 'status-pending';

  return (
    <section className="mx-auto min-h-[75vh] max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-forest hover:underline" to="/">
        <ArrowLeft size={16} /> Back to community
      </Link>

      {isLoading ? (
        <div className="dashboard-panel mt-6 py-12 text-center text-ink/55">Loading report…</div>
      ) : error ? (
        <div className="dashboard-panel mt-6" role="alert">
          <h1 className="text-xl font-extrabold">Report unavailable</h1>
          <p className="mt-2 text-sm text-ink/60">{error}</p>
        </div>
      ) : issue && (
        <article className="dashboard-panel mt-6">
          <span className="eyebrow">COMMUNITY REPORT</span>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{issue.title}</h1>
            <span className="category-label">{issue.category}</span>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-canvas p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Current status</p>
              <span className={`status-badge mt-2 ${statusClass}`}>{issue.status}</span>
            </div>
            <div className="text-sm text-ink/60">
              <p className="font-semibold">Report received</p>
              <time dateTime={issue.createdAt}>
                {new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(issue.createdAt))}
              </time>
            </div>
          </div>

          <div className="mt-6 border-t border-ink/5 pt-5">
            <h2 className="font-bold">Location</h2>
            <p className="mt-2 inline-flex items-start gap-2 text-sm leading-6 text-ink/60">
              <MapPin aria-hidden="true" className="mt-1 shrink-0" size={16} /> {issue.location}
            </p>
            <h2 className="mt-6 font-bold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/60">{issue.description}</p>
          </div>

          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-forest hover:underline" to="/">
            <ArrowLeft size={15} /> Back to community reports
          </Link>
        </article>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// App — root component, top-level auth state + route tree
// ---------------------------------------------------------------------------
function App() {
  /**
   * CONCEPT: Top-level shared state
   * These three pieces of state are owned here and passed down as props because
   * AdminDashboard needs to read and change them, and App needs to know the
   * auth status to decide what to render in the header.
   *
   * isAdminAuthenticated — true when a valid session cookie exists
   * isCheckingAdminSession — true while the session check API call is in flight
   * adminSessionError — error message if the session check itself fails
   */
  const [isAdminAuthenticated,  setIsAdminAuthenticated]  = useState(false);
  const [isCheckingAdminSession, setIsCheckingAdminSession] = useState(true);
  const [adminSessionError,      setAdminSessionError]      = useState('');

  /**
   * CONCEPT: Session persistence
   * On every page load (or hard refresh) we call GET /api/auth/session.
   * The browser automatically sends the HttpOnly cookie with that request.
   * If the server validates it, we mark the user as authenticated so they
   * don't have to sign in again after a refresh.
   * A 401 response is expected when there is no active session — it is not
   * an error worth displaying to the user.
   */
  useEffect(() => {
    let active = true;

    fetchAdminSession()
      .then(() => {
        if (active) {
          setIsAdminAuthenticated(true);
          setAdminSessionError('');
        }
      })
      .catch((error) => {
        if (!active) return;
        setIsAdminAuthenticated(false);
        // 401 just means "not logged in" — that's normal, not an error
        if (error.response?.status !== 401) {
          setAdminSessionError(getApiErrorMessage(error, 'Could not check the admin session.'));
        }
      })
      .finally(() => {
        if (active) setIsCheckingAdminSession(false);
      });

    return () => { active = false; };
  }, []);   // empty array → run once on mount

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Global navigation */}
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 sm:flex-nowrap sm:px-8">
          {/* Brand */}
          <Link className="flex items-center gap-3" to="/">
            <span className="brand-mark"><Leaf size={21} strokeWidth={2.2} /></span>
            <span className="text-lg font-extrabold tracking-tight">
              CivicFix<span className="text-forest"> Pro</span>
            </span>
          </Link>

          {/* NavLink applies the nav-tab-active class when its path is active */}
          <nav
            aria-label="Main navigation"
            className="order-3 flex w-full items-center justify-center gap-1 rounded-full bg-canvas p-1 sm:order-none sm:w-auto"
          >
            <NavLink
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
              end
              to="/"
            >
              Community
            </NavLink>
            <NavLink
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
              to="/admin"
            >
              Admin
            </NavLink>
          </nav>

          <span className="hidden items-center gap-2 text-sm font-medium text-forest sm:flex">
            <span className="h-2 w-2 rounded-full bg-lime" />
            Your neighborhood, better
          </span>
        </div>
      </header>

      {/* Route tree */}
      <main>
        <Routes>
          <Route element={<CommunityPage />} path="/" />
          <Route element={<PublicReportDetail />} path="/reports/:issueId" />
          <Route
            element={
              /*
               * Suspense shows its fallback while the AdminDashboard bundle
               * is being downloaded (lazy import above).
               */
              <Suspense fallback={
                <div className="mx-auto max-w-7xl px-5 py-16 text-center text-ink/55 sm:px-8">
                  Loading analytics dashboard…
                </div>
              }>
                <AdminDashboard
                  authenticated={isAdminAuthenticated}
                  authError={adminSessionError}
                  authLoading={isCheckingAdminSession}
                  onAuthChange={setIsAdminAuthenticated}
                  onAuthErrorChange={setAdminSessionError}
                />
              </Suspense>
            }
            path="/admin"
          />
          {/* Catch-all: redirect unknown paths to home */}
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </main>

      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-ink/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-bold text-ink/70">
            CivicFix Pro <span className="font-normal">· Better neighborhoods, together.</span>
          </span>
          <span>Small reports. Real community impact.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
