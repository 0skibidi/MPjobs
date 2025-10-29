import React, { useState, useEffect } from 'react';
import { useAuth } from '../contex/AuthContext';
import { applicationService } from '../api/services/applicationService';
import { Application } from '../types/models';
import ApplicationStatusBadge from '../components/common/ApplicationStatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UserApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationService.getUserApplications();
        setApplications(response.applications);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Job Applications</h1>
      
      {applications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600">You haven't applied to any jobs yet.</p>
          <button
            onClick={() => window.location.href = '/find-jobs'}
            className="mt-4 bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded transition duration-200"
          >
            Browse Jobs
          </button>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li key={application.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {application.job.title}
                    </h3>
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {application.job.company}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {application.job.location}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>Applied on {formatDate(application.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex space-x-3">
                      <a
                        href={`/jobs/${application.job.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View Job
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserApplications; 