import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import PostJob from './pages/PostJob';
import FindJobs from './pages/FindJobs';
import JobApply from './pages/JobApply';
import AdminJobApproval from './pages/AdminJobApproval';
import EmployerApplications from './pages/EmployerApplications';
import UserApplications from './pages/UserApplications';
import JobApplications from './pages/JobApplications';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Frameworks from './pages/Frameworks';
import { AuthProvider } from './contex/AuthContext';
import { useAuth } from './contex/AuthContext';
import TestConnection from './TestConnection';

// Protected Route wrapper component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
    return <Navigate to="/login" />;
   }

   if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
     return <Navigate to="/" />;
  }

     return <>{children}</>;
};

   function App() {
     return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white flex flex-col">
          <Navbar />
            <Routes>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/find-jobs" element={<FindJobs />} />
            <Route path="/jobs" element={<FindJobs />} />
            <Route path="/frameworks" element={<Frameworks />} />
            
            {/* Employer Routes */}
            <Route 
               path="/post-job" 
              element={<PostJob />}  
            />
             <Route 
              path="/employer/dashboard" 
              element={
                 <ProtectedRoute allowedRoles={['employer']}>
                  <EmployerDashboard />
                 </ProtectedRoute>
               } 
             />
             <Route 
              path="/employer/jobs/:id/applications" 
              element={
                <ProtectedRoute allowedRoles={['employer']}>
                <EmployerApplications />
                </ProtectedRoute>
              } 
             />
              <Route 
              path="/jobs/:id/applications" 
              element={
                <ProtectedRoute allowedRoles={['employer']}>
                  <JobApplications />
                </ProtectedRoute>
              } 
            />
            
            {/* Job Seeker Routes */}
            <Route 
              path="/jobseeker/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['jobseeker']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/jobs/:id/apply" 
          element={
                <ProtectedRoute allowedRoles={['jobseeker']}>
                  <JobApply />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/jobseeker/applications" 
              element={
                <ProtectedRoute allowedRoles={['jobseeker']}>
                  <UserApplications />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
               <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/jobs" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminJobApproval />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/test-connection" element={<TestConnection />} />
            
            <Route path="/" element={
              <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                    {/* Left side content */}
                    <div className="w-full md:w-1/2 space-y-6">
                      <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                        Easy, seem-less job posting made{' '}
                        <span className="text-[#B8A361]">paw</span>sible!
                      </h1>
                      <p className="text-gray-600 text-lg sm:text-xl max-w-lg">
                        Has finding a job always been a struggle for you? With MP Jobs,
                        we make finding a job effortless for you. Search your desired job
                        down below in the search bar and apply for a job today!
                      </p>
                      
                      {/* Search Bar */}
                      <div className="relative max-w-xl w-full">
                        <input
                          type="text"
                          placeholder="Job title or keyword"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#B8A361] focus:border-transparent shadow-sm text-base"
                        />
                        <Link
                          to="/find-jobs"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#B8A361] text-white px-4 sm:px-6 py-2 rounded-md hover:bg-[#a08c4a] transition-colors duration-200 text-sm sm:text-base whitespace-nowrap"
                        >
                          Search Jobs
                        </Link>
                      </div>

                      <p className="text-gray-600 text-base sm:text-lg">
                        Has posting jobs been a struggle? Use our job employment for
                        quick job postings, just sign up and prepare to post your first job
                        in minutes!
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <Link 
                        to="/login"
                         className="w-full sm:w-auto flex justify-center bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200 text-base font-medium"
                        >
                          Log in
                        </Link>
                        <Link 
                        to="/signup"
                        className="w-full sm:w-auto flex justify-center bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200 text-base font-medium"
                        >
                          Create Account
                        </Link>
                      </div>
                    </div>

                    {/* Right side image - hidden on mobile */}
                    <div className="hidden md:block w-full md:w-1/2">
                      <div className="relative">
                        <div className="absolute -top-20 -right-20 -bottom-20 -left-20 bg-[#FAF7EF] rounded-tl-[35%] rounded-br-[35%] -z-10"></div>
                        <img
                          src="mpwoman.jpg"
                          alt="Person using laptop"
                      className="relative z-10 w-full max-w-md mx-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 