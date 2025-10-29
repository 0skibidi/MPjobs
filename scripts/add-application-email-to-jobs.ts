import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Job schema
const JobSchema = new mongoose.Schema({
  title: String,
  company: mongoose.Schema.Types.ObjectId,
  postedBy: mongoose.Schema.Types.ObjectId,
  description: String,
  requirements: [String],
  location: {
    city: String,
    state: String,
    country: String,
    remote: Boolean
  },
  salaryRange: {
    min: Number,
    max: Number,
    currency: String
  },
  jobType: String,
  status: String,
  applicationDeadline: Date,
  applicationEmail: String,
  skills: [String],
  viewsCount: Number,
  applicationClickCount: Number,
  applications: [mongoose.Schema.Types.ObjectId]
}, {
  timestamps: true
});

const Job = mongoose.model('Job', JobSchema);

// Define Company schema to get company emails
const CompanySchema = new mongoose.Schema({
  name: String,
  email: String,
  contactEmail: String
});

const Company = mongoose.model('Company', CompanySchema);

// Define Employer schema to get employer emails
const EmployerSchema = new mongoose.Schema({
  email: String,
  company: mongoose.Schema.Types.ObjectId
});

const Employer = mongoose.model('Employer', EmployerSchema);

async function addApplicationEmailToJobs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fbla_job_board';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all jobs without applicationEmail
    const jobsWithoutEmail = await Job.find({
      $or: [
        { applicationEmail: { $exists: false } },
        { applicationEmail: null },
        { applicationEmail: '' }
      ]
    }).populate('company postedBy');

    console.log(`\nFound ${jobsWithoutEmail.length} jobs without application email`);

    if (jobsWithoutEmail.length === 0) {
      console.log('All jobs already have application emails!');
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;

    for (const job of jobsWithoutEmail) {
      let email = null;

      // Try to get email from company
      if (job.company) {
        const company = await Company.findById(job.company);
        if (company && (company.email || company.contactEmail)) {
          email = company.email || company.contactEmail;
        }
      }

      // If no company email, try to get from employer who posted
      if (!email && job.postedBy) {
        const employer = await Employer.findById(job.postedBy);
        if (employer && employer.email) {
          email = employer.email;
        }
      }

      // If still no email, use a default placeholder
      if (!email) {
        email = 'hr@company.com'; // Placeholder - employers should update this
        console.log(`⚠️  Job "${job.title}" has no associated email, using placeholder`);
      }

      // Update the job
      await Job.findByIdAndUpdate(job._id, {
        applicationEmail: email,
        applicationClickCount: 0 // Initialize click count
      });

      console.log(`✓ Updated "${job.title}" with email: ${email}`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} jobs`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} jobs (could not determine email)`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating jobs:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
addApplicationEmailToJobs();

