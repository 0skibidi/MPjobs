import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios'; // Use the configured axios instance
import { useAuth } from '../contex/AuthContext';
import { JobStatus } from '../types/enums'; // Import JobStatus enum

interface Job {
  _id: string;
  title: string;
  company: {
    _id: string;
    name: string;
    logo?: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
    remote: boolean;
  };
  jobType: string;
  salaryMin: number;
  salaryMax: number;
  description: string;
  requirements: string[];
  skills: string[];
  createdAt: string;
  viewsCount: number;
  status: string;
}

const FindJobs: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Initialize by fetching jobs
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const params: any = {
        status: JobStatus.APPROVED // Only fetch approved jobs
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      console.log('Fetching jobs with params:', params);
      
      // Use the correct endpoint '/jobs' instead of '/api/jobs'
      const response = await axios.get('/jobs', { params });
      
      console.log('API response:', response.data);
      
      if (response.data?.data?.jobs) {
        setJobs(response.data.data.jobs);
      } else {
        setError('Unexpected API response format');
      }
      
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const formatSalary = (job: any) => {
    // Check both possible structures for salary data
    if (job.salaryRange) {
      const { min, max, currency = 'USD' } = job.salaryRange;
      if (min && max) {
        return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
      }
    }
    
    // Try direct salaryMin and salaryMax properties
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    
    return 'Salary not specified';
  };

  const formatJobType = (type: string) => {
    if (!type) return 'Not specified';
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatLocation = (location: any): string => {
    if (!location) return 'Unknown Location';
    
    const { city, state, country, remote } = location;
    let locationStr = city || '';
    if (state) locationStr += locationStr ? `, ${state}` : state;
    if (country && country !== 'USA') locationStr += locationStr ? `, ${country}` : country;
    if (remote) locationStr += ' (Remote)';
    
    return locationStr || 'Unknown Location';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Jobs</h1>
          
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search jobs by title, description, or skills"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B8A361]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              className="px-6 py-2 bg-[#B8A361] text-white rounded-md hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-[#B8A361] focus:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8A361]"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-medium text-gray-700 mb-2">No jobs found</h2>
            <p className="text-gray-500">
              {searchTerm ? 
                'Try adjusting your search criteria' : 
                'There are currently no approved job listings available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                    <div className="mt-2 md:mt-0 text-sm text-gray-500">
                      Posted on {formatDate(job.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatJobType(job.jobType)}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {formatSalary(job)}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formatLocation(job.location)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Company</h3>
                    <p className="text-gray-900">{job.company?.name || 'Unknown Company'}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                    <p className="text-gray-600 line-clamp-3">{job.description}</p>
                  </div>
                  
                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <span>{job.viewsCount || 0} views</span>
                    </div>
                    
                    <div className="flex">
                      {isAuthenticated && (
                        <Link
                          to={`/jobs/${job._id}/apply`}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#B8A361] hover:bg-[#a08c4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B8A361]"
                        >
                          Apply Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindJobs; 