import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { format } from 'date-fns';
import { Job } from '../../types/job';
import { JobStatus } from '../../types/enums';
import { updateJobStatus } from '../../store/slices/adminSlice';

interface RecentJobsTableProps {
  jobs: Job[];
}

export const RecentJobsTable: React.FC<RecentJobsTableProps> = ({ jobs }) => {
  const dispatch = useDispatch();

  const handleStatusUpdate = (jobId: string, status: JobStatus) => {
    dispatch(updateJobStatus({ jobId, status }));
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.APPROVED:
        return 'success';
      case JobStatus.REJECTED:
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Company</TableCell>
            <TableCell>Posted Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Applications</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.title}</TableCell>
              <TableCell>{job.company.name}</TableCell>
              <TableCell>
                {format(new Date(job.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Chip
                  label={job.status}
                  color={getStatusColor(job.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{job.applications.length}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton size="small">
                    <Visibility />
                  </IconButton>
                </Tooltip>
                {job.status === JobStatus.PENDING && (
                  <>
                    <Button
                      size="small"
                      color="success"
                      onClick={() => handleStatusUpdate(job.id, JobStatus.APPROVED)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleStatusUpdate(job.id, JobStatus.REJECTED)}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 