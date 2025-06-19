// src/views/student/mock-test/ReadingSection.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Checkbox, FormControlLabel, RadioGroup, Radio, Paper } from '@mui/material';

interface ReadingSectionProps {
  data: any; // Reading passages and questions
  onAnswersChange: (answers: any) => void;
  isTestActive: boolean;
  onSectionEnd: () => void;
}

const ReadingSection: React.FC<ReadingSectionProps> = ({ data, onAnswersChange, isTestActive, onSectionEnd }) => {
  const [currentAnswers, setCurrentAnswers] = useState<any>({});

  const handleAnswerChange = (questionId: string, value: string | boolean) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  useEffect(() => {
    onAnswersChange(currentAnswers);
  }, [currentAnswers, onAnswersChange]);

  if (!data || !data.passages) {
    return <Typography>No reading test data available.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Reading Test</Typography>
      <Typography variant="body1" paragraph>
        Read the passages carefully and answer the questions that follow.
      </Typography>

      {data.passages.map((passage: any) => (
        <Box key={passage.id} sx={{ mb: 4 }}>
          <Typography variant="h6" mt={2} mb={1}>Passage {passage.id.replace('rp', '')}: {passage.title}</Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 3, maxHeight: '400px', overflowY: 'auto' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{passage.content}</Typography>
          </Paper>

          {passage.questions.map((q: any) => (
            <Box key={q.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" component="label" htmlFor={q.id}>{q.text}</Typography>
              {q.type === 'multiple-choice' && (
                <RadioGroup
                  name={q.id}
                  value={currentAnswers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  {q.options.map((option: string) => (
                    <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
                  ))}
                </RadioGroup>
              )}
              {q.type === 'true-false' && (
                <RadioGroup
                  name={q.id}
                  value={currentAnswers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  <FormControlLabel value="True" control={<Radio />} label="True" />
                  <FormControlLabel value="False" control={<Radio />} label="False" />
                  <FormControlLabel value="Not Given" control={<Radio />} label="Not Given" />
                </RadioGroup>
              )}
              {q.type === 'short-answer' && (
                <TextField
                  fullWidth
                  id={q.id}
                  variant="outlined"
                  size="small"
                  value={currentAnswers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  sx={{ mt: 1 }}
                />
              )}
              {/* Add more reading question types */}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default ReadingSection;