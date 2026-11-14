import mongoose from 'mongoose';

export const ISSUE_CATEGORIES = ['Roads', 'Sanitation', 'Lighting', 'Water'];
export const ISSUE_STATUSES   = ['Pending', 'In Progress', 'Resolved'];

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,   // must be provided
    trim: true,       // strip whitespace on both ends
    maxlength: 120    // hard upper bound
  },
  category: {
    type: String,
    required: true,
    // enum restricts accepted values to our exported constant array
    enum: ISSUE_CATEGORIES
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ISSUE_STATUSES,
    default: 'Pending'  // new reports start as Pending
  },
  createdAt: {
    type: Date,
    default: Date.now   // set once at insertion time
  }
});

issueSchema.index({ createdAt: -1 });
issueSchema.index({ category: 1 });
issueSchema.index({ status: 1 });

// mongoose.model() compiles the schema and maps it to the "issues" collection
// (Mongoose automatically lowercases + pluralises the model name).
export default mongoose.model('Issue', issueSchema);
