// src/views/student/MockTest.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Grid, Stepper, Step, StepLabel, LinearProgress, CircularProgress } from '@mui/material';
import { useAuth } from 'src/context/AuthContext'; // Assuming you have an AuthContext
import { useNavigate } from 'react-router-dom';

// Import individual section components
import ListeningSection from './mock-test/ListeningSection';
import ReadingSection from './mock-test/ReadingSection';
import WritingSection from './mock-test/WritingSection';
import SpeakingSection from './mock-test/SpeakingSection';

// Define the steps for the test
const steps = ['Listening', 'Reading', 'Writing', 'Speaking'];

// Define test durations in minutes
export const TEST_DURATIONS = {
  Listening: 30,
  Reading: 60,
  Writing: 60,
  Speaking: 15,
};

const MockTest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [currentSectionTime, setCurrentSectionTime] = useState(0); // in seconds
  const [sectionTimerId, setSectionTimerId] = useState<NodeJS.Timeout | null>(null);

  const [listeningAnswers, setListeningAnswers] = useState<any>({});
  const [readingAnswers, setReadingAnswers] = useState<any>({});
  const [writingAnswers, setWritingAnswers] = useState<any>({});
  const [speakingAnswers, setSpeakingAnswers] = useState<any>({});

  const [mockTestData, setMockTestData] = useState<any>(null);

  // --- Define handler functions using useCallback BEFORE useEffects that depend on them ---

  const handleSubmitTest = useCallback(() => {
    console.log('Test Completed!');
    console.log('Listening Answers:', listeningAnswers);
    console.log('Reading Answers:', readingAnswers);
    console.log('Writing Answers:', writingAnswers);
    console.log('Speaking Answers:', speakingAnswers);
    // TODO: Send all answers to your backend for scoring and storage
    // You might want to pass the answers to the results page or save them to local storage
    navigate('/student/mock-test-results'); // Redirect to results page
  }, [listeningAnswers, readingAnswers, writingAnswers, speakingAnswers, navigate]);

  const handleNextSection = useCallback(() => {
    // Clear the current section's timer
    if (sectionTimerId) {
      clearInterval(sectionTimerId);
      setSectionTimerId(null);
    }

    setActiveStep((prevActiveStep) => {
      const nextActiveStep = prevActiveStep + 1;
      if (nextActiveStep < steps.length) {
        // Reset timer for the new section
        setCurrentSectionTime(TEST_DURATIONS[steps[nextActiveStep] as keyof typeof TEST_DURATIONS] * 60);
        return nextActiveStep;
      } else {
        // Test completed
        setTestCompleted(true);
        setTestStarted(false);
        handleSubmitTest();
        return prevActiveStep; // Stay on the last step visually for a moment
      }
    });
  }, [sectionTimerId, steps.length, handleSubmitTest]);

  const handlePrevSection = useCallback(() => {
    // Clear the current section's timer
    if (sectionTimerId) {
      clearInterval(sectionTimerId);
      setSectionTimerId(null);
    }

    setActiveStep((prevActiveStep) => {
      const prevStep = prevActiveStep - 1;
      if (prevStep >= 0) {
        // Reset timer for the previous section
        setCurrentSectionTime(TEST_DURATIONS[steps[prevStep] as keyof typeof TEST_DURATIONS] * 60);
        return prevStep;
      }
      return prevActiveStep; // Don't go below 0
    });
  }, [sectionTimerId, steps.length]);


  // --- useEffect for fetching test data ---
  useEffect(() => {
    const fetchTestData = async () => {
      const data = await simulateFetchIELTSTestData();
      setMockTestData(data);
      // Only set initial time if test hasn't started yet and mockTestData is loaded
      if (!testStarted && data) {
        setCurrentSectionTime(TEST_DURATIONS[steps[activeStep] as keyof typeof TEST_DURATIONS] * 60);
      }
    };

    fetchTestData();

    // Cleanup timer on component unmount
    return () => {
      if (sectionTimerId) {
        clearInterval(sectionTimerId);
      }
    };
  }, [activeStep, sectionTimerId, testStarted]);


  // --- useEffect for timer logic ---
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (testStarted && activeStep < steps.length) {
      if (currentSectionTime > 0) {
        timer = setInterval(() => {
          setCurrentSectionTime((prevTime) => prevTime - 1);
        }, 1000);
        setSectionTimerId(timer);
      } else if (currentSectionTime === 0) {
        // If timer runs out for the current section, move to next
        handleNextSection();
      }
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [testStarted, activeStep, currentSectionTime, steps.length, handleNextSection]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    // Ensure currentSectionTime is set correctly on start
    setCurrentSectionTime(TEST_DURATIONS[steps[activeStep] as keyof typeof TEST_DURATIONS] * 60);
  };

  if (!user) {
    navigate('/login'); // Redirect unauthenticated users
    return null;
  }

  if (!mockTestData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading mock test data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}> {/* Responsive padding */}
      <Typography variant="h4" gutterBottom>
        IELTS Mock Test
      </Typography>

      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 4 }}> {/* Responsive padding for Paper */}
        {/* Stepper with custom styles for yellow and green based on dashboard images */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: { xs: 2, md: 3 } }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    color: index === activeStep ? '#FBCC32' : (index < activeStep ? '#4CAF50' : '#e0e0e0'), // Active step yellow, completed green
                    '&.Mui-completed': { color: '#4CAF50' },
                    '&.Mui-active': { color: '#FBCC32' },
                  }
                }}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: index === activeStep ? '#FBCC32' : (index < activeStep ? '#4CAF50' : 'text.secondary'), // Active label yellow, completed green
                    '&.Mui-completed': { color: '#4CAF50' },
                    '&.Mui-active': { color: '#FBCC32' },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {!testStarted && !testCompleted && (
          <Box sx={{ textAlign: 'center', mt: { xs: 2, md: 4 } }}>
            <Typography variant="h5" mb={2}>Ready to start your IELTS Mock Test?</Typography>
            <Button
              variant="contained"
              // Use a specific background color directly, or rely on MUI theme's primary
              sx={{
                backgroundColor: '#FBCC32',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#E0B22C', // A slightly darker yellow for hover
                },
                borderRadius: '8px', // Match your dashboard's button style
                textTransform: 'none', // Prevent uppercase
              }}
              onClick={handleStartTest}
              size="large"
            >
              Start Test
            </Button>
            <Typography variant="body2" mt={2}>
              This mock test simulates the full IELTS exam. Ensure you have a stable internet connection and a quiet environment.
            </Typography>
          </Box>
        )}

        {testStarted && !testCompleted && (
          <Box>
            {/* Timer and Navigation Buttons */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: { xs: 2, md: 3 } }}>
              <Grid item xs={12} sm={6}> {/* Takes full width on small, half on medium+ */}
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                  {steps[activeStep]} Section - Time Remaining: {formatTime(currentSectionTime)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(currentSectionTime / (TEST_DURATIONS[steps[activeStep] as keyof typeof TEST_DURATIONS] * 60)) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0', // Lighter background for the track
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50', // Progress bar green
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'center', sm: 'right' } }}> {/* Centers on small, right aligns on medium+ */}
                <Button
                  variant="outlined" // Outlined for 'Previous' button
                  sx={{
                    borderColor: '#FBCC32', // Outline color to match dashboard yellow
                    color: '#FBCC32', // Text color to match dashboard yellow
                    '&:hover': {
                      backgroundColor: 'rgba(251, 204, 50, 0.08)', // Light yellow hover
                      borderColor: '#E0B22C',
                    },
                    mr: 1,
                    mb: { xs: 1, sm: 0 },
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
                  onClick={handlePrevSection}
                  disabled={activeStep === 0} // Disable if on the first step
                >
                  Previous Section
                </Button>
                <Button
                  variant="contained"
                  // Use a specific background color directly, or rely on MUI theme's primary
                  sx={{
                    backgroundColor: '#FBCC32',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#E0B22C', // A slightly darker yellow for hover
                    },
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
                  onClick={handleNextSection}
                  disabled={activeStep === steps.length - 1 && currentSectionTime > 0} // Disable 'Next' on last section if timer is running
                >
                  {activeStep === steps.length - 1 ? 'Finish Test' : 'Next Section'}
                </Button>
              </Grid>
            </Grid>

            {/* Render current section component based on activeStep */}
            {activeStep === 0 && (
              <ListeningSection
                data={mockTestData.listening}
                onAnswersChange={setListeningAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection}
              />
            )}
            {activeStep === 1 && (
              <ReadingSection
                data={mockTestData.reading}
                onAnswersChange={setReadingAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection}
              />
            )}
            {activeStep === 2 && (
              <WritingSection
                data={mockTestData.writing}
                onAnswersChange={setWritingAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection}
              />
            )}
            {activeStep === 3 && (
              <SpeakingSection
                data={mockTestData.speaking}
                onAnswersChange={setSpeakingAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection}
              />
            )}
          </Box>
        )}

        {testCompleted && (
          <Box sx={{ textAlign: 'center', mt: { xs: 2, md: 4 } }}>
            <Typography variant="h5" sx={{ color: '#4CAF50' }} mb={2}>
              Mock Test Completed!
            </Typography>
            <Typography variant="body1">
              Your answers have been submitted for review. You can check your results soon.
            </Typography>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#FBCC32',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#E0B22C',
                },
                mt: 3,
                borderRadius: '8px',
                textTransform: 'none',
              }}
              onClick={() => navigate('/student/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MockTest;

// --- Placeholder for simulating data fetching ---
const simulateFetchIELTSTestData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        listening: {
          sections: [
            { id: 'sec1', audio: 'audio1.mp3', questions: [{ id: 'lq1', type: 'multiple-choice', text: 'What is the main topic?', options: ['A', 'B', 'C', 'D'] }] },
          ]
        },
        reading: {
          passages: [
            { id: 'rp1', title: 'Passage 1: The History of Space Travel', content: '...', questions: [{ id: 'rq1', type: 'true-false', text: 'Humans landed on Mars in 1969.' }] },
          ]
        },
        writing: {
          task1: { id: 'wt1', type: 'report', prompt: 'Describe the given chart in 150 words.' },
          task2: { id: 'wt2', type: 'essay', prompt: 'Discuss the advantages and disadvantages of online education in 250 words.' },
        },
        speaking: {
          part1: { id: 'sp1', questions: ['What is your full name?', 'Can you tell me where you come from?'] },
          part2: { id: 'sp2', cueCard: 'Describe a place you have visited that you would recommend to others.', prompts: ['You should say:', '- where it is', '- when you visited it', '- what you did there', '- and explain why you would recommend it.'] },
          part3: { id: 'sp3', questions: ['Let\'s talk about tourism in general. What are some popular tourist destinations in your country?'] },
        }
      });
    }, 1500);
  });
};