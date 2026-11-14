import { ClipboardList, MapPin } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner.jsx';

const statusOptions = ['Pending', 'In Progress', 'Resolved'];

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
}

function IssueModerationTable({ authenticated, issues, onStatusChange, updatingId }) {
  return (
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
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Change status for ${issue.title}`}
                        className="status-select"
                        disabled={!authenticated || Boolean(updatingId)}
                        onChange={(event) => onStatusChange(issue._id, event.target.value)}
                        value={issue.status}
                      >
                        {statusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                      {updatingId === issue._id && (
                        <LoadingSpinner label="" className="text-forest" />
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
  );
}

export default IssueModerationTable;
