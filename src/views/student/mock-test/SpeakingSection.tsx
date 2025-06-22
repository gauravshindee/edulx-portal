// src/views/student/mock-test/SpeakingSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, IconButton, Paper } from '@mui/material'; // Removed Divider as it was unused
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';

// Imported TEST_DURATIONS from the parent MockTest component
import { TEST_DURATIONS } from '../MockTest';

// Define more specific interfaces for better type safety
interface Part1Data {
  questions: string[];
}

interface Part2Data {
  cueCard: string;
  prompts: string[];
}

interface Part3Data {
  questions: string[];
}

interface SpeakingData {
  part1: Part1Data;
  part2: Part2Data;
  part3: Part3Data;
}

interface SpeakingSectionProps {
  data: SpeakingData; // Use the specific interface
  onAnswersChange: (answers: { [part: string]: string | null }) => void; // Answers are audio URLs
  isTestActive: boolean;
  onSectionEnd: () => void;
}

const SpeakingSection: React.FC<SpeakingSectionProps> = ({ data, onAnswersChange, isTestActive, onSectionEnd }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Changed from useRef to useState to trigger UI re-renders
  const [currentPart, setCurrentPart] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [part2PrepTime, setPart2PrepTime] = useState<number>(60); // 1 minute for Part 2 prep
  const [part2SpeakTime, setPart2SpeakTime] = useState<number>(120); // 2 minutes for Part 2 speaking

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        audioChunksRef.current = []; // Clear chunks for next recording
        onAnswersChange((prev: { [key: string]: string | null }) => ({
          ...prev,
          [`part${currentPart}`]: url, // Use currentPart state here
        }));
      };
      // Keep stream active to avoid re-requesting access on every recording start/stop
      // If you need to release the microphone after the test, manage the stream's lifecycle.
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied. Please enable microphone permissions for this site to take the Speaking test.');
      return false;
    }
  };

  const startRecording = async () => {
    if (!mediaRecorderRef.current) {
      const granted = await requestMicrophoneAccess();
      if (!granted) return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      audioChunksRef.current = []; // Clear previous chunks
      setAudioURL(null); // Clear previous recording URL in UI
      mediaRecorderRef.current.start();
      setRecording(true);
      console.log('Recording started...');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      console.log('Recording stopped.');
    }
  };

  const playRecording = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play();
    }
  };

  const downloadRecording = () => {
    if (audioURL) {
      const a = document.createElement('a');
      a.href = audioURL;
      a.download = `ielts-speaking-part-${currentPart}-recording.wav`; // Use currentPart state
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // Logic to move through speaking parts and display questions
  useEffect(() => {
    if (!isTestActive || !data) return;

    let partTimer: NodeJS.Timeout | undefined; // For general part transitions
    let prepInterval: NodeJS.Timeout | undefined; // For Part 2 preparation timer
    let speakInterval: NodeJS.Timeout | undefined; // For Part 2 speaking timer

    const setupPart = (part: number) => {
      // Clear any previous timers to prevent multiple timers running
      if (partTimer) clearTimeout(partTimer);
      if (prepInterval) clearInterval(prepInterval);
      if (speakInterval) clearInterval(speakInterval);

      // Reset part 2 timers when setting up a new part
      setPart2PrepTime(60);
      setPart2SpeakTime(120);

      switch (part) {
        case 1:
          setCurrentQuestion(data.part1.questions[0]); // Display first question of Part 1
          // Simulate a short duration for Part 1 or wait for explicit "Next Speaking Part" click
          // This timer handles the automatic transition if not manually advanced
          partTimer = setTimeout(() => {
            setCurrentPart(2); // Automatically move to Part 2
          }, 15 * 1000); // Example: 15 seconds for initial Part 1 prompt and answer expectation
          break;
        case 2:
          // Part 2: Cue card + 1 min prep + 2 min talk
          setCurrentQuestion(`Part 2: You will have 1 minute to prepare. Then, you will speak for 1 to 2 minutes.`);
          let currentPrep = 60;
          setPart2PrepTime(currentPrep);

          prepInterval = setInterval(() => {
            currentPrep--;
            setPart2PrepTime(currentPrep);
            if (currentPrep <= 0) {
              clearInterval(prepInterval);
              setCurrentQuestion(`Part 2: Speak about: "${data.part2.cueCard}" (You have 2 minutes to speak)`);
              let currentSpeak = 120;
              setPart2SpeakTime(currentSpeak);

              speakInterval = setInterval(() => {
                currentSpeak--;
                setPart2SpeakTime(currentSpeak);
                if (currentSpeak <= 0) {
                  clearInterval(speakInterval);
                  setCurrentPart(3); // Automatically move to Part 3
                }
              }, 1000);
            }
          }, 1000);
          break;
        case 3:
          setCurrentQuestion(data.part3.questions[0]); // Display first question of Part 3
          // This timer signals the end of the entire speaking section
          partTimer = setTimeout(() => {
            onSectionEnd(); // Signal the end of the speaking section
          }, TEST_DURATIONS.Speaking * 1000); // Ensures the speaking section has a total duration
          break;
        default:
          onSectionEnd(); // Fallback to end section if an invalid part is somehow reached
          break;
      }
    };

    // Initialize or re-setup the part when `currentPart` or `isTestActive` changes
    setupPart(currentPart);

    // Cleanup function: Clear all timers when the effect cleans up or re-runs
    return () => {
      if (partTimer) clearTimeout(partTimer);
      if (prepInterval) clearInterval(prepInterval);
      if (speakInterval) clearInterval(speakInterval);
      // It's also good practice to stop the MediaRecorder and release the stream
      // when the component unmounts or the test ends.
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isTestActive, data, onSectionEnd, currentPart]); // Dependencies: currentPart is crucial here

  if (!data) {
    return <Typography>No speaking test data available.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Speaking Test</Typography>
      <Typography variant="body1" paragraph>
        This section is a simulated interview. Record your answers to the prompts.
      </Typography>

      <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mb: 4 }}> {/* Responsive padding */}
        <Typography variant="h6" mb={2}>Part {currentPart}:</Typography> {/* Use currentPart state */}
        <Typography variant="body1" mb={2} sx={{ color: '#FBCC32', fontWeight: 'bold' }}>
          {currentPart === 1 && currentQuestion}
          {currentPart === 2 && (
              <>
                <Typography variant="subtitle1" sx={{mb:1}}>Cue Card: {data.part2.cueCard}</Typography>
                {data.part2.prompts.map((p: string, idx: number) => (
                  <Typography key={idx} variant="body2" sx={{ml:2}}>{p}</Typography>
                ))}
                <Typography variant="caption" display="block" mt={1}>
                  {part2PrepTime > 0 ? `Preparation Time: ${part2PrepTime} seconds` : `Speaking Time: ${part2SpeakTime} seconds`}
                </Typography>
              </>
          )}
          {currentPart === 3 && currentQuestion}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#4CAF50', // Success green
              color: 'white',
              '&:hover': {
                backgroundColor: '#388E3C', // Darker green for hover
              },
              flexGrow: 1,
              borderRadius: '8px',
              textTransform: 'none',
            }}
            startIcon={<MicIcon />}
            onClick={startRecording}
            disabled={recording}
          >
            Start Recording
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#F44336', // Error red
              color: 'white',
              '&:hover': {
                backgroundColor: '#D32F2F', // Darker red for hover
              },
              flexGrow: 1,
              borderRadius: '8px',
              textTransform: 'none',
            }}
            startIcon={<StopIcon />}
            onClick={stopRecording}
            disabled={!recording}
          >
            Stop Recording
          </Button>
          {audioURL && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <IconButton sx={{ color: '#FBCC32' }} onClick={playRecording} disabled={recording}>
                <PlayArrowIcon />
              </IconButton>
              <IconButton sx={{ color: '#2196F3' }} onClick={downloadRecording} disabled={recording}>
                <DownloadIcon />
              </IconButton>
              <Typography variant="caption" ml={1}>Recording Ready</Typography>
            </Box>
          )}
        </Box>
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', textAlign: { xs: 'center', sm: 'left' } }}>
          Your recording will be saved for review.
        </Typography>
      </Paper>

      {/* Manual button to advance parts (useful for testing or explicit user control) */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        {currentPart < 3 && ( // Only show if not in the last part of speaking test
          <Button
            variant="outlined"
            sx={{
              borderColor: '#FBCC32',
              color: '#FBCC32',
              '&:hover': {
                backgroundColor: 'rgba(251, 204, 50, 0.08)',
                borderColor: '#E0B22C',
              },
              borderRadius: '8px',
              textTransform: 'none',
            }}
            onClick={() => {
              stopRecording(); // Stop current recording before moving to next part
              setCurrentPart(prev => prev + 1); // Increment part using state
              // The `useEffect` will handle setting the new question and timers for the next part
            }}>
            Next Speaking Part
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SpeakingSection;