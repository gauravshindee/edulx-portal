// src/views/student/MockTest.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Grid, Stepper, Step, StepLabel, LinearProgress, CircularProgress } from '@mui/material';
import { useAuth } from 'src/context/AuthContext'; // Assuming you have an AuthContext
import { useNavigate } from 'react-router-dom';

// Import individual section components (assuming they are now correctly typed)
import ListeningSection from './mock-test/ListeningSection';
import ReadingSection from './mock-test/ReadingSection';
import WritingSection from './mock-test/WritingSection';
import SpeakingSection from './mock-test/SpeakingSection';

// Define the steps for the test
const steps = ['Listening', 'Reading', 'Writing', 'Speaking'];

// Define test durations in minutes
export const TEST_DURATIONS = {
  Listening: 30, // minutes
  Reading: 60, // minutes
  Writing: 60, // minutes
  Speaking: 15, // minutes (total duration including prep/speaking parts)
};

// Define interfaces for better type safety
interface ListeningAnswers {
  [questionId: string]: string; // e.g., { 'lq1': 'optionA' }
}

interface ReadingAnswers {
  [questionId: string]: string | boolean; // e.g., { 'rq1': 'True' }
}

interface WritingAnswers {
  task1: string;
  task2: string;
}

interface SpeakingAnswers {
  [part: string]: string | null; // e.g., { 'part1': 'blob:http://...', 'part2': 'blob:http://...' }
}

// Assuming these interfaces exist based on previous discussions
interface ListeningSectionData {
  id: string; // e.g., 'sec1', 'sec2'
  audio: string; // URL or filename of the audio for this section
  questions: any[]; // Replace 'any' with actual Question type from ListeningSection
}
interface ListeningMockData {
  sections: ListeningSectionData[];
}

interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  questions: any[]; // Replace 'any' with actual ReadingQuestion type from ReadingSection
}
interface ReadingMockData {
  passages: ReadingPassage[];
}

interface WritingTaskMockData {
  id: string;
  type: string;
  prompt: string;
}
interface WritingMockData {
  task1: WritingTaskMockData;
  task2: WritingTaskMockData;
}

interface Part1MockData { questions: string[]; }
interface Part2MockData { cueCard: string; prompts: string[]; }
interface Part3MockData { questions: string[]; }
interface SpeakingMockData {
  part1: Part1MockData;
  part2: Part2MockData;
  part3: Part3MockData;
}

interface MockTestData {
  listening: ListeningMockData;
  reading: ReadingMockData;
  writing: WritingMockData;
  speaking: SpeakingMockData;
}


