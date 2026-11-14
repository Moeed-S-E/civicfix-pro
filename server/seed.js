import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import Issue from './models/Issue.js';
import { hashAdminPassword } from './security/adminPassword.js';

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const reports = [
  {
    title: 'Large pothole on Cedar Avenue',
    category: 'Roads',
    location: 'Cedar Avenue near 4th Street',
    description: 'A deep pothole is causing drivers to swerve into the next lane. Please inspect and repair the damaged pavement.',
    status: 'Pending',
    createdAt: daysAgo(1)
  },
  {
    title: 'Overflowing bins at Maple Park',
    category: 'Sanitation',
    location: 'Maple Park, north entrance',
    description: 'Public bins have been full for several days and litter is spreading across the walkway.',
    status: 'In Progress',
    createdAt: daysAgo(2)
  },
  {
    title: 'Streetlight out on River Road',
    category: 'Lighting',
    location: 'River Road outside the community library',
    description: 'The streetlight has stopped working, leaving the pedestrian crossing difficult to see after dark.',
    status: 'Pending',
    createdAt: daysAgo(3)
  },
  {
    title: 'Water leak near bus stop',
    category: 'Water',
    location: 'Oak Street bus stop, eastbound',
    description: 'Clean water has been running from a small leak in the pavement since yesterday.',
    status: 'Resolved',
    createdAt: daysAgo(5)
  },
  {
    title: 'Broken pavement on school route',
    category: 'Roads',
    location: 'Willow Lane outside Northside Primary',
    description: 'Several uneven paving slabs are creating a trip hazard for children and people using wheelchairs.',
    status: 'In Progress',
    createdAt: daysAgo(7)
  },
  {
    title: 'Missed waste collection',
    category: 'Sanitation',
    location: 'Pine Court, building entrance',
    description: 'The scheduled collection was missed and bags are accumulating beside the shared bins.',
    status: 'Pending',
    createdAt: daysAgo(9)
  },
  {
    title: 'Flickering lights on pedestrian path',
    category: 'Lighting',
    location: 'Canal Walk between Bridge Street and Mill Road',
    description: 'Two path lights are flickering intermittently, making the route hard to use at night.',
    status: 'Resolved',
    createdAt: daysAgo(12)
  },
  {
    title: 'Low water pressure on Birch Street',
    category: 'Water',
    location: 'Birch Street, block 20',
    description: 'Residents have reported unusually low water pressure throughout the morning.',
    status: 'In Progress',
    createdAt: daysAgo(14)
  }
];

async function seedReports() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI must be set in the environment.');
  }

  await mongoose.connect(mongoUri);
  try {
    let seededAdmin = false;
    if (!await Admin.exists({ username: 'admin' })) {
      const passwordHash = await hashAdminPassword('admin');
      try {
        await Admin.create({
          username: 'admin',
          passwordHash,
          passwordPeppered: true
        });
        seededAdmin = true;
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }

    const result = await Issue.bulkWrite(
      reports.map((report) => ({
        updateOne: {
          filter: {
            title: report.title,
            category: report.category,
            location: report.location,
            description: report.description
          },
          update: { $setOnInsert: report },
          upsert: true
        }
      }))
    );
    console.log(`Seeded ${result.upsertedCount} reports; ${reports.length - result.upsertedCount} were already present.`);
    console.log(seededAdmin ? 'Created demo admin account "admin".' : 'Demo admin account already exists; left unchanged.');
  } finally {
    await mongoose.disconnect();
  }
}

seedReports().catch((error) => {
  console.error('Failed to seed reports:', error);
  process.exitCode = 1;
});
