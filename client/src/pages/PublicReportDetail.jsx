import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicIssue, getApiErrorMessage } from '../api/issues.js';

function PublicReportDetail() {
  const { issueId } = useParams();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

    return () => { active = false; };
  }, [issueId]);

  const statusClass = {
    Pending: 'status-pending',
    'In Progress': 'status-progress',
    Resolved: 'status-resolved'
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

export default PublicReportDetail;
