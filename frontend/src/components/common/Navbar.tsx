import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contex/AuthContext';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                className="h-10 w-auto sm:h-12"
                src="/BlackMPLogo.png"
                alt="MP Jobs Logo"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="flex space-x-4">
              {isAuthenticated && user?.role === 'employer' && (
                <>
                  <Link
                    to="/employer/dashboard"
                    className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/post-job"
                    className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Post Jobs
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Admin Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'jobseeker' && (
                <Link
                  to="/jobseeker/applications"
                  className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  My Applications
                </Link>
              )}
              <Link
                to="/jobs"
                className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Browse Jobs
              </Link>
              <Link
                to="/frameworks"
                className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Technologies
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3 ml-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    <span className="mr-1">Welcome, {user?.name}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-md shadow-lg z-50">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-[#B8A361] px-3 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-[#B8A361] hover:bg-[#a08c4a] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#B8A361] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#B8A361] transition-colors duration-200"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} border-t border-gray-200`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
          {isAuthenticated && user?.role === 'employer' && (
            <>
              <Link
                to="/employer/dashboard"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/post-job"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Post Jobs
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === 'jobseeker' && (
            <Link
              to="/jobseeker/applications"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Applications
            </Link>
          )}
          <Link
            to="/jobs"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Browse Jobs
          </Link>
          <Link
            to="/frameworks"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Technologies
          </Link>
          <div className="mt-4 space-y-2">
            {isAuthenticated ? (
              <>
                <span className="block px-3 py-2 text-base font-medium text-gray-700">
                  Welcome, {user?.name}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-base font-medium text-left text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block w-full px-3 py-2 text-base font-medium text-center text-gray-700 hover:text-[#B8A361] hover:bg-gray-50 rounded-md transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="block w-full px-3 py-2 text-base font-medium text-center text-white bg-[#B8A361] hover:bg-[#a08c4a] rounded-md transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 