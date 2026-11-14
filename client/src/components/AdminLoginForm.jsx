import { LogIn, UserRound } from 'lucide-react';
import ErrorAlert from './ui/ErrorAlert.jsx';
import LoadingSpinner from './ui/LoadingSpinner.jsx';

function AdminLoginForm({
  actionError,
  authError,
  isSigningIn,
  onActionErrorChange,
  onSubmit,
  password,
  setPassword,
  setUsername,
  username
}) {
  return (
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

      <form className="mt-5" onSubmit={onSubmit} noValidate>
        <label className="field-label" htmlFor="admin-username">Username</label>
        <input
          autoComplete="username"
          className="field-input"
          id="admin-username"
          onChange={(event) => {
            setUsername(event.target.value);
            onActionErrorChange('');
          }}
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
          onChange={(event) => {
            setPassword(event.target.value);
            onActionErrorChange('');
          }}
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
            ? <LoadingSpinner label="Signing in…" />
            : <><LogIn aria-hidden="true" size={17} /> Sign in</>
          }
        </button>
      </form>

      {authError && <ErrorAlert message={authError} />}
      {actionError && <ErrorAlert message={actionError} />}
    </section>
  );
}

export default AdminLoginForm;
