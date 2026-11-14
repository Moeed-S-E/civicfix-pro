import { ArrowRight, LoaderCircle, Send } from 'lucide-react';
import ErrorAlert from './ui/ErrorAlert.jsx';
import SuccessBanner from './ui/SuccessBanner.jsx';

function IssueReportFormView({
  categories,
  error,
  fieldLimits,
  form,
  isSubmitting,
  onChange,
  onSubmit,
  success
}) {
  return (
    <div className="form-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">MAKE A DIFFERENCE</span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Report an issue</h2>
          <p className="mt-1 text-sm text-ink/55">Share the details. We'll take it from here.</p>
        </div>
        <span className="form-icon"><Send size={20} /></span>
      </div>

      {success && (
        <div className="mt-5">
          <SuccessBanner message="Your report is in. Thanks for speaking up!" />
        </div>
      )}

      {error && (
        <div className="mt-5">
          <ErrorAlert message={error} />
        </div>
      )}

      <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
        <div>
          <label className="field-label" htmlFor="title">What needs fixing?</label>
          <input
            aria-describedby="title-counter"
            className="field-input"
            id="title"
            maxLength={fieldLimits.title}
            name="title"
            onChange={onChange}
            placeholder="e.g. Pothole near the library"
            required
            type="text"
            value={form.title}
          />
          <p className="mt-1 text-right text-xs text-ink/40" id="title-counter" aria-live="polite">
            {form.title.length}/{fieldLimits.title}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="category">Category</label>
            <select
              className="field-input"
              id="category"
              name="category"
              onChange={onChange}
              required
              value={form.category}
            >
              <option disabled value="">Choose one</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="location">Where is it?</label>
            <input
              className="field-input"
              id="location"
              maxLength={fieldLimits.location}
              name="location"
              onChange={onChange}
              placeholder="Street, landmark, or area"
              required
              type="text"
              value={form.location}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="description">A few more details</label>
          <textarea
            aria-describedby="desc-counter"
            className="field-input min-h-28 resize-y"
            id="description"
            maxLength={fieldLimits.description}
            name="description"
            onChange={onChange}
            placeholder="Describe what you noticed and why it needs attention…"
            required
            rows={4}
            value={form.description}
          />
          <p
            aria-live="polite"
            className={`mt-1 text-right text-xs ${
              form.description.length > fieldLimits.description * 0.9
                ? 'text-amber-600 font-semibold'
                : 'text-ink/40'
            }`}
            id="desc-counter"
          >
            {form.description.length}/{fieldLimits.description}
          </p>
        </div>

        <button className="submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> Sending…</>
            : <><ArrowRight aria-hidden="true" size={18} /> Send report</>
          }
        </button>

        <p className="text-center text-xs text-ink/45">
          Please don't include personal or sensitive information.
        </p>
      </form>
    </div>
  );
}

export default IssueReportFormView;
