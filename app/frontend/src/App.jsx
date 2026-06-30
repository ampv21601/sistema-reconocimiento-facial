import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { VideoProvider } from './context/VideoContext';
import Layout from './components/Layout';
import VideoPlayer from './components/VideoPlayer';
import AddPersonForm from './components/AddPersonForm';
import PersonLogs from './components/PersonLogs';
import RegisteredPersons from './components/RegisteredPersons';
import { appColors } from './theme/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: appColors.primary,
    },
    secondary: {
      main: appColors.secondary,
    },
    background: {
      default: appColors.background,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <VideoProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<VideoPlayer />} />
              <Route path="/add-person" element={<AddPersonForm />} />
              <Route path="/registered-persons" element={<RegisteredPersons />} />
              <Route path="/logs" element={<PersonLogs />} />
            </Routes>
          </Layout>
        </Router>
      </VideoProvider>
    </ThemeProvider>
  );
}

export default App;