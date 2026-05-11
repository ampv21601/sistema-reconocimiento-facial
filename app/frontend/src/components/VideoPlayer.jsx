import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Fab,
  Zoom,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';

const DetectionOverlay = styled(Box)(({ theme, detection }) => ({
  position: 'absolute',
  top: 20,
  left: 20,
  padding: '10px 20px',
  borderRadius: 8,
  backgroundColor: detection === 'green' ? '#4caf50' : detection === 'red' ? '#f44336' : '#9e9e9e',
  color: 'white',
  fontWeight: 'bold',
  zIndex: 10,
  boxShadow: theme.shadows[3],
  transition: 'all 0.3s ease',
}));

const VideoPlayer = () => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detection, setDetection] = useState(null);
  const [message, setMessage] = useState('');
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectionInterval = useRef(null);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setMessage('Video cargado correctamente');
      setTimeout(() => setMessage(''), 3000);
      
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    } else {
      setMessage('Por favor, selecciona un archivo de video válido');
    }
  };

  // Simulación de detección cada 2 segundos cuando el video se reproduce
  useEffect(() => {
    if (isPlaying && videoUrl) {
      detectionInterval.current = setInterval(() => {
        const random = Math.random();
        if (random > 0.5) {
          setDetection('green');
          setMessage('✅ Persona detectada');
        } else {
          setDetection('red');
          setMessage('❌ No se detectaron personas');
        }
        setTimeout(() => setMessage(''), 2000);
      }, 3000);
    } else if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
    }
    
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [isPlaying, videoUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Reproductor de Video con Detección
        </Typography>

        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleVideoUpload}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current.click()}
          >
            Subir Video
          </Button>
        </Box>

        {message && (
          <Alert severity={detection === 'green' ? 'success' : detection === 'red' ? 'error' : 'info'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {videoUrl && (
          <Box sx={{ position: 'relative' }}>
            <Zoom in={!!detection}>
              <DetectionOverlay detection={detection === 'green' ? 'green' : 'red'}>
                {detection === 'green' ? '🟢 PERSONA DETECTADA' : detection === 'red' ? '🔴 SIN PERSONA' : '🟡 DETECTANDO...'}
              </DetectionOverlay>
            </Zoom>
            
            <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 2 }}>
              <video
                ref={videoRef}
                src={videoUrl}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
              />
            </Paper>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Fab
                color="primary"
                onClick={togglePlayPause}
                size="medium"
              >
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </Fab>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;