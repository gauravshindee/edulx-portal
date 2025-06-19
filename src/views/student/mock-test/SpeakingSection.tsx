// src/views/student/mock-test/SpeakingSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, IconButton, Paper, Divider } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';

// Imported TEST_DURATIONS from the parent MockTest component
import { TEST_DURATIONS } from '../MockTest';

interface SpeakingSectionProps {
  data: any; // Speaking prompts (questions, cue card)
  onAnswersChange: (answers: any) => void;
  isTestActive: boolean;
  onSectionEnd: () => void;
}

const SpeakingSection: React.FC<SpeakingSectionProps> = ({ data, onAnswersChange, isTestActive, onSectionEnd }) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentPartRef = useRef<number>(1); // To track which part of the speaking test
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
        onAnswersChange((prev: any) => ({
          ...prev,
          [`part${currentPartRef.current}`]: url, // Save the URL for the current part
        }));
      };
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
      setAudioURL(null); // Clear previous recording
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
      a.download = `ielts-speaking-part-${currentPartRef.current}-recording.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  // Logic to move through speaking parts and display questions
  useEffect(() => {
    if (!isTestActive || !data) return;

    let timer: NodeJS.Timeout | undefined;

    const simulateExaminer = () => {
      // Clear any previous timer before setting a new one
      if (timer) clearTimeout(timer);

      switch (currentPartRef.current) {
        case 1:
          setCurrentQuestion(data.part1.questions[0]); // Display first question of Part 1
          // Simulate a short duration for Part 1 or wait for explicit "Next Speaking Part" click
          timer = setTimeout(() => {
            if (currentPartRef.current === 1) { // Check if still in Part 1
              currentPartRef.current = 2;
              simulateExaminer();
            }
          }, 5 * 1000); // For example, 5 seconds for a single question prompt
          break;
        case 2:
          // Part 2: Cue card + 1 min prep + 2 min talk
          setCurrentQuestion(`Part 2: You will have 1 minute to prepare. Then, you will speak for 1 to 2 minutes.`);
          let prepTime = 60;
          setPart2PrepTime(prepTime);
          const prepTimer = setInterval(() => {
            prepTime--;
            setPart2PrepTime(prepTime);
            if (prepTime <= 0) {
              clearInterval(prepTimer);
              setCurrentQuestion(`Part 2: Speak about: "${data.part2.cueCard}" (You have 2 minutes to speak)`);
              let speakTime = 120;
              setPart2SpeakTime(speakTime);
              const speakTimer = setInterval(() => {
                speakTime--;
                setPart2SpeakTime(speakTime);
                if (speakTime <= 0) {
                  clearInterval(speakTimer);
                  currentPartRef.current = 3;
                  simulateExaminer();
                }
              }, 1000);
            }
          }, 1000);
          break;
        case 3:
          setCurrentQuestion(data.part3.questions[0]); // Display first question of Part 3
          timer = setTimeout(() => {
            onSectionEnd(); // Signal the end of the speaking section after the full allocated time
          }, TEST_DURATIONS.Speaking * 1000); // Allows roughly the full speaking test duration
          break;
        default:
          break;
      }
    };

    simulateExaminer();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTestActive, data, onSectionEnd]);

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
        <Typography variant="h6" mb={2}>Part {currentPartRef.current}:</Typography>
        <Typography variant="body1" mb={2} sx={{ color: '#FBCC32', fontWeight: 'bold' }}>
          {currentPartRef.current === 1 && currentQuestion}
          {currentPartRef.current === 2 && (
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
          {currentPartRef.current === 3 && currentQuestion}
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

      {/* For navigation between speaking parts, you might need manual buttons or timed transitions */}
      {/* This internal navigation logic can be refined based on actual IELTS speaking flow */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        {currentPartRef.current < 3 && ( // Only show if not in the last part of speaking test
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
            stopRecording();
            currentPartRef.current++;
            setCurrentQuestion(''); // Clear current question for smooth transition
            if (currentPartRef.current === 2) {
                setPart2PrepTime(60);
                setPart2SpeakTime(120);
            }
            setTimeout(() => {
                if (currentPartRef.current === 1) setCurrentQuestion(data.part1.questions[0]);
                if (currentPartRef.current === 3) setCurrentQuestion(data.part3.questions[0]);
            }, 500);
          }}>
            Next Speaking Part
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SpeakingSection;