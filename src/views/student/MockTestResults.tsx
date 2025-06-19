// src/views/student/MockTestResults.tsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MockTestResults: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, margin: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Mock Test Results
        </Typography>
        <Typography variant="body1" paragraph>
          Your mock test results will appear here once they are processed.
          Please check back later or refresh the page.
        </Typography>
        {/* You'll populate this with actual results later */}
        <Button variant="contained" onClick={() => navigate('/student/dashboard')} sx={{ mt: 3 }}>
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default MockTestResults;