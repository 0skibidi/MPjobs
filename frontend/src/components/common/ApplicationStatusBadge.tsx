import React from 'react';

type StatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface ApplicationStatusBadgeProps {
  status: StatusType;
  className?: string;
}

const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({ 
  status,
  className = ''
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'ACCEPTED':
        return 'Accepted';
      case 'REJECTED':
        return 'Not Selected';
      default:
        return status;
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()} ${className}`}>
      {getStatusText()}
    </span>
  );
};

export default ApplicationStatusBadge; 