const MockTest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [currentSectionTime, setCurrentSectionTime] = useState(0); // in seconds

  const [listeningAnswers, setListeningAnswers] = useState<ListeningAnswers>({});
  const [readingAnswers, setReadingAnswers] = useState<ReadingAnswers>({});
  const [writingAnswers, setWritingAnswers] = useState<WritingAnswers>({ task1: '', task2: '' });
  const [speakingAnswers, setSpeakingAnswers] = useState<SpeakingAnswers>({});

  const [mockTestData, setMockTestData] = useState<MockTestData | null>(null);

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


  // handleNextSection and handlePrevSection now only update the activeStep
  // The timer logic is handled by a separate useEffect
  const handleNextSection = useCallback(() => {
    setActiveStep((prevActiveStep) => {
      const nextActiveStep = prevActiveStep + 1;
      if (nextActiveStep < steps.length) {
        return nextActiveStep;
      } else {
        // Test completed
        setTestCompleted(true);
        setTestStarted(false); // Stop the test
        handleSubmitTest();
        return prevActiveStep; // Stay on the last step visually for a moment
      }
    });
  }, [steps.length, handleSubmitTest]);


  const handlePrevSection = useCallback(() => {
    setActiveStep((prevActiveStep) => {
      const prevStep = prevActiveStep - 1;
      if (prevStep >= 0) {
        return prevStep;
      }
      return prevActiveStep; // Don't go below 0
    });
  }, []); // No need for sectionTimerId here as timer logic is separate


  // --- useEffect for fetching test data ---
  useEffect(() => {
    const fetchTestData = async () => {
      const data = await simulateFetchIELTSTestData();
      setMockTestData(data as MockTestData); // Cast to MockTestData
      // Initial time will be set when handleStartTest is called or in the timer useEffect
    };

    fetchTestData();

    // No need for clearInterval here, as the timer useEffect handles its own cleanup.
  }, []); // Empty dependency array means this runs once on mount


  // --- useEffect for timer logic ---
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (testStarted && activeStep < steps.length) {
      if (currentSectionTime > 0) {
        timer = setInterval(() => {
          setCurrentSectionTime((prevTime) => prevTime - 1);
        }, 1000);
      } else if (currentSectionTime === 0) {
        // Timer for current section ran out, move to next
        handleNextSection();
      }
    }

    // Cleanup function for the timer
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
    // Dependencies: `activeStep` and `testStarted` to re-trigger timer setup when section changes or test starts/stops.
    // `currentSectionTime` is intentionally excluded to prevent the effect from re-running every second,
    // as `setCurrentSectionTime` is called inside the interval.
    // `handleNextSection` is a dependency because it's called within the effect.
  }, [testStarted, activeStep, steps.length, handleNextSection]);


  // --- useEffect to update currentSectionTime when activeStep changes ---
  useEffect(() => {
    if (testStarted && activeStep < steps.length && mockTestData) {
      setCurrentSectionTime(TEST_DURATIONS[steps[activeStep] as keyof typeof TEST_DURATIONS] * 60);
    }
  }, [activeStep, testStarted, mockTestData, steps.length]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    setTestStarted(true);
    // Set initial time for the first section
    setCurrentSectionTime(TEST_DURATIONS[steps[activeStep] as keyof typeof TEST_DURATIONS] * 60);
  };

  if (!user) {
    navigate('/login'); // Redirect unauthenticated users
    return null;
  }

  if (!mockTestData) {
    return (
      <Box className="flex justify-center items-center h-[80vh]">
        <CircularProgress />
        <Typography variant="h6" className="ml-2">Loading mock test data...</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-4 md:p-8">
      <Typography variant="h4" className="mb-4">
        IELTS Mock Test
      </Typography>

      <Paper elevation={3} className="p-4 md:p-6 mb-8 bg-white dark:bg-dark-paper shadow-md dark:shadow-dark-md rounded-md">
        {/* Stepper with custom styles for yellow and green based on dashboard images */}
        <Stepper activeStep={activeStep} alternativeLabel className="mb-4 md:mb-6">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    color: index === activeStep ? 'var(--color-primary)' : (index < activeStep ? '#4CAF50' : '#e0e0e0'),
                    '&.Mui-completed': { color: '#4CAF50' },
                    '&.Mui-active': { color: 'var(--color-primary)' },
                  }
                }}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: index === activeStep ? 'var(--color-primary)' : (index < activeStep ? '#4CAF50' : 'text.secondary'),
                    '&.Mui-completed': { color: '#4CAF50' },
                    '&.Mui-active': { color: 'var(--color-primary)' },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {!testStarted && !testCompleted && (
          <Box className="text-center mt-4 md:mt-8">
            <Typography variant="h5" className="mb-2">Ready to start your IELTS Mock Test?</Typography>
            <Button
              variant="contained"
              className="bg-primary hover:bg-yellow-600 text-white rounded-lg capitalize px-6 py-3 text-lg"
              onClick={handleStartTest}
              size="large"
            >
              Start Test
            </Button>
            <Typography variant="body2" className="mt-2 text-bodytext dark:text-gray-300">
              This mock test simulates the full IELTS exam. Ensure you have a stable internet connection and a quiet environment.
            </Typography>
          </Box>
        )}

        {testStarted && !testCompleted && (
          <Box>
            {/* Timer and Navigation Buttons */}
            <Grid container spacing={2} alignItems="center" className="mb-4 md:mb-6">
              {/* @ts-ignore */}
<Grid item xs={12} sm={6} component="div">
                <Typography variant="h6" className="text-dark dark:text-white">
                  {steps[activeStep]} Section - Time Remaining: {formatTime(currentSectionTime)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(currentSectionTime / (TEST_DURATIONS[steps[activeStep] as keyof typeof TEST_DURATIONS] * 60)) * 100}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'var(--color-border-light)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
              </Grid>
              {/* @ts-ignore */}
<Grid item xs={12} sm={6} className="text-center sm:text-right" component="div">
                <Button
                  variant="outlined"
                  className="border-primary text-primary hover:bg-primary/10 hover:border-yellow-600 mr-1 mb-2 sm:mb-0 rounded-lg capitalize"
                  onClick={handlePrevSection}
                  disabled={activeStep === 0}
                >
                  Previous Section
                </Button>
                <Button
                  variant="contained"
                  className="bg-primary hover:bg-yellow-600 text-white rounded-lg capitalize"
                  onClick={handleNextSection}
                  // Disable 'Next' if it's the last section AND timer hasn't run out.
                  // If timer is 0, handleNextSection will be called by useEffect anyway.
                  disabled={activeStep === steps.length - 1}
                >
                  {activeStep === steps.length - 1 ? 'Finish Test' : 'Next Section'}
                </Button>
              </Grid>
            </Grid>

            {/* Render current section component based on activeStep */}
            {activeStep === 0 && mockTestData.listening && (
              <ListeningSection
                data={mockTestData.listening}
                onAnswersChange={setListeningAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection} // This allows section to signal completion
                currentSectionIndex={0} // Assuming Listening has 1 main section for simplicity in this component
              />
            )}
            {activeStep === 1 && mockTestData.reading && (
              <ReadingSection
                data={mockTestData.reading}
                onAnswersChange={setReadingAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection}
              />
            )}
            {activeStep === 2 && mockTestData.writing && (
              <WritingSection
                data={mockTestData.writing}
                onAnswersChange={setWritingAnswers}
                isTestActive={testStarted}
                onSectionEnd={handleNextSection}
              />
            )}
            {activeStep === 3 && mockTestData.speaking && (
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
          <Box className="text-center mt-4 md:mt-8">
            <Typography variant="h5" className="text-green-600 mb-2">
              Mock Test Completed!
            </Typography>
            <Typography variant="body1" className="text-bodytext dark:text-gray-300">
              Your answers have been submitted for review. You can check your results soon.
            </Typography>
            <Button
              variant="contained"
              className="bg-primary hover:bg-yellow-600 text-white rounded-lg capitalize mt-6"
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
            // Add more sections/questions for a full listening test
          ]
        },
        reading: {
          passages: [
            { id: 'rp1', title: 'Passage 1: The History of Space Travel', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.', questions: [{ id: 'rq1', type: 'true-false', text: 'Humans landed on Mars in 1969.' }] },
            { id: 'rp2', title: 'Passage 2: Renewable Energy Sources', content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.', questions: [{ id: 'rq2', type: 'short-answer', text: 'What are two common types of renewable energy?' }] },
            // Add more passages/questions
          ]
        },
        writing: {
          task1: { id: 'wt1', type: 'report', prompt: 'The chart below shows the amount of money spent on different leisure activities in the UK between 1980 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.' },
          task2: { id: 'wt2', type: 'essay', prompt: 'Some people believe that the best way to improve public health is by increasing the number of sports facilities. Others argue that this is not enough and other measures are required. Discuss both these views and give your own opinion.' },
        },
        speaking: {
          part1: { id: 'sp1', questions: ['What is your full name?', 'Can you tell me where you come from?', 'Do you work or study?', 'What kind of music do you like?'] },
          part2: { id: 'sp2', cueCard: 'Describe a place you have visited that you would recommend to others.', prompts: ['You should say:', '- where it is', '- when you visited it', '- what you did there', '- and explain why you would recommend it.'] },
          part3: { id: 'sp3', questions: ['Let\'s talk about tourism in general. What are some popular tourist destinations in your country?', 'How has tourism changed over the past few decades?', 'What are the environmental impacts of tourism, and how can they be minimized?'] },
        }
      });
    }, 1500); // Simulate network delay
  });
};