import React from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        </div>

        {/* Applied Jobs Section */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="grid gap-6">
              {/* This would be replaced with actual applied jobs */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Software Engineer</h3>
                    <p className="text-sm text-gray-500">Tech Corp Inc.</p>
                    <p className="text-sm text-gray-500">Applied on: Jan 15, 2024</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Under Review
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/application-details/1')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Example of another job application */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Product Manager</h3>
                    <p className="text-sm text-gray-500">Innovation Labs</p>
                    <p className="text-sm text-gray-500">Applied on: Jan 10, 2024</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Interview Scheduled
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/application-details/2')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/job-search')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Find More Jobs
              </button>
              <button
                onClick={() => navigate('/resume-builder')}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm font-medium"
              >
                Update Resume
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard; 