import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import { createIssue, getApiErrorMessage } from '../api/issues.js';

// Field limits must stay in sync with the Mongoose schema (server/models/Issue.js)
const FIELD_LIMITS = {
  title:       120,
  location:    200,
  description: 2000
};

const CATEGORIES = ['Roads', 'Sanitation', 'Lighting', 'Water'];

// initialForm lives outside the component so it is created only once
const initialForm = {
  title:       '',
  category:    '',
  location:    '',
  description: ''
};

/**
 * Props
 *   onCreated — callback fired after a successful submission so the parent
 *               (CommunityPage) can refresh the community feed.
 */
function IssueReportForm({ onCreated }) {
  // --- state ----------------------------------------------------------------
  const [form,         setForm]         = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);

  /**
   * CONCEPT: useEffect for side-effects
   * useEffect runs *after* the render.  The dependency array [success] tells
   * React to re-run this effect only when `success` changes.
   * We use it to auto-dismiss the success banner after 5 seconds so it
   * disappears without the user having to do anything.
   * The cleanup function (the returned arrow function) clears the timer when
   * the component re-renders before the timer fires or when it unmounts —
   * this prevents updating state on an unmounted component.
   */
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 5000);
    return () => clearTimeout(timer);   // cleanup: cancel the timer
  }, [success]);

  // --- helpers --------------------------------------------------------------

  /**
   * CONCEPT: Derived validation
   * Instead of storing a separate `errors` state object we compute validation
   * errors inline in validateForm().  This keeps state minimal — fewer places
   * to keep in sync.
   */
  function validateForm() {
    const { title, category, location, description } = form;

    if (!title.trim()) return 'Please enter a title for the issue.';
    if (title.trim().length > FIELD_LIMITS.title) {
      return `Title must be ${FIELD_LIMITS.title} characters or fewer.`;
    }

    if (!CATEGORIES.includes(category)) return 'Please choose a category.';

    if (!location.trim()) return 'Please enter a location.';
    if (location.trim().length > FIELD_LIMITS.location) {
      return `Location must be ${FIELD_LIMITS.location} characters or fewer.`;
    }

    if (!description.trim()) return 'Please add a description.';
    if (description.trim().length > FIELD_LIMITS.description) {
      return `Description must be ${FIELD_LIMITS.description} characters or fewer.`;
    }

    return '';   // empty string = no errors
  }

  // --- event handlers -------------------------------------------------------

  /**
   * CONCEPT: Generic change handler
   * event.target.name matches the `name` attribute on each input/select.
   * Using a computed property key ({ [name]: value }) lets one function handle
   * all fields instead of writing a separate handler for each one.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    // Spread the current form state and override just the changed field
    setForm((current) => ({ ...current, [name]: value }));
    // Clear any displayed error as soon as the user starts correcting the form
    if (error) setError('');
    if (success) setSuccess(false);
  }

  /**
   * CONCEPT: async form submission
   * event.preventDefault() stops the browser's default form-submit behaviour
   * (page reload / GET request).
   * We set isSubmitting=true to disable the button and show a spinner, then
   * always reset it in the `finally` block — even if createIssue throws —
   * so the UI never gets stuck in a loading state.
   */
  async function handleSubmit(event) {
    event.preventDefault();

    // Client-side validation — fast feedback before the network call
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // POST to /api/issues — network request via our axios helper
      await createIssue({
        title:       form.title.trim(),
        category:    form.category,
        location:    form.location.trim(),
        description: form.description.trim()
      });

      // Reset the form so the user can submit another report
      setForm(initialForm);
      setSuccess(true);

      // Tell the parent to refresh the community feed
      await onCreated();
    } catch (submitError) {
      /**
       * CONCEPT: Network error handling
       * If the backend is unreachable, axios throws an error without a
       * response property.  getApiErrorMessage() checks for that and falls
       * back to the error.message string (e.g. "Network Error") if
       * error.response is undefined.
       */
      setError(
        getApiErrorMessage(
          submitError,
          'Your report could not be submitted. Please try again.'
        )
      );
    } finally {
      // Always re-enable the button, success or failure
      setIsSubmitting(false);
    }
  }

  // --- render ---------------------------------------------------------------

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">MAKE A DIFFERENCE</span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Report an issue</h2>
          <p className="mt-1 text-sm text-ink/55">Share the details. We'll take it from here.</p>
        </div>
        <span className="form-icon"><Send size={20} /></span>
      </div>

      {/* Success banner — auto-dismissed by the useEffect above */}
      {success && (
        <div
          className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" size={18} />
          Your report is in. Thanks for speaking up!
        </div>
      )}

      {/* Error banner */}
      {error && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
        {/* Title */}
        <div>
          <label className="field-label" htmlFor="title">
            What needs fixing?
          </label>
          <input
            aria-describedby="title-counter"
            className="field-input"
            id="title"
            maxLength={FIELD_LIMITS.title}
            name="title"
            onChange={handleChange}
            placeholder="e.g. Pothole near the library"
            required
            type="text"
            value={form.title}
          />
          {/* Live character counter */}
          <p
            className="mt-1 text-right text-xs text-ink/40"
            id="title-counter"
            aria-live="polite"
          >
            {form.title.length}/{FIELD_LIMITS.title}
          </p>
        </div>

        {/* Category + Location row — responsive 2-col on sm and up */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="category">Category</label>
            <select
              className="field-input"
              id="category"
              name="category"
              onChange={handleChange}
              required
              value={form.category}
            >
              <option disabled value="">Choose one</option>
              {CATEGORIES.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="location">Where is it?</label>
            <input
              className="field-input"
              id="location"
              maxLength={FIELD_LIMITS.location}
              name="location"
              onChange={handleChange}
              placeholder="Street, landmark, or area"
              required
              type="text"
              value={form.location}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="field-label" htmlFor="description">
            A few more details
          </label>
          <textarea
            aria-describedby="desc-counter"
            className="field-input min-h-28 resize-y"
            id="description"
            maxLength={FIELD_LIMITS.description}
            name="description"
            onChange={handleChange}
            placeholder="Describe what you noticed and why it needs attention…"
            required
            rows={4}
            value={form.description}
          />
          {/* Live character counter — turns amber when approaching limit */}
          <p
            className={`mt-1 text-right text-xs ${
              form.description.length > FIELD_LIMITS.description * 0.9
                ? 'text-amber-600 font-semibold'
                : 'text-ink/40'
            }`}
            id="desc-counter"
            aria-live="polite"
          >
            {form.description.length}/{FIELD_LIMITS.description}
          </p>
        </div>

        {/*
          Submit button
          disabled during submission to prevent double-submits.
          Shows a spinner icon while pending, normal text otherwise.
        */}
        <button
          className="submit-button"
          disabled={isSubmitting}
          type="submit"
        >
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

export default IssueReportForm;
