/**
 * ErrorAlert
 * Props:
 *   message  — string to display
 *   onRetry  — optional callback; renders a "Try again" button when provided
 */
function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <span>{message}</span>
      {onRetry && (
        <button className="font-bold underline" onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
