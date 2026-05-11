import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, Avatar, useMediaQuery, useTheme } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HistoryIcon from '@mui/icons-material/History';
import FaceIcon from '@mui/icons-material/Face';

const Layout = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navItems = [
    { path: '/', label: isMobile ? 'Video' : 'Reproductor', icon: <VideoLibraryIcon /> },
    { path: '/add-person', label: isMobile ? 'Añadir' : 'Añadir Persona', icon: <PersonAddIcon /> },
    { path: '/logs', label: isMobile ? 'Historial' : 'Historial', icon: <HistoryIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="sticky" elevation={0} sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Toolbar>
          <Avatar sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <FaceIcon />
          </Avatar>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            FaceRecognition System
          </Typography>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              component={Link}
              to={item.path}
              startIcon={item.icon}
              sx={{
                mx: isMobile ? 0.5 : 1,
                px: isMobile ? 1 : 2,
                py: isMobile ? 0.5 : 1,
                borderRadius: 2,
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1, px: { xs: 1, sm: 3 } }}>
        {children}
      </Container>
      
      <Box component="footer" sx={{ 
        py: 3, 
        px: 2, 
        mt: 'auto', 
        backgroundColor: 'primary.main',
        color: 'white',
        textAlign: 'center'
      }}>
        <Typography variant="body2">
          Sistema de Reconocimiento Facial © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;