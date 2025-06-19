// src/views/student/mock-test/WritingSection.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Paper } from '@mui/material';

interface WritingSectionProps {
  data: any; // Writing tasks (prompts)
  onAnswersChange: (answers: any) => void;
  isTestActive: boolean;
  onSectionEnd: () => void;
}

const WritingSection: React.FC<WritingSectionProps> = ({ data, onAnswersChange, isTestActive, onSectionEnd }) => {
  const [task1Answer, setTask1Answer] = useState<string>('');
  const [task2Answer, setTask2Answer] = useState<string>('');

  useEffect(() => {
    onAnswersChange({
      task1: task1Answer,
      task2: task2Answer,
    });
  }, [task1Answer, task2Answer, onAnswersChange]);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  if (!data || !data.task1 || !data.task2) {
    return <Typography>No writing test data available.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Writing Test</Typography>
      <Typography variant="body1" paragraph>
        You have 60 minutes for both tasks. Task 2 contributes twice as much as Task 1 to the Writing score.
      </Typography>

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Task 1 (Recommended 20 minutes)</Typography>
        <Typography variant="body2" paragraph>
          **Prompt:** {data.task1.prompt}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          Write at least 150 words.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={task1Answer}
          onChange={(e) => setTask1Answer(e.target.value)}
          placeholder="Start writing your Task 1 response here..."
        />
        <Typography variant="caption" sx={{ mt: 1 }}>
          Word count: {countWords(task1Answer)}
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Task 2 (Recommended 40 minutes)</Typography>
        <Typography variant="body2" paragraph>
          **Prompt:** {data.task2.prompt}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          Write at least 250 words.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={15}
          variant="outlined"
          value={task2Answer}
          onChange={(e) => setTask2Answer(e.target.value)}
          placeholder="Start writing your Task 2 response here..."
        />
        <Typography variant="caption" sx={{ mt: 1 }}>
          Word count: {countWords(task2Answer)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default WritingSection;