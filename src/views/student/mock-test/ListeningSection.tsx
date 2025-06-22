// src/views/student/mock-test/ListeningSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, RadioGroup, FormControlLabel, Radio, TextField, Grid, Paper } from '@mui/material';

// Define more specific interfaces for better type safety
interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'fill-in-the-blank'; // Add other types as needed
  options?: string[]; // For multiple-choice questions
}

interface ListeningSectionData {
  id: string; // e.g., 'sec1', 'sec2'
  audio: string; // URL or filename of the audio for this section
  questions: Question[];
}

interface ListeningSectionProps {
  data: { sections: ListeningSectionData[] }; // Use the defined interface
  onAnswersChange: (answers: { [key: string]: string }) => void;
  isTestActive: boolean;
  onSectionEnd: () => void; // Callback to move to next section if timer isn't handled externally
  currentSectionIndex: number; // New prop to track which section is active
}

const ListeningSection: React.FC<ListeningSectionProps> = ({
  data,
  onAnswersChange,
  isTestActive,
  onSectionEnd,
  currentSectionIndex, // Destructure new prop
}) => {
  const [currentAnswers, setCurrentAnswers] = useState<{ [key: string]: string }>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioPlayedOnce, setAudioPlayedOnce] = useState(false); // To ensure audio plays only once per section

  const currentSection = data.sections[currentSectionIndex];

  useEffect(() => {
    // Reset answers and audio state when section changes or test becomes active
    setCurrentAnswers({}); // Important to reset answers for new section
    setAudioPlayedOnce(false); // Allow audio to play for the new section
    setAudioPlaying(false); // Reset playing state

    // Logic to auto-play audio for the current section when it becomes active
    if (isTestActive && currentSection && audioRef.current && !audioPlayedOnce) {
      audioRef.current.load(); // Load the new audio source
      audioRef.current.play()
        .then(() => {
          setAudioPlaying(true);
          setAudioPlayedOnce(true); // Mark that this audio has started playing once
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          // Handle error, e.g., show message to user
        });
    }
  }, [isTestActive, currentSection, audioPlayedOnce]); // Dependency on currentSection to re-trigger

  const handleAudioEnded = () => {
    setAudioPlaying(false);
    // Optionally, call onSectionEnd here if the audio ending directly signals the end of the section
    // In IELTS, after audio, there's usually a short time to review, then section moves.
    // The parent timer usually handles this.
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setCurrentAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  useEffect(() => {
    onAnswersChange(currentAnswers);
  }, [currentAnswers, onAnswersChange]);

  if (!data || !data.sections || data.sections.length === 0) {
    return <Typography>No listening test data available.</Typography>;
  }

  // Ensure currentSection is valid before rendering
  if (!currentSection) {
    return <Typography>No data for current listening section.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Listening Test</Typography>
      <Typography variant="body1" paragraph>
        You will hear a recording and answer the questions. The recording will play only once.
      </Typography>

      {/* Audio player for the current section - NO CONTROLS for real test simulation */}
      {currentSection.audio && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Listen to the audio (Section {currentSection.id.replace('sec', '')}):</Typography>
          <audio
            ref={audioRef}
            src={`/audios/${currentSection.audio}`} // Dynamic audio source
            onPlay={() => setAudioPlaying(true)}
            onEnded={handleAudioEnded}
            // NO controls attribute for real IELTS simulation
            // autoPlay // You might add this here, but manage it with useEffect for better control
          />
          <Typography variant="caption" display="block" mt={1}>
            (In a real test, the audio plays automatically and cannot be paused/rewound by the student)
          </Typography>
          {/* Optional: A loading/playing indicator */}
          {!audioPlaying && audioPlayedOnce && (
            <Typography variant="body2" color="textSecondary">Audio has finished playing for this section.</Typography>
          )}
          {/* Added a button to manually start audio if auto-play fails or is not desired initially */}
          {!audioPlaying && !audioPlayedOnce && isTestActive && (
             <Button onClick={() => audioRef.current?.play()} disabled={audioPlaying || audioPlayedOnce}>
                Start Audio
             </Button>
          )}
        </Paper>
      )}

      {/* Render questions for the current section */}
      <Box key={currentSection.id} sx={{ mb: 4 }}>
        <Typography variant="h6" mt={2} mb={2}>Section {currentSection.id.replace('sec', '')} Questions:</Typography>
        {currentSection.questions.map((q: Question) => (
          <Box key={q.id} sx={{ mb: 2 }}>
            {/* Added question number for clarity */}
            <Typography variant="subtitle1" component="label" htmlFor={q.id}>
              Q{q.id.replace('q', '')}. {q.text}
            </Typography>
            {q.type === 'multiple-choice' && (
              <RadioGroup
                name={q.id}
                value={currentAnswers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              >
                {q.options?.map((option: string) => (
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

      {/* The 'Next Section' button is managed by the parent MockTest component's timer */}
    </Box>
  );
};

export default ListeningSection;