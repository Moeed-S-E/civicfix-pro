import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchPublicIssues, getApiErrorMessage } from '../api/issues.js';
import IssueReportForm from '../components/IssueReportForm.jsx';

function CommunityPage() {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadIssues = useCallback(async () => {
    setLoadError('');
    try {
      setIssues(await fetchPublicIssues());
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Could not load reports.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
    const refreshInterval = window.setInterval(loadIssues, 30_000);
    return () => window.clearInterval(refreshInterval);
  }, [loadIssues]);

  return (
    <>
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
          <IssueReportForm onCreated={loadIssues} />
        </div>
      </section>

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
                    Pending: 'status-pending',
                    'In Progress': 'status-progress',
                    Resolved: 'status-resolved'
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

export default CommunityPage;
