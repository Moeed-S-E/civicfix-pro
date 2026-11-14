import { LoaderCircle } from 'lucide-react';

/**
 * LoadingSpinner
 * Props:
 *   label — text shown next to the spinner (required for accessibility)
 *   className — extra classes on the wrapper (optional)
 */
function LoadingSpinner({ label, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
      {label}
    </span>
  );
}

export default LoadingSpinner;
