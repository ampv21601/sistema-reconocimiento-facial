import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { VideoProvider } from './context/VideoContext';
import Layout from './components/Layout';
import VideoPlayer from './components/VideoPlayer';
import AddPersonForm from './components/AddPersonForm';
import PersonLogs from './components/PersonLogs';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f5f5',
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
              <Route path="/logs" element={<PersonLogs />} />
            </Routes>
          </Layout>
        </Router>
      </VideoProvider>
    </ThemeProvider>
  );
}

export default App;