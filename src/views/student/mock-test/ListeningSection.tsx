// src/views/student/mock-test/ListeningSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, RadioGroup, FormControlLabel, Radio, TextField, Grid, Paper } from '@mui/material';

interface ListeningSectionProps {
  data: any; // Actual audio URLs and questions will come in here
  onAnswersChange: (answers: any) => void;
  isTestActive: boolean;
  onSectionEnd: () => void; // Callback to move to next section if timer isn't handled externally
}

const ListeningSection: React.FC<ListeningSectionProps> = ({ data, onAnswersChange, isTestActive, onSectionEnd }) => {
  const [currentAnswers, setCurrentAnswers] = useState<any>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // TODO: Manage audio playback (start, pause, ensure it plays only once)
  // For a real mock test, you'd likely have a single audio file or segmented audio.
  // The IELTS listening audio plays once.

  useEffect(() => {
    // This is where you might auto-play the audio when the section starts
    // For simplicity, we'll assume a manual play button for now
    if (isTestActive && audioRef.current && !audioPlaying) {
        // You'll need logic to play different audio segments for each part
        // For a true IELTS simulation, the audio controls are minimal or non-existent for the student.
        // The audio simply plays.
        // audioRef.current.play(); // Consider when/how to play audio
        // setAudioPlaying(true);
    }
  }, [isTestActive, audioPlaying]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  useEffect(() => {
    onAnswersChange(currentAnswers);
  }, [currentAnswers, onAnswersChange]);

  if (!data || !data.sections) {
    return <Typography>No listening test data available.</Typography>;
  }

  // Example of a single audio element. In real IELTS, there are typically 4 distinct recordings.
  // You might need to manage which audio file plays for which part.
  const firstAudio = data.sections[0]?.audio;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Listening Test</Typography>
      <Typography variant="body1" paragraph>
        You will hear a recording and answer the questions. The recording will play only once.
      </Typography>

      {/* Basic audio player - you'll need more sophisticated control for actual IELTS simulation */}
      {firstAudio && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Listen to the audio:</Typography>
          <audio ref={audioRef} controls src={`/audios/${firstAudio}`} onPlay={() => setAudioPlaying(true)} onEnded={() => setAudioPlaying(false)} />
          <Typography variant="caption" display="block" mt={1}>
            (In a real test, the audio plays automatically and cannot be paused/rewound by the student)
          </Typography>
        </Paper>
      )}

      {/* Render questions for each section */}
      {data.sections.map((section: any) => (
        <Box key={section.id} sx={{ mb: 4 }}>
          <Typography variant="h6" mt={2} mb={2}>Section {section.id.replace('sec', '')}:</Typography>
          {section.questions.map((q: any) => (
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
              {q.type === 'fill-in-the-blank' && (
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
              {/* Add more question types as needed (matching, short answer etc.) */}
            </Box>
          ))}
        </Box>
      ))}

      {/* The 'Next Section' button is managed by the parent MockTest component's timer */}
    </Box>
  );
};

export default ListeningSection;