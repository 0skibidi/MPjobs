import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Job, JobStatus } from '../types/job';

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    salaryMin: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      console.log('Fetching jobs...');
      const response = await axios.get('/jobs');
      console.log('Jobs response:', response.data);
      
      // Check if data has the expected structure
      if (response.data?.data?.jobs) {
        setJobs(response.data.data.jobs);
      } else {
        console.error('Unexpected API response structure:', response.data);
        setError('Failed to fetch jobs: Unexpected API response');
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(`Failed to fetch jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = async (job: Job) => {
    // Track the click
    try {
      await axios.post(`/jobs/${job._id}/track-click`);
    } catch (err) {
      console.error('Failed to track click:', err);
    }

    // Create mailto link with pre-populated content
    const subject = encodeURIComponent(`Application for ${job.title} at ${job.company.name}`);
    const body = encodeURIComponent(
      `Dear Hiring Manager,\n\n` +
      `I am writing to express my interest in the ${job.title} position at ${job.company.name}.\n\n` +
      `Job Details:\n` +
      `- Position: ${job.title}\n` +
      `- Company: ${job.company.name}\n` +
      `- Location: ${typeof job.location === 'object' ? `${job.location.city}, ${job.location.state}` : job.location}\n` +
      `- Job Type: ${job.jobType.replace(/_/g, ' ')}\n\n` +
      `Please find my resume and cover letter attached to this email.\n\n` +
      `Application Tips:\n` +
      `- Attach your resume (PDF format recommended)\n` +
      `- Include a cover letter highlighting your relevant experience\n` +
      `- Mention specific skills that match the job requirements\n` +
      `- Proofread your email before sending\n` +
      `- Use a professional email signature\n\n` +
      `Best regards,\n` +
      `[Your Name]`
    );
    
    window.location.href = `mailto:${job.applicationEmail}?subject=${subject}&body=${body}`;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filters.type || job.jobType === filters.type;
    const matchesLocation = !filters.location || 
      (job.location && typeof job.location === 'object' ? 
        `${job.location.city}, ${job.location.state}`.toLowerCase().includes(filters.location.toLowerCase()) :
        String(job.location).toLowerCase().includes(filters.location.toLowerCase()));
    const matchesSalary = !filters.salaryMin || 
      (job.salaryRange && job.salaryRange.min >= Number(filters.salaryMin));
    return matchesSearch && matchesType && matchesLocation && matchesSalary;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Search jobs..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              className="px-4 py-2 border border-gray-300 rounded-md"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8">No jobs found</div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.map((job) => {
              // Handle different location formats
              const locationDisplay = typeof job.location === 'object' ? 
                `${job.location.city}, ${job.location.state}` : 
                String(job.location);
              
              // Handle different salary formats
              const minSalary = job.salaryRange ? job.salaryRange.min : 
                (job.salary ? job.salary.min : 0);
              const maxSalary = job.salaryRange ? job.salaryRange.max : 
                (job.salary ? job.salary.max : 0);
              
              // Handle different job type formats
              const jobTypeDisplay = job.jobType ? String(job.jobType).replace(/_/g, ' ') : 
                (job.type ? String(job.type).replace(/_/g, ' ') : 'Unknown');
              
              return (
                <div key={job._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                      <p className="text-gray-600">{job.company.name}</p>
                      <div className="mt-2 space-y-2">
                        <p className="text-gray-600">📍 {locationDisplay}</p>
                        <p className="text-gray-600">💰 ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}</p>
                        <p className="text-gray-600">⏰ {jobTypeDisplay}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyClick(job)}
                      className="px-4 py-2 bg-[#B8A361] text-white rounded-md hover:bg-[#a08c4a] transition-colors"
                      title="Click to send your application via email"
                    >
                      Apply via Email
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-900">Description</h3>
                    <p className="mt-2 text-gray-600">{job.description}</p>
                  </div>
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-900">Requirements</h3>
                      <ul className="mt-2 list-disc list-inside text-gray-600">
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs; 