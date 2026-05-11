import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import VideoPlayer from './components/VideoPlayer';
import AddPersonForm from './components/AddPersonForm';
import PersonLogs from './components/PersonLogs';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<VideoPlayer />} />
            <Route path="/add-person" element={<AddPersonForm />} />
            <Route path="/logs" element={<PersonLogs />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;