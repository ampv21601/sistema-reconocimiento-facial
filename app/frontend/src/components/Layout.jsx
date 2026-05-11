import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Reproductor', icon: <VideoLibraryIcon /> },
    { path: '/add-person', label: 'Añadir Persona', icon: <PersonAddIcon /> },
    { path: '/logs', label: 'Historial', icon: <HistoryIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Sistema de Reconocimiento Facial
          </Typography>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              component={Link}
              to={item.path}
              startIcon={item.icon}
              sx={{
                mx: 1,
                borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;