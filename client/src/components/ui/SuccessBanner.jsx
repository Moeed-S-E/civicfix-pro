import { CheckCircle2 } from 'lucide-react';

/**
 * SuccessBanner
 * Props:
 *   message — string to display
 */
function SuccessBanner({ message }) {
  if (!message) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
      role="status"
    >
      <CheckCircle2 aria-hidden="true" size={17} />
      {message}
    </div>
  );
}

export default SuccessBanner;
