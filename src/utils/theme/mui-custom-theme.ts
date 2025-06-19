// src/utils/theme/mui-custom-theme.ts
import { createTheme } from '@mui/material/styles';

const muiCustomTheme = createTheme({
  palette: {
    primary: {
      main: '#FBCC32', // Your specific yellow/orange accent color
      light: '#FFDA66',
      dark: '#E0B22C',
      contrastText: '#fff',
    },
    secondary: {
      main: '#607D8B', // A suitable complementary color
      light: '#90A4AE',
      dark: '#455A64',
      contrastText: '#fff',
    },
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#F44336',
    },
    background: {
      default: '#f5f5f5', // Overall app background
      paper: '#fff',     // Card/Paper backgrounds
    },
  },
  typography: {
    fontFamily: [
      'Roboto', // Ensure this matches your Flowbite/overall app font
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 10,
          borderRadius: 5,
          backgroundColor: '#e0e0e0',
        },
        bar: {
          backgroundColor: '#4CAF50',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          '&.Mui-active': {
            color: '#FBCC32',
          },
          '&.Mui-completed': {
            color: '#4CAF50',
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#e0e0e0',
          '&.Mui-active': {
            color: '#FBCC32',
          },
          '&.Mui-completed': {
            color: '#4CAF50',
          },
        },
      },
    },
  },
});

export default muiCustomTheme;