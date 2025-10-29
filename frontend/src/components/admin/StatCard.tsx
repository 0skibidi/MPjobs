import React from 'react';
import { Paper, Box, Typography, Icon } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color
}) => {
  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%'
      }}
    >
      <Box
        sx={{
          backgroundColor: `${color}15`,
          borderRadius: '50%',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon sx={{ color }}>{icon}</Icon>
      </Box>
      <Box>
        <Typography variant="h4" component="div">
          {value.toLocaleString()}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}; 