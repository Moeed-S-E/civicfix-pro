import { Router } from 'express';
import mongoose from 'mongoose';
import Issue, { ISSUE_CATEGORIES, ISSUE_STATUSES } from '../models/Issue.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();


router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [result] = await Issue.aggregate([
      {
        $facet: {
          // Count every document in the collection
          total: [{ $count: 'count' }],
          // Group by status and sum per group
          statuses: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          // Group by category and sum per group
          categories: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    // Convert the array of { _id, count } objects into a plain lookup object
    const statusCounts = Object.fromEntries(
      (result?.statuses ?? []).map(({ _id, count }) => [_id, count])
    );
    const categoryCounts = Object.fromEntries(
      (result?.categories ?? []).map(({ _id, count }) => [_id, count])
    );

    res.json({
      total: result?.total[0]?.count ?? 0,
      byStatus: {
        pending:    statusCounts.Pending ?? 0,
        inProgress: statusCounts['In Progress'] ?? 0,
        resolved:   statusCounts.Resolved ?? 0
      },
      // Map over the constant array so every category always appears in the
      // response (even with count 0) — avoids undefined on the client chart.
      byCategory: ISSUE_CATEGORIES.map((category) => ({
        category,
        count: categoryCounts[category] ?? 0
      }))
    });
  } catch (error) {
    // Passing error to next() lets Express's global error handler deal with it
    next(error);
  }
});


router.get('/public', async (req, res, next) => {
  try {
    const issues = await Issue.find()
      .sort({ createdAt: -1 })                                    // newest first
      .select('title category location description status createdAt')
      .lean();                                                     // plain objects
    res.json(issues);
  } catch (error) {
    next(error);
  }
});


router.get('/public/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Reject obviously bad IDs early — saves a round-trip to MongoDB
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid issue ID.' });
    }

    const issue = await Issue.findById(id)
      .select('title category location description status createdAt')
      .lean();

    // findById returns null when the document does not exist
    if (!issue) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    res.json(issue);
  } catch (error) {
    next(error);
  }
});


router.get('/', requireAdmin, async (req, res, next) => {
  try {
    // No .select() here — admins see the full document
    const issues = await Issue.find().sort({ createdAt: -1 }).lean();
    res.json(issues);
  } catch (error) {
    next(error);
  }
});


router.post('/', async (req, res, next) => {
  try {
    const { title, category, location, description } = req.body ?? {};
    const values = { title, category, location, description };

    // Validate that every required field is a non-empty string
    for (const [field, value] of Object.entries(values)) {
      if (typeof value !== 'string' || value.trim().length === 0) {
        return res.status(400).json({ message: `${field} is required.` });
      }
    }

    // Validate that the submitted category is one of the allowed values
    if (!ISSUE_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Choose a valid issue category.' });
    }

    // Issue.create() runs schema validators then inserts the document.
    // We trim strings here as a safety net (schema trim: true also covers it).
    const issue = await Issue.create({
      title:       title.trim(),
      category,
      location:    location.trim(),
      description: description.trim()
    });

    // 201 Created is the semantically correct status code for a new resource
    res.status(201).json(issue);
  } catch (error) {
    // mongoose.Error.ValidationError is thrown when schema validators fail
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});


router.patch('/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid issue ID.' });
    }

    if (!ISSUE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Choose a valid issue status.' });
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    res.json(issue);
  } catch (error) {
    next(error);
  }
});

export default router;
