import React, { useEffect } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Chip,
  Fade,
  Grow,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import Webcam from 'react-webcam';
import { styled } from '@mui/material/styles';
import { useVideo } from '../context/VideoContext';

const DetectionOverlay = styled(Box)(({ theme, detection }) => ({
  position: 'absolute',
  top: 20,
  left: 20,
  padding: '12px 24px',
  borderRadius: 30,
  backgroundColor: detection === 'green' ? '#4caf50' : detection === 'red' ? '#f44336' : '#9e9e9e',
  color: 'white',
  fontWeight: 'bold',
  zIndex: 10,
  boxShadow: theme.shadows[3],
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(10px)',
  fontSize: '1.1rem',
}));

const VideoContainer = styled(Paper)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 16,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: 4,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(0.99)',
    boxShadow: theme.shadows[10],
  },
}));

const ControlBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 12,
  zIndex: 20,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(10px)',
  padding: '8px 16px',
  borderRadius: 40,
  transition: 'all 0.3s ease',
}));

const VideoPlayer = () => {
  const {
    sourceType,
    videoUrl,
    isPlaying,
    detection,
    detectedPerson,
    message,
    isDetecting,
    webcamEnabled,
    screenshot,
    videoRef,
    webcamRef,
    handleVideoUpload,
    startWebcam,
    stopWebcam,
    captureScreenshot,
    togglePlayPause,
    handleSourceChange,
    setMessage,
    detectionConfidence,
  } = useVideo();

  const fileInputRef = React.useRef(null);

  const onVideoUpload = (event) => {
    const file = event.target.files[0];
    if (handleVideoUpload(file)) {
      event.target.value = ''; // Reset input
    }
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('video-container');
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  // Restaurar tiempo del video si es necesario
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const savedTime = localStorage.getItem('videoCurrentTime');
      if (savedTime) {
        videoRef.current.currentTime = parseFloat(savedTime);
      }
    }
  }, [videoUrl]);

  // Guardar tiempo del video al salir
  useEffect(() => {
    const saveTime = () => {
      if (videoRef.current && videoRef.current.currentTime) {
        localStorage.setItem('videoCurrentTime', videoRef.current.currentTime);
      }
    };
    window.addEventListener('beforeunload', saveTime);
    return () => window.removeEventListener('beforeunload', saveTime);
  }, []);

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Grid container spacing={3}>
        {/* Control Panel */}
        <Grid item xs={12}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            mb: 3
          }}>
            <CardContent>
              <Typography variant="h4" gutterBottom fontWeight="bold">
                Sistema de Reconocimiento Facial
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                Selecciona una fuente de video para comenzar la detección facial en tiempo real
              </Typography>
              
              <ToggleButtonGroup
                value={sourceType}
                exclusive
                onChange={(e, val) => handleSourceChange(val)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  '& .MuiToggleButton-root': {
                    color: 'white',
                    '&.Mui-selected': {
                      backgroundColor: 'white',
                      color: '#667eea',
                    }
                  }
                }}
              >
                <ToggleButton value="upload">
                  <CloudUploadIcon sx={{ mr: 1 }} /> Subir Video
                </ToggleButton>
                <ToggleButton value="webcam">
                  <VideocamIcon sx={{ mr: 1 }} /> Cámara Web
                </ToggleButton>
              </ToggleButtonGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Video Section */}
        <Grid item xs={12} md={8}>
          <VideoContainer elevation={3} id="video-container">
            {sourceType === 'upload' && !videoUrl && (
              <Box sx={{ 
                minHeight: 400, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                p: 4
              }}>
                <input
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={onVideoUpload}
                />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current.click()}
                  sx={{ 
                    borderRadius: 3,
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  Seleccionar Video
                </Button>
                <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                  Formatos soportados: MP4, AVI, MOV
                </Typography>
              </Box>
            )}

            {sourceType === 'upload' && videoUrl && (
              <Box sx={{ position: 'relative' }}>
                <Zoom in={!!detection}>
                  <DetectionOverlay detection={detection === 'green' ? 'green' : 'red'}>
                    {detection === 'green' 
                      ? `🟢 ${detectedPerson || 'Persona Detectada'} ${detectionConfidence > 0 ? `(${detectionConfidence}%)` : ''}` 
                      : detection === 'red' 
                      ? '🔴 SIN PERSONA' 
                      : '🟡 DETECTANDO...'}
                  </DetectionOverlay>
                </Zoom>
                
                <video
                  ref={videoRef}
                  src={videoUrl}
                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 500 }}
                  onPlay={() => console.log('Video playing')}
                  onPause={() => console.log('Video paused')}
                  controls
                />
                
                <ControlBar>
                  <Fab
                    color="primary"
                    onClick={togglePlayPause}
                    size="small"
                  >
                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </Fab>
                  <Fab
                    color="secondary"
                    onClick={toggleFullscreen}
                    size="small"
                  >
                    <FullscreenIcon />
                  </Fab>
                </ControlBar>
              </Box>
            )}

            {sourceType === 'webcam' && (
              <Box sx={{ position: 'relative' }}>
                {!webcamEnabled ? (
                  <Box sx={{ 
                    minHeight: 400, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    p: 4
                  }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<VideocamIcon />}
                      onClick={startWebcam}
                      sx={{ 
                        borderRadius: 3,
                        px: 4,
                        py: 2,
                        fontSize: '1.1rem',
                        backgroundColor: '#4caf50',
                        '&:hover': { backgroundColor: '#45a049' }
                      }}
                    >
                      Activar Cámara Web
                    </Button>
                    <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                      Asegúrate de permitir el acceso a la cámara
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Zoom in={!!detection}>
                      <DetectionOverlay detection={detection === 'green' ? 'green' : 'red'}>
                        {detection === 'green' 
                          ? `🟢 ${detectedPerson || 'Persona Detectada'} ${detectionConfidence > 0 ? `(${detectionConfidence}%)` : ''}` 
                          : detection === 'red' 
                          ? '🔴 SIN PERSONA' 
                          : '🟡 DETECTANDO...'}
                      </DetectionOverlay>
                    </Zoom>
                    
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: "user"
                      }}
                      style={{ width: '100%', height: 'auto', maxHeight: 500, objectFit: 'cover' }}
                    />
                    
                    <ControlBar>
                      <Fab
                        color="secondary"
                        onClick={stopWebcam}
                        size="small"
                      >
                        <StopIcon />
                      </Fab>
                      <Fab
                        color="primary"
                        onClick={captureScreenshot}
                        size="small"
                      >
                        <ScreenshotMonitorIcon />
                      </Fab>
                      <Fab
                        color="info"
                        onClick={toggleFullscreen}
                        size="small"
                      >
                        <FullscreenIcon />
                      </Fab>
                    </ControlBar>
                  </>
                )}
              </Box>
            )}
          </VideoContainer>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado del Sistema
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Fuente Actual
                </Typography>
                <Chip 
                  label={sourceType === 'upload' ? '📹 Video Subido' : '🎥 Cámara Web'}
                  color="primary"
                  sx={{ width: '100%', py: 2 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Estado de Detección
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip 
                    label={detection === 'green' ? 'Activo' : detection === 'red' ? 'Inactivo' : 'Esperando'}
                    color={detection === 'green' ? 'success' : detection === 'red' ? 'error' : 'default'}
                    sx={{ flex: 1, py: 2 }}
                  />
                  {/* {isDetecting && <CircularProgress size={24} />} */}
                </Box>
              </Box>

              {detectedPerson && detection === 'green' && (
                <Grow in={true}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#e8f5e9', 
                    borderRadius: 2,
                    border: '1px solid #4caf50',
                    mb: 2
                  }}>
                    <Typography variant="body2" color="success.main" gutterBottom>
                      Última Detección
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {detectedPerson}
                    </Typography>
                  </Box>
                </Grow>
              )}

              {screenshot && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Última Captura
                  </Typography>
                  <img src={screenshot} alt="Screenshot" style={{ width: '100%', borderRadius: 8 }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {message && (
        <Fade in={true}>
          <Alert 
            severity={message.type || 'info'} 
            sx={{ 
              position: 'fixed', 
              bottom: 20, 
              right: 20, 
              zIndex: 9999,
              minWidth: 300,
              boxShadow: 3
            }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

export default VideoPlayer;