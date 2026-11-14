import { useEffect, useState } from 'react';
import { createIssue, getApiErrorMessage } from '../api/issues.js';
import IssueReportFormView from './IssueReportFormView.jsx';

// Field limits must stay in sync with the Mongoose schema (server/models/Issue.js)
const FIELD_LIMITS = {
  title:       120,
  location:    200,
  description: 2000
};

const CATEGORIES = ['Roads', 'Sanitation', 'Lighting', 'Water'];

const initialForm = {
  title:       '',
  category:    '',
  location:    '',
  description: ''
};

function IssueReportForm({ onCreated }) {
  const [form,         setForm]         = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  function validateForm() {
    const { title, category, location, description } = form;
    if (!title.trim()) return 'Please enter a title for the issue.';
    if (title.trim().length > FIELD_LIMITS.title) return `Title must be ${FIELD_LIMITS.title} characters or fewer.`;
    if (!CATEGORIES.includes(category)) return 'Please choose a category.';
    if (!location.trim()) return 'Please enter a location.';
    if (location.trim().length > FIELD_LIMITS.location) return `Location must be ${FIELD_LIMITS.location} characters or fewer.`;
    if (!description.trim()) return 'Please add a description.';
    if (description.trim().length > FIELD_LIMITS.description) return `Description must be ${FIELD_LIMITS.description} characters or fewer.`;
    return '';
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError('');
    if (success) setSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await createIssue({
        title:       form.title.trim(),
        category:    form.category,
        location:    form.location.trim(),
        description: form.description.trim()
      });
      setForm(initialForm);
      setSuccess(true);
      await onCreated();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Your report could not be submitted. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <IssueReportFormView
      categories={CATEGORIES}
      error={error}
      fieldLimits={FIELD_LIMITS}
      form={form}
      isSubmitting={isSubmitting}
      onChange={handleChange}
      onSubmit={handleSubmit}
      success={success}
    />
  );
}

export default IssueReportForm;
